-- Fix Users Table UPSERT Policy for Authentication
-- This migration fixes the RLS policy to allow UPSERT operations on the users table

-- Drop existing users policies
DROP POLICY IF EXISTS "Users can view own profile" ON users;
DROP POLICY IF EXISTS "Users can update own profile" ON users;
DROP POLICY IF EXISTS "Users can insert own profile" ON users;

-- Create comprehensive policies for users table that support UPSERT
CREATE POLICY "Users can view own profile" ON users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON users
  FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON users
  FOR UPDATE USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Create a policy that allows UPSERT operations (INSERT + UPDATE)
CREATE POLICY "Users can upsert own profile" ON users
  FOR ALL USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Ensure the handle_new_user function can bypass RLS when creating user records
-- Update the function to use SECURITY DEFINER properly
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  -- Insert user record with proper error handling
  INSERT INTO public.users (id, email, name, avatar_url, created_at, updated_at)
  VALUES (
    new.id,
    new.email,
    COALESCE(new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)),
    new.raw_user_meta_data->>'avatar_url',
    now(),
    now()
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    name = COALESCE(EXCLUDED.name, users.name),
    avatar_url = COALESCE(EXCLUDED.avatar_url, users.avatar_url),
    updated_at = now();
  
  -- Create default organization for user if it doesn't exist
  INSERT INTO public.organizations (id, name, slug, created_by, created_at, updated_at)
  VALUES (
    gen_random_uuid(),
    COALESCE(new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)) || '''s Workspace',
    lower(replace(COALESCE(new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)), ' ', '-')) || '-workspace-' || substr(new.id::text, 1, 8),
    new.id,
    now(),
    now()
  )
  ON CONFLICT DO NOTHING;
  
  -- Add user as owner of the organization if not already exists
  INSERT INTO public.user_organizations (user_id, organization_id, role, created_at, updated_at)
  SELECT 
    new.id,
    o.id,
    'owner',
    now(),
    now()
  FROM public.organizations o 
  WHERE o.created_by = new.id 
  AND NOT EXISTS (
    SELECT 1 FROM public.user_organizations uo 
    WHERE uo.user_id = new.id AND uo.organization_id = o.id
  )
  LIMIT 1;
  
  RETURN new;
EXCEPTION
  WHEN OTHERS THEN
    -- Log error but don't fail the auth process
    RAISE WARNING 'Error in handle_new_user: %', SQLERRM;
    RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Ensure the trigger exists
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- Grant necessary permissions for authenticated users
GRANT SELECT, INSERT, UPDATE ON users TO authenticated;
GRANT USAGE ON SCHEMA public TO authenticated;

-- Add index for better performance on user lookups
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_id ON users(id);

-- Ensure RLS is enabled
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
