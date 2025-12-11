/**
 * Test Script: Verificare categorizare automată
 */

import { autoCategorizeByCategoryName } from "./lib/auto-categorization/categories-rules";

const testTransactions = [
  "eMag Marketplace",
  "Amazon UK",
  "Zara Fashion",
  "Kaufland Bucuresti",
  "Uber Trip",
  "Netflix Subscription",
  "Petrom",
  "Catena",
];

console.log("🧪 Test Categorizare Automată:\n");

testTransactions.forEach((desc) => {
  const category = autoCategorizeByCategoryName(desc);
  console.log(`"${desc}" → ${category || "❌ NU S-A GĂSIT"}`);
});
