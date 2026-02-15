-- ============================================
-- INITIAL SCHEMA: Vibe Budget Database
-- ============================================
-- Generated from lib/db/schema.ts
-- Creates all tables for Vibe Budget application

-- TABELA 1: USERS (Utilizatori)
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  native_currency TEXT NOT NULL DEFAULT 'RON',
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- TABELA 2: BANKS (Bănci)
CREATE TABLE IF NOT EXISTS banks (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  color TEXT DEFAULT '#6366f1',
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- TABELA 3: CURRENCIES (Valute)
CREATE TABLE IF NOT EXISTS currencies (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  code TEXT NOT NULL,
  name TEXT NOT NULL,
  symbol TEXT NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- TABELA 4: CATEGORIES (Categorii)
CREATE TABLE IF NOT EXISTS categories (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'expense',
  color TEXT DEFAULT '#6366f1',
  icon TEXT DEFAULT '📁',
  description TEXT,
  is_system_category BOOLEAN DEFAULT false,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- TABELA 5: TRANSACTIONS (Tranzacții)
CREATE TABLE IF NOT EXISTS transactions (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  bank_id TEXT REFERENCES banks(id) ON DELETE SET NULL,
  category_id TEXT REFERENCES categories(id) ON DELETE SET NULL,
  date DATE NOT NULL,
  description TEXT NOT NULL,
  amount DECIMAL(10, 2) NOT NULL,
  currency TEXT NOT NULL DEFAULT 'RON',
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- TABELA 6: USER_KEYWORDS (Keyword-uri personalizate)
CREATE TABLE IF NOT EXISTS user_keywords (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  keyword TEXT NOT NULL,
  category_id TEXT NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Indexuri pentru performanță
CREATE INDEX IF NOT EXISTS idx_banks_user_id ON banks(user_id);
CREATE INDEX IF NOT EXISTS idx_currencies_user_id ON currencies(user_id);
CREATE INDEX IF NOT EXISTS idx_categories_user_id ON categories(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_user_id ON transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_date ON transactions(date);
CREATE INDEX IF NOT EXISTS idx_transactions_bank_id ON transactions(bank_id);
CREATE INDEX IF NOT EXISTS idx_transactions_category_id ON transactions(category_id);
CREATE INDEX IF NOT EXISTS idx_user_keywords_user_id ON user_keywords(user_id);
CREATE INDEX IF NOT EXISTS idx_user_keywords_keyword ON user_keywords(keyword);
