import { db } from './lib/db';
import { transactions } from './lib/db/schema';
import { desc } from 'drizzle-orm';

async function checkDates() {
  const latest = await db
    .select()
    .from(transactions)
    .orderBy(desc(transactions.created_at))
    .limit(5);
  
  console.log('Latest 5 transactions from DB:');
  latest.forEach(t => {
    console.log({
      id: t.id,
      date: t.date,
      description: t.description.substring(0, 30),
      amount: t.amount,
      created_at: t.created_at
    });
  });
}

checkDates().then(() => process.exit(0)).catch(console.error);
