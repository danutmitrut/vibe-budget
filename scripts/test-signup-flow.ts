import { chromium } from 'playwright';

async function testSignupFlow() {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    console.log('🔍 Testing signup flow on Vercel...\n');

    // Navigate to signup page
    await page.goto('https://vibe-budget-main.vercel.app/register');
    await page.waitForLoadState('networkidle');

    console.log('✅ Page loaded');

    // Fill signup form
    await page.fill('input[type="text"]', 'Test User');
    await page.fill('input[type="email"]', 'test' + Date.now() + '@example.com');
    await page.fill('input[type="password"]', 'TestPassword123!');

    console.log('✅ Form filled');

    // Screenshot before submit
    await page.screenshot({ path: '/Users/danmitrut/signup-before.png' });

    // Submit form
    await page.click('button[type="submit"]');

    // Wait for navigation or error
    await page.waitForTimeout(3000);

    // Screenshot after submit
    await page.screenshot({ path: '/Users/danmitrut/signup-after.png' });

    // Check current URL
    const currentUrl = page.url();
    console.log('Current URL:', currentUrl);

    // Check for errors
    const errorElement = await page.locator('text=/eroare|error/i').first();
    const errorVisible = await errorElement.isVisible().catch(() => false);

    if (errorVisible) {
      const errorText = await errorElement.textContent();
      console.log('❌ Error found:', errorText);
    }

    // Check if redirected to dashboard
    if (currentUrl.includes('/dashboard')) {
      console.log('✅ Redirected to dashboard');

      // Try to access banks page
      await page.goto('https://vibe-budget-main.vercel.app/dashboard/banks');
      await page.waitForLoadState('networkidle');

      await page.screenshot({ path: '/Users/danmitrut/banks-page.png' });

      const banksError = await page.locator('text=/eroare|error/i').first();
      const banksErrorVisible = await banksError.isVisible().catch(() => false);

      if (banksErrorVisible) {
        const banksErrorText = await banksError.textContent();
        console.log('❌ Banks page error:', banksErrorText);
      } else {
        console.log('✅ Banks page loaded successfully');
      }
    } else {
      console.log('❌ Not redirected to dashboard');
    }

    // Keep browser open for 10 seconds to inspect
    await page.waitForTimeout(10000);

  } catch (error) {
    console.error('❌ Test failed:', error);
    await page.screenshot({ path: '/Users/danmitrut/error.png' });
  } finally {
    await browser.close();
  }
}

testSignupFlow();
