import { chromium } from 'playwright';

const BASE = 'https://workonapp.vercel.app';

(async () => {
  const browser = await chromium.launch({ headless: true });
  const ctx = await browser.newContext({ viewport: { width: 414, height: 896 } });
  const page = await ctx.newPage();

  console.log('━ Gap 1: /pro/[slug] lead-capture CTA');
  await page.goto(`${BASE}/pro/marc-dubois-montr-al`, { waitUntil: 'domcontentloaded' });
  // Don't dismiss cookies — the form might be below
  await page.waitForTimeout(3000);
  const html = await page.content();
  const hasDemander = /Demander une soumission|Demander un devis|Soumission|Demande/i.test(html);
  const hasContactForm = await page.locator('input[type=tel], input[type="tel"]').count();
  const hasButton = await page.getByRole('button').filter({ hasText: /Envoyer|Demander|Soumettre/i }).count();
  console.log(`  hasDemander text: ${hasDemander}`);
  console.log(`  tel inputs: ${hasContactForm}`);
  console.log(`  submit buttons: ${hasButton}`);

  console.log('\n━ Gap 2: Cookie consent on first load');
  // Fresh context for a true first-load check
  await page.context().clearCookies();
  await page.context().clearPermissions().catch(() => {});
  // Use a fresh page
  const page2 = await ctx.newPage();
  await page2.goto(`${BASE}/`, { waitUntil: 'domcontentloaded' });
  await page2.waitForTimeout(3000);
  const dialogs = await page2.locator('[role="dialog"]').count();
  const cookieDialog = await page2.locator('[role="dialog"][aria-label*="cookie" i], [role="dialog"][aria-label*="onsentement" i]').count();
  const cookieText = await page2.getByText(/cookie|Loi 25/i).count();
  console.log(`  total dialogs: ${dialogs}`);
  console.log(`  cookie dialogs (by aria): ${cookieDialog}`);
  console.log(`  cookie text on page: ${cookieText}`);

  console.log('\n━ Gap 3: Sentry SDK in browser');
  const sentryDetect = await page2.evaluate(() => {
    return {
      windowSentry: typeof (window).Sentry,
      hasSentryFn: typeof (window).Sentry?.captureException,
      hasInternal: !!(window).__SENTRY__,
      sentryHubKeys: Object.keys((window).__SENTRY__ || {}).slice(0, 5),
    };
  });
  console.log(`  ${JSON.stringify(sentryDetect, null, 2)}`);

  await browser.close();
})();
