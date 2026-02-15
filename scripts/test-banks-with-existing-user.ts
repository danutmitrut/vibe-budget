import { chromium } from 'playwright';

async function testBanksPage() {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    console.log('🔍 Testing banks page with existing user...\n');

    // Login with test user
    await page.goto('https://vibe-budget-main.vercel.app/login');
    await page.waitForLoadState('networkidle');

    await page.fill('input[type="email"]', 'test1771173312382@example.com');
    await page.fill('input[type="password"]', 'TestPassword123!');
    await page.click('button[type="submit"]');

    await page.waitForTimeout(3000);

    console.log('✅ Logged in');
    console.log('Current URL:', page.url());

    // Navigate to banks page
    await page.goto('https://vibe-budget-main.vercel.app/dashboard/banks');
    await page.waitForLoadState('networkidle');

    await page.screenshot({ path: '/Users/danmitrut/banks-test-final.png' });

    // Check for errors
    const errorElement = await page.locator('text=/Eroare la încărcarea băncilor/i').first();
    const errorVisible = await errorElement.isVisible().catch(() => false);

    if (errorVisible) {
      console.log('❌ Error found: Eroare la încărcarea băncilor');
    } else {
      console.log('✅ No error - banks page loaded successfully!');
    }

    // Check if we can add a bank
    await page.fill('input[placeholder*="Numele băncii"]', 'Test Bank ING');
    await page.click('button:has-text("Adaugă")');

    await page.waitForTimeout(2000);
    await page.screenshot({ path: '/Users/danmitrut/banks-after-add.png' });

    const bankAdded = await page.locator('text=/Test Bank ING/i').first();
    const bankVisible = await bankAdded.isVisible().catch(() => false);

    if (bankVisible) {
      console.log('✅ Bank added successfully!');
    } else {
      console.log('❌ Failed to add bank');
    }

    // Keep browser open for 5 seconds
    await page.waitForTimeout(5000);

  } catch (error) {
    console.error('❌ Test failed:', error);
    await page.screenshot({ path: '/Users/danmitrut/error-banks.png' });
  } finally {
    await browser.close();
  }
}

testBanksPage();
