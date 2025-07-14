-- Verification Script for Supabase RLS Migration
-- Run this after applying the migration to verify everything works

-- 1. Check if users table exists and has correct structure
SELECT 
  column_name, 
  data_type, 
  is_nullable, 
  column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
  AND table_name = 'users'
ORDER BY ordinal_position;

-- 2. Verify RLS is enabled on users table
SELECT 
  schemaname, 
  tablename, 
  rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
  AND tablename = 'users';

-- 3. Check all RLS policies on users table
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies 
WHERE tablename = 'users'
ORDER BY policyname;

-- 4. Verify the upsert_user_profile function exists
SELECT 
  proname as function_name,
  pronargs as num_arguments,
  prorettype::regtype as return_type,
  prosecdef as security_definer
FROM pg_proc 
WHERE proname = 'upsert_user_profile';

-- 5. Verify the handle_new_user function exists
SELECT 
  proname as function_name,
  pronargs as num_arguments,
  prorettype::regtype as return_type,
  prosecdef as security_definer
FROM pg_proc 
WHERE proname = 'handle_new_user';

-- 6. Check if trigger exists
SELECT 
  trigger_name,
  event_manipulation,
  action_timing,
  action_statement
FROM information_schema.triggers 
WHERE trigger_name = 'on_auth_user_created';

-- 7. Verify indexes exist
SELECT 
  indexname,
  indexdef
FROM pg_indexes 
WHERE tablename = 'users' 
  AND schemaname = 'public';

-- 8. Check permissions on users table
SELECT 
  grantee,
  privilege_type,
  is_grantable
FROM information_schema.table_privileges 
WHERE table_schema = 'public' 
  AND table_name = 'users'
  AND grantee = 'authenticated';

-- 9. Test function permissions (this will show if authenticated role can execute)
SELECT 
  routine_name,
  routine_type,
  security_type
FROM information_schema.routines 
WHERE routine_schema = 'public' 
  AND routine_name IN ('upsert_user_profile', 'handle_new_user');

-- 10. Summary check - should return 'SUCCESS' if everything is configured correctly
SELECT 
  CASE 
    WHEN (
      SELECT COUNT(*) FROM pg_policies WHERE tablename = 'users'
    ) >= 4 
    AND (
      SELECT COUNT(*) FROM pg_proc WHERE proname = 'upsert_user_profile'
    ) = 1
    AND (
      SELECT COUNT(*) FROM pg_proc WHERE proname = 'handle_new_user'
    ) = 1
    AND (
      SELECT COUNT(*) FROM information_schema.triggers WHERE trigger_name = 'on_auth_user_created'
    ) = 1
    THEN 'SUCCESS: Migration applied correctly'
    ELSE 'ERROR: Migration incomplete'
  END as migration_status;
