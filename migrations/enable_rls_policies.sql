-- ============================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- Vibe Budget - Securitate Complete
-- ============================================

-- 1. ACTIVARE RLS PE TOATE TABELELE
-- ============================================

ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE banks ENABLE ROW LEVEL SECURITY;
ALTER TABLE currencies ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_keywords ENABLE ROW LEVEL SECURITY;

-- 2. POLITICI PENTRU TABELA: users
-- ============================================
-- SCOP: Fiecare user vede doar propriul profil

-- SELECT: User poate citi propriul profil
CREATE POLICY "Users can view their own profile"
ON users FOR SELECT
USING (auth.uid()::text = id);

-- UPDATE: User poate să-și modifice propriul profil
CREATE POLICY "Users can update their own profile"
ON users FOR UPDATE
USING (auth.uid()::text = id);

-- 3. POLITICI PENTRU TABELA: banks
-- ============================================
-- SCOP: Fiecare user vede doar propriile bănci

-- SELECT: User vede doar băncile proprii
CREATE POLICY "Users can view their own banks"
ON banks FOR SELECT
USING (auth.uid()::text = user_id);

-- INSERT: User poate adăuga bănci doar pentru sine
CREATE POLICY "Users can insert their own banks"
ON banks FOR INSERT
WITH CHECK (auth.uid()::text = user_id);

-- UPDATE: User poate modifica doar băncile proprii
CREATE POLICY "Users can update their own banks"
ON banks FOR UPDATE
USING (auth.uid()::text = user_id);

-- DELETE: User poate șterge doar băncile proprii
CREATE POLICY "Users can delete their own banks"
ON banks FOR DELETE
USING (auth.uid()::text = user_id);

-- 4. POLITICI PENTRU TABELA: currencies
-- ============================================
-- SCOP: Fiecare user vede doar propriile valute

-- SELECT: User vede doar valutele proprii
CREATE POLICY "Users can view their own currencies"
ON currencies FOR SELECT
USING (auth.uid()::text = user_id);

-- INSERT: User poate adăuga valute doar pentru sine
CREATE POLICY "Users can insert their own currencies"
ON currencies FOR INSERT
WITH CHECK (auth.uid()::text = user_id);

-- UPDATE: User poate modifica doar valutele proprii
CREATE POLICY "Users can update their own currencies"
ON currencies FOR UPDATE
USING (auth.uid()::text = user_id);

-- DELETE: User poate șterge doar valutele proprii
CREATE POLICY "Users can delete their own currencies"
ON currencies FOR DELETE
USING (auth.uid()::text = user_id);

-- 5. POLITICI PENTRU TABELA: categories
-- ============================================
-- SCOP: Fiecare user vede doar propriile categorii

-- SELECT: User vede doar categoriile proprii
CREATE POLICY "Users can view their own categories"
ON categories FOR SELECT
USING (auth.uid()::text = user_id);

-- INSERT: User poate adăuga categorii doar pentru sine
CREATE POLICY "Users can insert their own categories"
ON categories FOR INSERT
WITH CHECK (auth.uid()::text = user_id);

-- UPDATE: User poate modifica doar categoriile proprii
CREATE POLICY "Users can update their own categories"
ON categories FOR UPDATE
USING (auth.uid()::text = user_id);

-- DELETE: User poate șterge doar categoriile proprii (doar custom, nu system)
CREATE POLICY "Users can delete their own non-system categories"
ON categories FOR DELETE
USING (auth.uid()::text = user_id AND is_system_category = false);

-- 6. POLITICI PENTRU TABELA: transactions
-- ============================================
-- SCOP: Fiecare user vede doar propriile tranzacții

-- SELECT: User vede doar tranzacțiile proprii
CREATE POLICY "Users can view their own transactions"
ON transactions FOR SELECT
USING (auth.uid()::text = user_id);

-- INSERT: User poate adăuga tranzacții doar pentru sine
CREATE POLICY "Users can insert their own transactions"
ON transactions FOR INSERT
WITH CHECK (auth.uid()::text = user_id);

-- UPDATE: User poate modifica doar tranzacțiile proprii
CREATE POLICY "Users can update their own transactions"
ON transactions FOR UPDATE
USING (auth.uid()::text = user_id);

-- DELETE: User poate șterge doar tranzacțiile proprii
CREATE POLICY "Users can delete their own transactions"
ON transactions FOR DELETE
USING (auth.uid()::text = user_id);

-- 7. POLITICI PENTRU TABELA: user_keywords
-- ============================================
-- SCOP: Fiecare user vede doar propriile keyword-uri

-- SELECT: User vede doar keyword-urile proprii
CREATE POLICY "Users can view their own keywords"
ON user_keywords FOR SELECT
USING (auth.uid()::text = user_id);

-- INSERT: User poate adăuga keyword-uri doar pentru sine
CREATE POLICY "Users can insert their own keywords"
ON user_keywords FOR INSERT
WITH CHECK (auth.uid()::text = user_id);

-- UPDATE: User poate modifica doar keyword-urile proprii
CREATE POLICY "Users can update their own keywords"
ON user_keywords FOR UPDATE
USING (auth.uid()::text = user_id);

-- DELETE: User poate șterge doar keyword-urile proprii
CREATE POLICY "Users can delete their own keywords"
ON user_keywords FOR DELETE
USING (auth.uid()::text = user_id);

-- ============================================
-- VERIFICARE: Rulează după aplicarea migration
-- ============================================
--
-- SELECT tablename, policyname, cmd, qual, with_check
-- FROM pg_policies
-- WHERE schemaname = 'public'
-- ORDER BY tablename, policyname;
--
-- Ar trebui să vezi 26 de politici (4-5 per tabelă)
