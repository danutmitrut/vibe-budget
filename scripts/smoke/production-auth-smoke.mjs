#!/usr/bin/env node

const baseUrl = process.env.BASE_URL;

if (!baseUrl) {
  console.error("Missing BASE_URL. Example: BASE_URL=https://vibe-budget.vercel.app");
  process.exit(1);
}

async function check(name, handler) {
  try {
    await handler();
    console.log(`PASS ${name}`);
  } catch (error) {
    console.error(`FAIL ${name}: ${error instanceof Error ? error.message : String(error)}`);
    process.exitCode = 1;
  }
}

await check("login page reachable", async () => {
  const response = await fetch(`${baseUrl}/login`, {
    redirect: "manual",
  });

  if (response.status !== 200) {
    throw new Error(`Expected 200, got ${response.status}`);
  }
});

await check("protected API without auth returns 401", async () => {
  const response = await fetch(`${baseUrl}/api/transactions`, {
    redirect: "manual",
  });

  if (response.status !== 401) {
    throw new Error(`Expected 401, got ${response.status}`);
  }
});

await check("dashboard without auth redirects", async () => {
  const response = await fetch(`${baseUrl}/dashboard`, {
    redirect: "manual",
  });

  if (response.status < 300 || response.status > 399) {
    throw new Error(`Expected redirect status, got ${response.status}`);
  }

  const location = response.headers.get("location") || "";
  if (!location.includes("/login")) {
    throw new Error(`Expected redirect to /login, got ${location || "(empty)"}`);
  }
});

if (process.exitCode) {
  process.exit(process.exitCode);
}

console.log("Smoke checks passed.");
