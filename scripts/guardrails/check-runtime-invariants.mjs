#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";

const projectRoot = process.cwd();
const targets = [
  "app/api",
  "app/dashboard",
  "lib",
  "middleware.ts",
];

const fileExtensions = new Set([".ts", ".tsx", ".mts", ".cts"]);

const skipPathFragments = [
  `${path.sep}checkpoints${path.sep}`,
  `${path.sep}node_modules${path.sep}`,
  `${path.sep}.next${path.sep}`,
  `${path.sep}lib${path.sep}db${path.sep}`,
  `${path.sep}lib${path.sep}auth${path.sep}get-current-user.ts`,
];

const invariantChecks = [
  {
    name: "legacy db import",
    pattern: /from\s+["']@\/lib\/db["']/g,
    message: "Nu importa @/lib/db în runtime. Folosește Supabase client.",
  },
  {
    name: "legacy auth helper import",
    pattern: /from\s+["']@\/lib\/auth\/get-current-user["']/g,
    message:
      "Nu importa @/lib/auth/get-current-user în runtime. Folosește getSupabaseAuthContext.",
  },
  {
    name: "drizzle import in runtime",
    pattern: /from\s+["']drizzle-orm(?:\/[^"']*)?["']/g,
    message: "Nu folosi drizzle-orm în runtime.",
  },
  {
    name: "inline getAuthUser helper",
    pattern: /async function getAuthUser\s*\(/g,
    message:
      "Nu defini local getAuthUser în endpointuri. Folosește getSupabaseAuthContext.",
  },
  {
    name: "inline getAuthHeaders helper",
    pattern: /const getAuthHeaders\s*=\s*async\s*\(/g,
    message:
      "Nu defini local getAuthHeaders în dashboard. Folosește getAuthHeaders din lib/supabase/auth-headers.",
  },
];

function walk(entryPath) {
  const absolutePath = path.resolve(projectRoot, entryPath);

  if (!fs.existsSync(absolutePath)) {
    return [];
  }

  const stats = fs.statSync(absolutePath);
  if (stats.isFile()) {
    const ext = path.extname(absolutePath);
    return fileExtensions.has(ext) ? [absolutePath] : [];
  }

  const files = [];
  const stack = [absolutePath];

  while (stack.length > 0) {
    const currentPath = stack.pop();
    if (!currentPath) continue;

    const currentStats = fs.statSync(currentPath);
    if (currentStats.isDirectory()) {
      for (const child of fs.readdirSync(currentPath)) {
        stack.push(path.join(currentPath, child));
      }
      continue;
    }

    const ext = path.extname(currentPath);
    if (fileExtensions.has(ext)) {
      files.push(currentPath);
    }
  }

  return files;
}

function shouldSkipFile(filePath) {
  return skipPathFragments.some((fragment) => filePath.includes(fragment));
}

const violations = [];

for (const target of targets) {
  for (const filePath of walk(target)) {
    if (shouldSkipFile(filePath)) continue;

    const content = fs.readFileSync(filePath, "utf8");
    for (const check of invariantChecks) {
      if (check.pattern.test(content)) {
        violations.push({
          filePath: path.relative(projectRoot, filePath),
          message: check.message,
          check: check.name,
        });
      }
    }
  }
}

if (violations.length > 0) {
  console.error("Guardrail failed: runtime invariants violated.\n");
  for (const violation of violations) {
    console.error(
      `- [${violation.check}] ${violation.filePath}: ${violation.message}`
    );
  }
  process.exit(1);
}

console.log("Guardrail passed: runtime invariants are respected.");
