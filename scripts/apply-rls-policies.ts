import postgres from 'postgres';
import { readFileSync } from 'fs';
import { join } from 'path';

const connectionString = 'postgresql://postgres.iumyeqhmpavbhdhcorcq@aws-0-eu-west-1.pooler.supabase.com:6543/postgres';

async function applyRLSPolicies() {
  const sql = postgres(connectionString, {
    prepare: false,
    max: 1,
    ssl: { rejectUnauthorized: false },
  });

  try {
    console.log('🔍 Applying RLS policies...\n');

    // Read SQL file
    const sqlContent = readFileSync(
      join(process.cwd(), 'migrations', '00001_complete_migration.sql'),
      'utf-8'
    );

    // Execute SQL
    await sql.unsafe(sqlContent);

    console.log('✅ RLS policies applied successfully!\n');

    await sql.end();
    process.exit(0);
  } catch (error) {
    console.error('❌ Failed to apply policies!');
    console.error(error);
    await sql.end();
    process.exit(1);
  }
}

applyRLSPolicies();
