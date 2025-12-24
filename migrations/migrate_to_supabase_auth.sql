-- ============================================
-- MIGRATION: Supabase Auth Integration
-- ============================================
-- SCOP: Migrează de la custom auth la Supabase Auth
--
-- IMPORTANT: Rulează ÎNAINTE de a activa RLS policies!

-- STEP 1: Șterge câmpurile custom auth care nu mai sunt necesare
-- ============================================

ALTER TABLE users DROP COLUMN IF EXISTS password;
ALTER TABLE users DROP COLUMN IF EXISTS email_verified;
ALTER TABLE users DROP COLUMN IF EXISTS verification_token;
ALTER TABLE users DROP COLUMN IF EXISTS reset_token;
ALTER TABLE users DROP COLUMN IF EXISTS reset_token_expiry;

-- STEP 2: Actualizează constrangeri pentru ID
-- ============================================
-- ID-ul vine acum de la auth.users, deci nu mai generăm automat

-- Notă: Dacă ai deja users în bază, va trebui să-i migrezi manual
-- sau să recreezi conturile folosind Supabase Auth

-- STEP 3: Verificare
-- ============================================
-- SELECT column_name, data_type, is_nullable
-- FROM information_schema.columns
-- WHERE table_name = 'users'
-- ORDER BY ordinal_position;
