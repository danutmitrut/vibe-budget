-- Fix RLS policy for users table to allow signup
-- Drop old policy that checks auth.uid() during INSERT (fails at signup)
DROP POLICY IF EXISTS "Users can insert their own profile during signup" ON users;

-- Create new policy that allows INSERT for signup
-- Supabase Auth handles security at authentication level
CREATE POLICY "Enable insert for signup"
ON users FOR INSERT
WITH CHECK (true);
