-- ============================================
-- MIGRATION: Disable RLS for Shared Mode
-- ============================================
-- Transformă aplicația din SaaS multi-tenant în shared personal app
-- TOȚI userii autentificați văd TOATE datele

-- Drop toate politicile RLS existente (26 total)

-- USERS table policies (3)
DROP POLICY IF EXISTS "Allow signup insert" ON users;
DROP POLICY IF EXISTS "Users can view their own profile" ON users;
DROP POLICY IF EXISTS "Users can update their own profile" ON users;

-- BANKS table policies (4)
DROP POLICY IF EXISTS "Users can view their own banks" ON banks;
DROP POLICY IF EXISTS "Users can insert their own banks" ON banks;
DROP POLICY IF EXISTS "Users can update their own banks" ON banks;
DROP POLICY IF EXISTS "Users can delete their own banks" ON banks;

-- CURRENCIES table policies (4)
DROP POLICY IF EXISTS "Users can view their own currencies" ON currencies;
DROP POLICY IF EXISTS "Users can insert their own currencies" ON currencies;
DROP POLICY IF EXISTS "Users can update their own currencies" ON currencies;
DROP POLICY IF EXISTS "Users can delete their own currencies" ON currencies;

-- CATEGORIES table policies (4)
DROP POLICY IF EXISTS "Users can view their own categories" ON categories;
DROP POLICY IF EXISTS "Users can insert their own categories" ON categories;
DROP POLICY IF EXISTS "Users can update their own categories" ON categories;
DROP POLICY IF EXISTS "Users can delete their own non-system categories" ON categories;

-- TRANSACTIONS table policies (4)
DROP POLICY IF EXISTS "Users can view their own transactions" ON transactions;
DROP POLICY IF EXISTS "Users can insert their own transactions" ON transactions;
DROP POLICY IF EXISTS "Users can update their own transactions" ON transactions;
DROP POLICY IF EXISTS "Users can delete their own transactions" ON transactions;

-- USER_KEYWORDS table policies (4)
DROP POLICY IF EXISTS "Users can view their own keywords" ON user_keywords;
DROP POLICY IF EXISTS "Users can insert their own keywords" ON user_keywords;
DROP POLICY IF EXISTS "Users can update their own keywords" ON user_keywords;
DROP POLICY IF EXISTS "Users can delete their own keywords" ON user_keywords;

-- TRANSFER_INTERN CATEGORIES table policies (3)
DROP POLICY IF EXISTS "Users can view categories" ON categories;
DROP POLICY IF EXISTS "Users can create categories" ON categories;
DROP POLICY IF EXISTS "Users can update categories" ON categories;

-- ============================================
-- Creează politici SHARED
-- ============================================
-- Toți userii autentificați pot accesa TOATE datele

-- USERS - shared access
CREATE POLICY "Shared: All authenticated users can view all profiles"
ON users FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Shared: Users can update their own profile"
ON users FOR UPDATE
TO authenticated
USING (auth.uid()::text = id);

CREATE POLICY "Shared: Allow signup"
ON users FOR INSERT
TO authenticated, anon
WITH CHECK (true);

-- BANKS - shared access
CREATE POLICY "Shared: All authenticated users can view all banks"
ON banks FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Shared: All authenticated users can create banks"
ON banks FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Shared: All authenticated users can update any bank"
ON banks FOR UPDATE
TO authenticated
USING (true);

CREATE POLICY "Shared: All authenticated users can delete any bank"
ON banks FOR DELETE
TO authenticated
USING (true);

-- CURRENCIES - shared access
CREATE POLICY "Shared: All authenticated users can view all currencies"
ON currencies FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Shared: All authenticated users can create currencies"
ON currencies FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Shared: All authenticated users can update any currency"
ON currencies FOR UPDATE
TO authenticated
USING (true);

CREATE POLICY "Shared: All authenticated users can delete any currency"
ON currencies FOR DELETE
TO authenticated
USING (true);

-- CATEGORIES - shared access
CREATE POLICY "Shared: All authenticated users can view all categories"
ON categories FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Shared: All authenticated users can create categories"
ON categories FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Shared: All authenticated users can update any category"
ON categories FOR UPDATE
TO authenticated
USING (true);

CREATE POLICY "Shared: All authenticated users can delete non-system categories"
ON categories FOR DELETE
TO authenticated
USING (is_system_category = false);

-- TRANSACTIONS - shared access
CREATE POLICY "Shared: All authenticated users can view all transactions"
ON transactions FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Shared: All authenticated users can create transactions"
ON transactions FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Shared: All authenticated users can update any transaction"
ON transactions FOR UPDATE
TO authenticated
USING (true);

CREATE POLICY "Shared: All authenticated users can delete any transaction"
ON transactions FOR DELETE
TO authenticated
USING (true);

-- USER_KEYWORDS - shared access
CREATE POLICY "Shared: All authenticated users can view all keywords"
ON user_keywords FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Shared: All authenticated users can create keywords"
ON user_keywords FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Shared: All authenticated users can update any keyword"
ON user_keywords FOR UPDATE
TO authenticated
USING (true);

CREATE POLICY "Shared: All authenticated users can delete any keyword"
ON user_keywords FOR DELETE
TO authenticated
USING (true);
