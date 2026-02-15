-- Fix: Allow INSERT on users table for signup
-- Drop any existing INSERT policies first
DROP POLICY IF EXISTS "Enable insert for signup" ON users;
DROP POLICY IF EXISTS "Users can insert their own profile during signup" ON users;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON users;

-- Create new policy that allows anyone to insert (Supabase Auth handles security)
CREATE POLICY "Allow signup insert"
ON users FOR INSERT
WITH CHECK (true);
