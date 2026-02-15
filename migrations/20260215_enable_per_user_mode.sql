-- ============================================
-- MIGRATION: Enable Per-User Isolation Mode
-- Date: 2026-02-15
-- ============================================
-- Obiectiv:
-- 1) Elimină politicile Shared Mode
-- 2) Re-aplică politici stricte per-user (RLS)
-- 3) Întărește consistența pentru keyword-uri per user

BEGIN;

-- 1) Enable RLS on all business tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE banks ENABLE ROW LEVEL SECURITY;
ALTER TABLE currencies ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_keywords ENABLE ROW LEVEL SECURITY;

-- 2) Drop shared policies (idempotent)
DROP POLICY IF EXISTS "Shared: All authenticated users can view all profiles" ON users;
DROP POLICY IF EXISTS "Shared: Users can update their own profile" ON users;
DROP POLICY IF EXISTS "Shared: Allow signup" ON users;

DROP POLICY IF EXISTS "Shared: All authenticated users can view all banks" ON banks;
DROP POLICY IF EXISTS "Shared: All authenticated users can create banks" ON banks;
DROP POLICY IF EXISTS "Shared: All authenticated users can update any bank" ON banks;
DROP POLICY IF EXISTS "Shared: All authenticated users can delete any bank" ON banks;

DROP POLICY IF EXISTS "Shared: All authenticated users can view all currencies" ON currencies;
DROP POLICY IF EXISTS "Shared: All authenticated users can create currencies" ON currencies;
DROP POLICY IF EXISTS "Shared: All authenticated users can update any currency" ON currencies;
DROP POLICY IF EXISTS "Shared: All authenticated users can delete any currency" ON currencies;

DROP POLICY IF EXISTS "Shared: All authenticated users can view all categories" ON categories;
DROP POLICY IF EXISTS "Shared: All authenticated users can create categories" ON categories;
DROP POLICY IF EXISTS "Shared: All authenticated users can update any category" ON categories;
DROP POLICY IF EXISTS "Shared: All authenticated users can delete non-system categories" ON categories;

DROP POLICY IF EXISTS "Shared: All authenticated users can view all transactions" ON transactions;
DROP POLICY IF EXISTS "Shared: All authenticated users can create transactions" ON transactions;
DROP POLICY IF EXISTS "Shared: All authenticated users can update any transaction" ON transactions;
DROP POLICY IF EXISTS "Shared: All authenticated users can delete any transaction" ON transactions;

DROP POLICY IF EXISTS "Shared: All authenticated users can view all keywords" ON user_keywords;
DROP POLICY IF EXISTS "Shared: All authenticated users can create keywords" ON user_keywords;
DROP POLICY IF EXISTS "Shared: All authenticated users can update any keyword" ON user_keywords;
DROP POLICY IF EXISTS "Shared: All authenticated users can delete any keyword" ON user_keywords;

-- 3) Drop per-user policies to recreate cleanly (idempotent)
DROP POLICY IF EXISTS "Allow signup insert" ON users;
DROP POLICY IF EXISTS "Users can view their own profile" ON users;
DROP POLICY IF EXISTS "Users can update their own profile" ON users;

DROP POLICY IF EXISTS "Users can view their own banks" ON banks;
DROP POLICY IF EXISTS "Users can insert their own banks" ON banks;
DROP POLICY IF EXISTS "Users can update their own banks" ON banks;
DROP POLICY IF EXISTS "Users can delete their own banks" ON banks;

DROP POLICY IF EXISTS "Users can view their own currencies" ON currencies;
DROP POLICY IF EXISTS "Users can insert their own currencies" ON currencies;
DROP POLICY IF EXISTS "Users can update their own currencies" ON currencies;
DROP POLICY IF EXISTS "Users can delete their own currencies" ON currencies;

DROP POLICY IF EXISTS "Users can view their own categories" ON categories;
DROP POLICY IF EXISTS "Users can insert their own categories" ON categories;
DROP POLICY IF EXISTS "Users can update their own categories" ON categories;
DROP POLICY IF EXISTS "Users can delete their own non-system categories" ON categories;

DROP POLICY IF EXISTS "Users can view their own transactions" ON transactions;
DROP POLICY IF EXISTS "Users can insert their own transactions" ON transactions;
DROP POLICY IF EXISTS "Users can update their own transactions" ON transactions;
DROP POLICY IF EXISTS "Users can delete their own transactions" ON transactions;

DROP POLICY IF EXISTS "Users can view their own keywords" ON user_keywords;
DROP POLICY IF EXISTS "Users can insert their own keywords" ON user_keywords;
DROP POLICY IF EXISTS "Users can update their own keywords" ON user_keywords;
DROP POLICY IF EXISTS "Users can delete their own keywords" ON user_keywords;

-- 4) Recreate strict per-user policies
CREATE POLICY "Allow signup insert"
ON users FOR INSERT
TO authenticated
WITH CHECK (auth.uid()::text = id);

CREATE POLICY "Users can view their own profile"
ON users FOR SELECT
TO authenticated
USING (auth.uid()::text = id);

CREATE POLICY "Users can update their own profile"
ON users FOR UPDATE
TO authenticated
USING (auth.uid()::text = id);

CREATE POLICY "Users can view their own banks"
ON banks FOR SELECT
TO authenticated
USING (auth.uid()::text = user_id);

CREATE POLICY "Users can insert their own banks"
ON banks FOR INSERT
TO authenticated
WITH CHECK (auth.uid()::text = user_id);

CREATE POLICY "Users can update their own banks"
ON banks FOR UPDATE
TO authenticated
USING (auth.uid()::text = user_id);

CREATE POLICY "Users can delete their own banks"
ON banks FOR DELETE
TO authenticated
USING (auth.uid()::text = user_id);

CREATE POLICY "Users can view their own currencies"
ON currencies FOR SELECT
TO authenticated
USING (auth.uid()::text = user_id);

CREATE POLICY "Users can insert their own currencies"
ON currencies FOR INSERT
TO authenticated
WITH CHECK (auth.uid()::text = user_id);

CREATE POLICY "Users can update their own currencies"
ON currencies FOR UPDATE
TO authenticated
USING (auth.uid()::text = user_id);

CREATE POLICY "Users can delete their own currencies"
ON currencies FOR DELETE
TO authenticated
USING (auth.uid()::text = user_id);

CREATE POLICY "Users can view their own categories"
ON categories FOR SELECT
TO authenticated
USING (auth.uid()::text = user_id);

CREATE POLICY "Users can insert their own categories"
ON categories FOR INSERT
TO authenticated
WITH CHECK (auth.uid()::text = user_id);

CREATE POLICY "Users can update their own categories"
ON categories FOR UPDATE
TO authenticated
USING (auth.uid()::text = user_id);

CREATE POLICY "Users can delete their own non-system categories"
ON categories FOR DELETE
TO authenticated
USING (auth.uid()::text = user_id AND is_system_category = false);

CREATE POLICY "Users can view their own transactions"
ON transactions FOR SELECT
TO authenticated
USING (auth.uid()::text = user_id);

CREATE POLICY "Users can insert their own transactions"
ON transactions FOR INSERT
TO authenticated
WITH CHECK (auth.uid()::text = user_id);

CREATE POLICY "Users can update their own transactions"
ON transactions FOR UPDATE
TO authenticated
USING (auth.uid()::text = user_id);

CREATE POLICY "Users can delete their own transactions"
ON transactions FOR DELETE
TO authenticated
USING (auth.uid()::text = user_id);

CREATE POLICY "Users can view their own keywords"
ON user_keywords FOR SELECT
TO authenticated
USING (auth.uid()::text = user_id);

CREATE POLICY "Users can insert their own keywords"
ON user_keywords FOR INSERT
TO authenticated
WITH CHECK (auth.uid()::text = user_id);

CREATE POLICY "Users can update their own keywords"
ON user_keywords FOR UPDATE
TO authenticated
USING (auth.uid()::text = user_id);

CREATE POLICY "Users can delete their own keywords"
ON user_keywords FOR DELETE
TO authenticated
USING (auth.uid()::text = user_id);

-- 5) Ensure keyword uniqueness is scoped to each user
CREATE UNIQUE INDEX IF NOT EXISTS idx_user_keywords_user_keyword_unique
ON user_keywords(user_id, keyword);

COMMIT;
