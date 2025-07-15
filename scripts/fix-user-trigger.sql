-- Fix User Profile Creation Trigger
-- Run this SQL in Supabase SQL Editor to fix the signup flow

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

-- Test the trigger by creating a test user (optional)
-- You can uncomment this to test:
/*
DO $$
DECLARE
  test_user_id UUID;
BEGIN
  -- Create a test user to verify trigger works
  INSERT INTO auth.users (
    id,
    email,
    raw_user_meta_data,
    created_at,
    updated_at,
    email_confirmed_at
  ) VALUES (
    gen_random_uuid(),
    'trigger-test@example.com',
    '{"name": "Trigger Test User", "avatar_url": "https://example.com/avatar.jpg"}',
    NOW(),
    NOW(),
    NOW()
  ) RETURNING id INTO test_user_id;
  
  -- Check if profile was created
  IF EXISTS (SELECT 1 FROM public.users WHERE id = test_user_id) THEN
    RAISE NOTICE 'SUCCESS: Trigger created user profile for %', test_user_id;
  ELSE
    RAISE NOTICE 'FAILED: Trigger did not create user profile for %', test_user_id;
  END IF;
  
  -- Clean up test user
  DELETE FROM auth.users WHERE id = test_user_id;
  
END $$;
*/

-- Add helpful comments
COMMENT ON FUNCTION public.handle_new_user() IS 'Trigger function to create user profile on auth signup';
COMMENT ON FUNCTION public.upsert_user_profile(TEXT, TEXT) IS 'Safe function for client-side user profile updates';

-- Success message
SELECT 'User profile creation trigger has been fixed!' as status;
