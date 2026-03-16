-- Migration: Change transactions.date from TIMESTAMP to DATE
-- Reason: We only need date (YYYY-MM-DD), not timestamp with timezone
-- This fixes NULL dates issue when inserting string dates

-- Step 1: Add temporary column
ALTER TABLE transactions ADD COLUMN date_new DATE;

-- Step 2: Copy data (convert timestamp to date)
UPDATE transactions SET date_new = date::date WHERE date IS NOT NULL;

-- Step 3: Drop old column
ALTER TABLE transactions DROP COLUMN date;

-- Step 4: Rename new column
ALTER TABLE transactions RENAME COLUMN date_new TO date;

-- Step 5: Add NOT NULL constraint
ALTER TABLE transactions ALTER COLUMN date SET NOT NULL;
