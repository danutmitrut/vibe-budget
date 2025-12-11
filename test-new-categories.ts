import { autoCategorizeByCategoryName } from "./lib/auto-categorization/categories-rules";

const testTransactions = [
  // Cumpărături (supermarketuri + online + haine + electronice)
  "Kaufland Bucuresti",
  "Lidl Romania",
  "Carrefour Express",
  "Mega Image Sector 3",
  "Cora Hypermarket",
  "eMag Marketplace",
  "Zara Fashion",
  "Altex Electronics",
  "IKEA Mobila",

  // Transport
  "Benzinarie Petrom",
  "Uber Trip",
  "Metrorex Bilet",

  // Locuință (utilități + chirie + renovări)
  "Orange Telefonie",
  "Digi Internet",
  "Enel Energie",
  "Plata intretinere",
  "Chirie Apartament",
  "Leroy Merlin", // Materiale renovare

  // Sănătate
  "Farmacia Catena",
  "Clinica Medicover",
  "Synevo Analize",

  // Divertisment
  "Restaurant Trattoria",
  "Starbucks Coffee",
  "Cinema City",

  // Subscripții
  "Netflix Subscription",
  "Spotify Premium",

  // Educație
  "Librarie Carturesti",
  "Udemy Course",

  // Venituri
  "Salariu",
  "Bonus",

  // Transferuri
  "Transfer de la Maria",
  "Revolut Exchange",

  // Taxe
  "ANAF Impozit",

  // Cash
  "ATM Retragere",
];

console.log("🧪 Test Categorii Noi (2025-12-10):\n");
console.log("=" .repeat(60));

testTransactions.forEach((desc) => {
  const category = autoCategorizeByCategoryName(desc);
  const status = category ? "✅" : "❌";
  console.log(`${status} "${desc}" → ${category || "NU S-A GĂSIT"}`);
});

console.log("\n" + "=".repeat(60));
console.log(`\nTotal testate: ${testTransactions.length}`);
const categorized = testTransactions.filter(d => autoCategorizeByCategoryName(d) !== null).length;
console.log(`Categorizate: ${categorized}/${testTransactions.length} (${Math.round(categorized/testTransactions.length * 100)}%)`);
