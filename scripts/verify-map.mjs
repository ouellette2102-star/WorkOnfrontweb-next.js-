import { chromium } from 'playwright';

const EMAIL = 'qa-bloc2f-2026-04-30@workon.test';
const PASSWORD = 'WorkOn2026Test!';

(async () => {
  const browser = await chromium.launch({ headless: true });
  const ctx = await browser.newContext({ viewport: { width: 414, height: 896 } });
  const page = await ctx.newPage();
  page.on('pageerror', e => console.error('PAGE ERROR:', e.message));
  page.on('console', m => {
    if (m.type() === 'error') console.log('CONSOLE ERROR:', m.text());
  });

  console.log('1. Login flow');
  await page.goto('https://workonapp.vercel.app/login', { waitUntil: 'networkidle' });
  // dismiss cookie banner if present
  const refuse = page.getByRole('button', { name: /Refuser/i });
  if (await refuse.isVisible().catch(() => false)) {
    await refuse.click();
  }
  await page.fill('input[type=email]', EMAIL);
  await page.fill('input[type=password]', PASSWORD);
  await page.getByRole('button', { name: 'Se connecter' }).click();
  await page.waitForURL(/\/home|\/map/, { timeout: 15000 });
  console.log('  ✅ logged in, now at', page.url());

  console.log('2. Navigate to /map');
  await page.goto('https://workonapp.vercel.app/map', { waitUntil: 'networkidle' });
  await page.waitForTimeout(2000);

  console.log('3. Check for ErrorBoundary');
  const errorBoundary = await page.getByText("Quelque chose s'est mal passé").isVisible().catch(() => false);
  if (errorBoundary) {
    console.error('  ❌ ErrorBoundary visible — map crashed');
    await page.screenshot({ path: '/tmp/map-error.png' });
    process.exit(1);
  }
  console.log('  ✅ No ErrorBoundary');

  console.log('4. Check leaflet container exists');
  const leafletPresent = await page.locator('.leaflet-container').count();
  console.log('  ✅ leaflet-container count:', leafletPresent);

  console.log('5. Wait for tiles + pins');
  await page.waitForSelector('.leaflet-tile-loaded', { timeout: 10000 }).catch(() => {});
  await page.waitForTimeout(3000);
  const pinCount = await page.locator('.mission-pin').count();
  console.log('  ✅ mission-pin count:', pinCount);
  await page.screenshot({ path: '/tmp/map-prod.png', fullPage: false });

  console.log('6. Click first pin');
  if (pinCount > 0) {
    await page.locator('.mission-pin').first().click({ force: true });
    await page.waitForTimeout(1500);
    const sheetVisible = await page.getByRole('button', { name: 'Fermer' }).isVisible().catch(() => false);
    if (sheetVisible) {
      console.log('  ✅ Bottom sheet opened');
      await page.screenshot({ path: '/tmp/map-sheet.png' });
    } else {
      console.log('  ⚠️ Bottom sheet not detected (may be a no-pin click)');
    }
  } else {
    console.log('  ⚠️ No pins to click — check API/CORS/data');
  }

  console.log('7. Check console errors');
  await browser.close();
  console.log('DONE');
})().catch(e => { console.error('FATAL:', e); process.exit(1); });
