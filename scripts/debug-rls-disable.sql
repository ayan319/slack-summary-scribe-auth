-- =====================================================
-- DEBUG: Temporarily Disable RLS for Testing
-- Run this in Supabase SQL Editor to debug profile issues
-- =====================================================

-- Check current RLS status
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE tablename = 'users' AND schemaname = 'public';

-- Check existing policies
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE tablename = 'users' AND schemaname = 'public';

-- Temporarily disable RLS for debugging (ONLY FOR LOCAL TESTING)
-- WARNING: DO NOT RUN THIS IN PRODUCTION
ALTER TABLE public.users DISABLE ROW LEVEL SECURITY;

-- Check if users table has data
SELECT id, email, name, created_at 
FROM public.users 
ORDER BY created_at DESC 
LIMIT 10;

-- Check auth.users table
SELECT id, email, created_at, email_confirmed_at
FROM auth.users 
ORDER BY created_at DESC 
LIMIT 10;

-- Re-enable RLS after testing (run this after debugging)
-- ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
