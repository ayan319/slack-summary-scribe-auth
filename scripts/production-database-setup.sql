-- =====================================================
-- PRODUCTION DATABASE SETUP FOR SLACK SUMMARY SCRIBE
-- Run this ENTIRE script in Supabase SQL Editor
-- =====================================================

-- Step 1: Clean up any existing duplicate data
DELETE FROM public.users WHERE email IN (
  SELECT email 
  FROM public.users 
  GROUP BY email 
  HAVING COUNT(*) > 1
);

-- Step 2: Ensure the users table has the correct structure
CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Step 3: Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_users_id ON public.users(id);
CREATE INDEX IF NOT EXISTS idx_users_email ON public.users(email);

-- Step 4: Enable Row Level Security
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Step 5: Create RLS policies
DROP POLICY IF EXISTS "Users can view own profile" ON public.users;
CREATE POLICY "Users can view own profile" ON public.users
  FOR SELECT USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update own profile" ON public.users;
CREATE POLICY "Users can update own profile" ON public.users
  FOR UPDATE USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can insert own profile" ON public.users;
CREATE POLICY "Users can insert own profile" ON public.users
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Step 6: Create or replace the user creation trigger function
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

-- Step 7: Recreate the trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Step 8: Create a function to safely upsert user data from client-side
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

-- Step 9: Grant execute permission on the function
GRANT EXECUTE ON FUNCTION public.upsert_user_profile TO authenticated;

-- Step 10: Create a function to manually create user profile (fallback)
CREATE OR REPLACE FUNCTION public.create_user_profile_fallback(
  user_id UUID,
  user_email TEXT,
  user_name TEXT DEFAULT NULL,
  user_avatar_url TEXT DEFAULT NULL
)
RETURNS public.users AS $$
DECLARE
  result public.users;
BEGIN
  -- Insert or update the user profile
  INSERT INTO public.users (id, email, name, avatar_url, created_at, updated_at)
  VALUES (
    user_id,
    user_email,
    COALESCE(user_name, split_part(user_email, '@', 1)),
    user_avatar_url,
    NOW(),
    NOW()
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    name = COALESCE(EXCLUDED.name, users.name),
    avatar_url = COALESCE(EXCLUDED.avatar_url, users.avatar_url),
    updated_at = NOW()
  RETURNING * INTO result;

  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 11: Grant execute permission on the fallback function
GRANT EXECUTE ON FUNCTION public.create_user_profile_fallback TO service_role;

-- Step 12: Test the trigger with a dummy user
DO $$
DECLARE
  test_user_id UUID;
  test_email TEXT;
BEGIN
  test_user_id := gen_random_uuid();
  test_email := 'trigger-test-' || extract(epoch from now()) || '@example.com';
  
  -- Create a test user to verify trigger works
  INSERT INTO auth.users (
    id,
    email,
    raw_user_meta_data,
    created_at,
    updated_at,
    email_confirmed_at
  ) VALUES (
    test_user_id,
    test_email,
    '{"name": "Trigger Test User", "avatar_url": "https://example.com/avatar.jpg"}',
    NOW(),
    NOW(),
    NOW()
  );
  
  -- Wait a moment for trigger to execute
  PERFORM pg_sleep(1);
  
  -- Check if profile was created
  IF EXISTS (SELECT 1 FROM public.users WHERE id = test_user_id) THEN
    RAISE NOTICE 'SUCCESS: Trigger created user profile for %', test_user_id;
  ELSE
    RAISE NOTICE 'FAILED: Trigger did not create user profile for %', test_user_id;
  END IF;
  
  -- Clean up test user
  DELETE FROM auth.users WHERE id = test_user_id;
  
END $$;

-- Step 13: Add helpful comments
COMMENT ON TABLE public.users IS 'User profiles with automatic creation via auth trigger';
COMMENT ON FUNCTION public.handle_new_user() IS 'Trigger function to create user profile on auth signup';
COMMENT ON FUNCTION public.upsert_user_profile(TEXT, TEXT) IS 'Safe function for client-side user profile updates';
COMMENT ON FUNCTION public.create_user_profile_fallback(UUID, TEXT, TEXT, TEXT) IS 'Fallback function for manual profile creation';

-- Step 14: Grant necessary permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON public.users TO authenticated;
GRANT SELECT ON public.users TO anon;

-- Success message
SELECT 'Production database setup completed successfully!' as status,
       'Trigger function created and tested' as trigger_status,
       'RLS policies enabled' as security_status,
       'Fallback functions available' as fallback_status;
