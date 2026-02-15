#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";

const projectRoot = process.cwd();

const contractChecks = [
  {
    file: "app/api/transactions/route.ts",
    requiredSnippets: ["normalizeTransactionRecord", '.eq("user_id", profile.id)'],
  },
  {
    file: "app/api/transactions/[id]/route.ts",
    requiredSnippets: ["normalizeTransactionRecord", '.eq("user_id", profile.id)'],
  },
  {
    file: "app/api/transactions/bulk-delete/route.ts",
    requiredSnippets: ['.eq("user_id", profile.id)'],
  },
  {
    file: "app/api/transactions/recategorize/route.ts",
    requiredSnippets: ['.eq("user_id", profile.id)'],
  },
  {
    file: "app/api/categories/route.ts",
    requiredSnippets: ["normalizeCategoryRecord", '.eq("user_id", profile.id)'],
  },
  {
    file: "app/api/categories/[id]/route.ts",
    requiredSnippets: ['.eq("user_id", user.id)'],
  },
  {
    file: "app/api/banks/route.ts",
    requiredSnippets: ["normalizeBankRecord", '.eq("user_id", user.id)'],
  },
  {
    file: "app/api/banks/[id]/route.ts",
    requiredSnippets: ['.eq("user_id", user.id)'],
  },
  {
    file: "app/api/currencies/route.ts",
    requiredSnippets: ["normalizeCurrencyRecord", '.eq("user_id", user.id)'],
  },
  {
    file: "app/api/currencies/[id]/route.ts",
    requiredSnippets: ['.eq("user_id", user.id)'],
  },
  {
    file: "app/api/reports/stats/route.ts",
    requiredSnippets: ['.eq("user_id", profile.id)'],
  },
  {
    file: "app/api/reports/pivot/route.ts",
    requiredSnippets: ['.eq("user_id", profile.id)'],
  },
  {
    file: "app/api/ai/budget-recommendations/route.ts",
    requiredSnippets: ['.eq("user_id", profile.id)'],
  },
  {
    file: "app/api/ai/health-score/route.ts",
    requiredSnippets: ['.eq("user_id", profile.id)'],
  },
  {
    file: "app/api/ai/anomaly-detection/route.ts",
    requiredSnippets: ['.eq("user_id", profile.id)'],
  },
  {
    file: "app/api/user-keywords/route.ts",
    requiredSnippets: ['.eq("user_id", profile.id)'],
  },
  {
    file: "app/dashboard/transactions/page.tsx",
    requiredSnippets: ["normalizeTransactionRecord"],
    forbiddenSnippets: ["transaction.bank_id", "transaction.category_id"],
  },
];

const violations = [];

for (const check of contractChecks) {
  const absolutePath = path.resolve(projectRoot, check.file);
  if (!fs.existsSync(absolutePath)) {
    violations.push({
      file: check.file,
      message: "Fișier lipsă pentru contract check.",
    });
    continue;
  }

  const content = fs.readFileSync(absolutePath, "utf8");

  for (const snippet of check.requiredSnippets || []) {
    if (!content.includes(snippet)) {
      violations.push({
        file: check.file,
        message: `Lipsește invariant-ul de contract: ${snippet}`,
      });
    }
  }

  for (const snippet of check.forbiddenSnippets || []) {
    if (content.includes(snippet)) {
      violations.push({
        file: check.file,
        message: `Contract drift detectat (${snippet}). Folosește normalizer-ul.`,
      });
    }
  }
}

if (violations.length > 0) {
  console.error("Guardrail failed: API/UI contract checks failed.\n");
  for (const violation of violations) {
    console.error(`- ${violation.file}: ${violation.message}`);
  }
  process.exit(1);
}

console.log("Guardrail passed: API/UI contracts are normalized.");
