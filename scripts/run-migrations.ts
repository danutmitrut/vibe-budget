import postgres from 'postgres';
import { readFileSync } from 'fs';
import { join } from 'path';

const connectionString = 'postgresql://postgres.iumyeqhmpavbhdhcorcq@aws-0-eu-west-1.pooler.supabase.com:6543/postgres';

async function runMigrations() {
  const sql = postgres(connectionString, {
    prepare: false,
    max: 1,
    ssl: { rejectUnauthorized: false },
  });

  try {
    console.log('🔍 Running initial schema migration...\n');

    // Read SQL file
    const sqlContent = readFileSync(
      join(process.cwd(), 'migrations', '00000_initial_schema.sql'),
      'utf-8'
    );

    // Execute SQL
    await sql.unsafe(sqlContent);

    console.log('✅ Initial schema created successfully!\n');

    // Now run RLS policies migration
    console.log('🔍 Running RLS policies migration...\n');

    const rlsContent = readFileSync(
      join(process.cwd(), 'migrations', '00001_complete_migration.sql'),
      'utf-8'
    );

    await sql.unsafe(rlsContent);

    console.log('✅ RLS policies applied successfully!\n');

    console.log('🎉 All migrations completed!\n');

    await sql.end();
    process.exit(0);
  } catch (error) {
    console.error('❌ Migration failed!');
    console.error(error);
    await sql.end();
    process.exit(1);
  }
}

runMigrations();
