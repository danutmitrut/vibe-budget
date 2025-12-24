-- ============================================
-- COMPLETE MIGRATION: Supabase Auth + RLS
-- ============================================
-- Combinare migration 1 + migration 2

-- ============================================
-- PART 1: Migrate to Supabase Auth
-- ============================================

ALTER TABLE users DROP COLUMN IF EXISTS password;
ALTER TABLE users DROP COLUMN IF EXISTS email_verified;
ALTER TABLE users DROP COLUMN IF EXISTS verification_token;
ALTER TABLE users DROP COLUMN IF EXISTS reset_token;
ALTER TABLE users DROP COLUMN IF EXISTS reset_token_expiry;

-- ============================================
-- PART 2: Enable RLS + Create Policies
-- ============================================

ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE banks ENABLE ROW LEVEL SECURITY;
ALTER TABLE currencies ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_keywords ENABLE ROW LEVEL SECURITY;

-- USERS policies
CREATE POLICY "Users can view their own profile"
ON users FOR SELECT
USING (auth.uid()::text = id);

CREATE POLICY "Users can update their own profile"
ON users FOR UPDATE
USING (auth.uid()::text = id);

-- BANKS policies
CREATE POLICY "Users can view their own banks"
ON banks FOR SELECT
USING (auth.uid()::text = user_id);

CREATE POLICY "Users can insert their own banks"
ON banks FOR INSERT
WITH CHECK (auth.uid()::text = user_id);

CREATE POLICY "Users can update their own banks"
ON banks FOR UPDATE
USING (auth.uid()::text = user_id);

CREATE POLICY "Users can delete their own banks"
ON banks FOR DELETE
USING (auth.uid()::text = user_id);

-- CURRENCIES policies
CREATE POLICY "Users can view their own currencies"
ON currencies FOR SELECT
USING (auth.uid()::text = user_id);

CREATE POLICY "Users can insert their own currencies"
ON currencies FOR INSERT
WITH CHECK (auth.uid()::text = user_id);

CREATE POLICY "Users can update their own currencies"
ON currencies FOR UPDATE
USING (auth.uid()::text = user_id);

CREATE POLICY "Users can delete their own currencies"
ON currencies FOR DELETE
USING (auth.uid()::text = user_id);

-- CATEGORIES policies
CREATE POLICY "Users can view their own categories"
ON categories FOR SELECT
USING (auth.uid()::text = user_id);

CREATE POLICY "Users can insert their own categories"
ON categories FOR INSERT
WITH CHECK (auth.uid()::text = user_id);

CREATE POLICY "Users can update their own categories"
ON categories FOR UPDATE
USING (auth.uid()::text = user_id);

CREATE POLICY "Users can delete their own non-system categories"
ON categories FOR DELETE
USING (auth.uid()::text = user_id AND is_system_category = false);

-- TRANSACTIONS policies
CREATE POLICY "Users can view their own transactions"
ON transactions FOR SELECT
USING (auth.uid()::text = user_id);

CREATE POLICY "Users can insert their own transactions"
ON transactions FOR INSERT
WITH CHECK (auth.uid()::text = user_id);

CREATE POLICY "Users can update their own transactions"
ON transactions FOR UPDATE
USING (auth.uid()::text = user_id);

CREATE POLICY "Users can delete their own transactions"
ON transactions FOR DELETE
USING (auth.uid()::text = user_id);

-- USER_KEYWORDS policies
CREATE POLICY "Users can view their own keywords"
ON user_keywords FOR SELECT
USING (auth.uid()::text = user_id);

CREATE POLICY "Users can insert their own keywords"
ON user_keywords FOR INSERT
WITH CHECK (auth.uid()::text = user_id);

CREATE POLICY "Users can update their own keywords"
ON user_keywords FOR UPDATE
USING (auth.uid()::text = user_id);

CREATE POLICY "Users can delete their own keywords"
ON user_keywords FOR DELETE
USING (auth.uid()::text = user_id);
