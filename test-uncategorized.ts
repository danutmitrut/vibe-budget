import { autoCategorizeByCategoryName } from "./lib/auto-categorization/categories-rules";

const uncategorized = [
  "Cora Hypermarket",
  "Lidl Romania",
  "Carrefour Express",
  "Mega Image Sector 3",
  "Kaufland Bucuresti"
];

console.log("🧪 Test tranzacții necategorizate:\n");

uncategorized.forEach((desc) => {
  const category = autoCategorizeByCategoryName(desc);
  console.log(`"${desc}" → ${category || "❌ NU S-A GĂSIT"}`);
});
