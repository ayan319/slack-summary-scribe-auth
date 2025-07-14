-- Comprehensive Fix for Supabase 403 Forbidden on User Upsert
-- This migration completely resolves RLS policy issues for user operations

-- First, ensure the users table exists with proper structure
CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Drop ALL existing policies to start fresh
DROP POLICY IF EXISTS "Users can view own profile" ON public.users;
DROP POLICY IF EXISTS "Users can update own profile" ON public.users;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.users;
DROP POLICY IF EXISTS "Users can upsert own profile" ON public.users;
DROP POLICY IF EXISTS "Enable read access for users based on user_id" ON public.users;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON public.users;
DROP POLICY IF EXISTS "Enable update for users based on user_id" ON public.users;

-- Ensure RLS is enabled
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Create comprehensive policies that allow all necessary operations
-- Policy 1: Allow users to view their own profile
CREATE POLICY "users_select_own" ON public.users
  FOR SELECT 
  USING (auth.uid() = id);

-- Policy 2: Allow users to insert their own profile
CREATE POLICY "users_insert_own" ON public.users
  FOR INSERT 
  WITH CHECK (auth.uid() = id);

-- Policy 3: Allow users to update their own profile
CREATE POLICY "users_update_own" ON public.users
  FOR UPDATE 
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Policy 4: Allow users to delete their own profile (optional)
CREATE POLICY "users_delete_own" ON public.users
  FOR DELETE 
  USING (auth.uid() = id);

-- Grant necessary permissions to authenticated role
GRANT ALL ON public.users TO authenticated;
GRANT USAGE ON SCHEMA public TO authenticated;

-- Create or replace the user creation trigger function
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Use SECURITY DEFINER to bypass RLS for initial user creation
  INSERT INTO public.users (id, email, name, avatar_url, created_at, updated_at)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'name', NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
    COALESCE(NEW.raw_user_meta_data->>'avatar_url', NEW.raw_user_meta_data->>'picture'),
    NOW(),
    NOW()
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    name = COALESCE(EXCLUDED.name, users.name),
    avatar_url = COALESCE(EXCLUDED.avatar_url, users.avatar_url),
    updated_at = NOW();

  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Log the error but don't fail the authentication
    RAISE WARNING 'Error in handle_new_user: %', SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recreate the trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_users_id ON public.users(id);
CREATE INDEX IF NOT EXISTS idx_users_email ON public.users(email);

-- Create a function to safely upsert user data from client-side
CREATE OR REPLACE FUNCTION public.upsert_user_profile(
  user_name TEXT DEFAULT NULL,
  user_avatar_url TEXT DEFAULT NULL
)
RETURNS public.users AS $$
DECLARE
  result public.users;
BEGIN
  -- Only allow authenticated users to call this function
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  -- Upsert the user profile
  INSERT INTO public.users (id, email, name, avatar_url, created_at, updated_at)
  VALUES (
    auth.uid(),
    auth.email(),
    COALESCE(user_name, split_part(auth.email(), '@', 1)),
    user_avatar_url,
    NOW(),
    NOW()
  )
  ON CONFLICT (id) DO UPDATE SET
    name = COALESCE(EXCLUDED.name, users.name),
    avatar_url = COALESCE(EXCLUDED.avatar_url, users.avatar_url),
    updated_at = NOW()
  RETURNING * INTO result;

  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission on the function
GRANT EXECUTE ON FUNCTION public.upsert_user_profile TO authenticated;

-- Add helpful comments
COMMENT ON TABLE public.users IS 'User profiles with RLS policies for secure access';
COMMENT ON FUNCTION public.handle_new_user() IS 'Trigger function to create user profile on auth signup';
COMMENT ON FUNCTION public.upsert_user_profile(TEXT, TEXT) IS 'Safe function for client-side user profile updates';
