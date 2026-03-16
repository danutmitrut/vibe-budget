-- ============================================
-- SETUP DATABASE - Vibe Budget
-- ============================================
-- Rulează acest fișier DUPĂ crearea proiectului Supabase
-- Creează toate tabelele + activează securitatea (RLS)
-- ============================================

-- ============================================
-- PART 1: CREARE TABELE
-- ============================================

-- Tabela 1: USERS (Utilizatori)
CREATE TABLE IF NOT EXISTS users (
  id text PRIMARY KEY,
  email text NOT NULL UNIQUE,
  name text NOT NULL,
  native_currency text NOT NULL DEFAULT 'RON',
  created_at timestamp NOT NULL DEFAULT now(),
  updated_at timestamp NOT NULL DEFAULT now()
);

-- Tabela 2: BANKS (Bănci)
CREATE TABLE IF NOT EXISTS banks (
  id text PRIMARY KEY,
  user_id text NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name text NOT NULL,
  color text DEFAULT '#6366f1',
  created_at timestamp NOT NULL DEFAULT now(),
  updated_at timestamp NOT NULL DEFAULT now()
);

-- Tabela 3: CURRENCIES (Valute)
CREATE TABLE IF NOT EXISTS currencies (
  id text PRIMARY KEY,
  user_id text NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  code text NOT NULL,
  name text NOT NULL,
  symbol text NOT NULL,
  created_at timestamp NOT NULL DEFAULT now()
);

-- Tabela 4: CATEGORIES (Categorii)
CREATE TABLE IF NOT EXISTS categories (
  id text PRIMARY KEY,
  user_id text NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name text NOT NULL,
  type text NOT NULL DEFAULT 'expense',
  color text DEFAULT '#6366f1',
  icon text DEFAULT '📁',
  description text,
  is_system_category boolean DEFAULT false,
  created_at timestamp NOT NULL DEFAULT now(),
  updated_at timestamp NOT NULL DEFAULT now()
);

-- Tabela 5: TRANSACTIONS (Tranzacții)
CREATE TABLE IF NOT EXISTS transactions (
  id text PRIMARY KEY,
  user_id text NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  bank_id text REFERENCES banks(id) ON DELETE SET NULL,
  category_id text REFERENCES categories(id) ON DELETE SET NULL,
  date date NOT NULL,
  description text NOT NULL,
  amount decimal(10,2) NOT NULL,
  currency text NOT NULL DEFAULT 'RON',
  created_at timestamp NOT NULL DEFAULT now(),
  updated_at timestamp NOT NULL DEFAULT now()
);

-- Tabela 6: USER_KEYWORDS (Keyword-uri auto-categorizare)
CREATE TABLE IF NOT EXISTS user_keywords (
  id text PRIMARY KEY,
  user_id text NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  keyword text NOT NULL,
  category_id text NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
  created_at timestamp NOT NULL DEFAULT now()
);

-- ============================================
-- PART 2: ACTIVARE ROW LEVEL SECURITY (RLS)
-- ============================================

ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE banks ENABLE ROW LEVEL SECURITY;
ALTER TABLE currencies ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_keywords ENABLE ROW LEVEL SECURITY;

-- ============================================
-- PART 3: POLITICI DE SECURITATE
-- ============================================
-- Fiecare user vede doar propriile date

-- USERS
CREATE POLICY "Users can view their own profile"
ON users FOR SELECT USING (auth.uid()::text = id);

CREATE POLICY "Users can update their own profile"
ON users FOR UPDATE USING (auth.uid()::text = id);

CREATE POLICY "Allow signup insert"
ON users FOR INSERT WITH CHECK (auth.uid()::text = id);

-- BANKS
CREATE POLICY "Users can view their own banks"
ON banks FOR SELECT USING (auth.uid()::text = user_id);

CREATE POLICY "Users can insert their own banks"
ON banks FOR INSERT WITH CHECK (auth.uid()::text = user_id);

CREATE POLICY "Users can update their own banks"
ON banks FOR UPDATE USING (auth.uid()::text = user_id);

CREATE POLICY "Users can delete their own banks"
ON banks FOR DELETE USING (auth.uid()::text = user_id);

-- CURRENCIES
CREATE POLICY "Users can view their own currencies"
ON currencies FOR SELECT USING (auth.uid()::text = user_id);

CREATE POLICY "Users can insert their own currencies"
ON currencies FOR INSERT WITH CHECK (auth.uid()::text = user_id);

CREATE POLICY "Users can update their own currencies"
ON currencies FOR UPDATE USING (auth.uid()::text = user_id);

CREATE POLICY "Users can delete their own currencies"
ON currencies FOR DELETE USING (auth.uid()::text = user_id);

-- CATEGORIES
CREATE POLICY "Users can view their own categories"
ON categories FOR SELECT USING (auth.uid()::text = user_id);

CREATE POLICY "Users can insert their own categories"
ON categories FOR INSERT WITH CHECK (auth.uid()::text = user_id);

CREATE POLICY "Users can update their own categories"
ON categories FOR UPDATE USING (auth.uid()::text = user_id);

CREATE POLICY "Users can delete their own non-system categories"
ON categories FOR DELETE USING (auth.uid()::text = user_id AND is_system_category = false);

-- TRANSACTIONS
CREATE POLICY "Users can view their own transactions"
ON transactions FOR SELECT USING (auth.uid()::text = user_id);

CREATE POLICY "Users can insert their own transactions"
ON transactions FOR INSERT WITH CHECK (auth.uid()::text = user_id);

CREATE POLICY "Users can update their own transactions"
ON transactions FOR UPDATE USING (auth.uid()::text = user_id);

CREATE POLICY "Users can delete their own transactions"
ON transactions FOR DELETE USING (auth.uid()::text = user_id);

-- USER_KEYWORDS
CREATE POLICY "Users can view their own keywords"
ON user_keywords FOR SELECT USING (auth.uid()::text = user_id);

CREATE POLICY "Users can insert their own keywords"
ON user_keywords FOR INSERT WITH CHECK (auth.uid()::text = user_id);

CREATE POLICY "Users can update their own keywords"
ON user_keywords FOR UPDATE USING (auth.uid()::text = user_id);

CREATE POLICY "Users can delete their own keywords"
ON user_keywords FOR DELETE USING (auth.uid()::text = user_id);
