import { chromium } from 'playwright';

const EMAIL = 'qa-boost-client-2026-04-30@workon.test';
const PASSWORD = 'WorkOn2026Test!';
const MISSION_ID = 'lm_02f3b20ba9294bb7';
const BASE = 'https://workonapp.vercel.app';

function pass(m) { console.log('  ✅', m); }
function fail(m) { console.error('  ❌', m); process.exitCode = 1; }
function info(m) { console.log('  •', m); }

async function dismissCookies(page) {
  for (let i = 0; i < 5; i++) {
    const refuse = page.getByRole('button', { name: /Refuser/i });
    if (await refuse.isVisible().catch(() => false)) {
      await refuse.click({ force: true }).catch(() => {});
      await page.waitForSelector('[role="dialog"][aria-label*="cookie"]', { state: 'hidden', timeout: 3000 }).catch(() => {});
      return;
    }
    await page.waitForTimeout(400);
  }
}

async function login(page) {
  await page.goto(`${BASE}/login`, { waitUntil: 'domcontentloaded' });
  await dismissCookies(page);
  await page.fill('input[type=email]', EMAIL);
  await page.fill('input[type=password]', PASSWORD);
  await page.getByRole('button', { name: 'Se connecter' }).click({ force: true });
  await page.waitForURL(/\/home|\/map|\/missions/, { timeout: 15000 });
}

async function expectModalOpenWithStripe(page, label) {
  // Modal is detected by presence of the X "Fermer" close-button + the
  // boost label heading. Then we wait for either a Stripe iframe or an
  // error state to appear.
  await page.waitForTimeout(1500);
  const closeBtn = await page.getByRole('button', { name: 'Fermer' }).count();
  if (closeBtn === 0) {
    fail(`${label}: modal didn't open`);
    return false;
  }
  pass(`${label}: modal opened`);

  // Stripe PaymentElement renders inside an iframe with name like __privateStripeFrame
  const stripeIframeAppeared = await Promise.race([
    page.waitForSelector('iframe[name^="__privateStripeFrame"]', { timeout: 10000 }).then(() => true),
    page.waitForSelector('text=/Stripe.*not configured|Erreur/', { timeout: 10000 }).then(() => false),
  ]).catch(() => null);

  if (stripeIframeAppeared === true) {
    pass(`${label}: Stripe Elements loaded (PaymentElement iframe present)`);
    return true;
  } else if (stripeIframeAppeared === false) {
    fail(`${label}: error state visible (Stripe key missing or backend failed)`);
    return false;
  } else {
    fail(`${label}: neither Stripe iframe nor error showed up within 10s`);
    return false;
  }
}

(async () => {
  const browser = await chromium.launch({ headless: true });
  const ctx = await browser.newContext({ viewport: { width: 414, height: 896 } });
  const page = await ctx.newPage();

  const errors = [];
  page.on('pageerror', e => errors.push(`PAGE: ${e.message}`));
  page.on('console', m => {
    if (m.type() === 'error') {
      const t = m.text();
      if (!t.includes('Permissions policy') && !t.includes('hydration') &&
          !t.includes('cookies are blocked') && !t.includes('cookie')) {
        errors.push(`CONSOLE: ${t.slice(0, 250)}`);
      }
    }
  });

  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('TEST 1 — URGENT_9 ($9) on /missions/[id]');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  await login(page);
  pass(`logged in (employer), at ${page.url()}`);

  await page.goto(`${BASE}/missions/${MISSION_ID}`, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(2500);

  if (await page.getByText("Quelque chose s'est mal passé").isVisible().catch(() => false)) {
    fail('mission detail page crashed');
    await page.screenshot({ path: 'C:/tmp/boost-mission-error.png' });
    process.exit(1);
  }
  pass('mission detail loaded');

  await page.screenshot({ path: 'C:/tmp/boost-mission-page.png' });

  const urgentBtn = page.getByRole('button', { name: /Urgent 9 \$/i });
  if (await urgentBtn.count() === 0) {
    fail('"Urgent 9 $" button not visible — owner CTA missing');
    process.exit(1);
  }
  pass('"Urgent 9 $" button visible');
  await urgentBtn.click({ force: true });

  if (await expectModalOpenWithStripe(page, 'URGENT_9')) {
    await page.screenshot({ path: 'C:/tmp/boost-urgent-modal.png' });
  }
  // Close
  await page.getByRole('button', { name: 'Fermer' }).first().click({ force: true }).catch(() => {});
  await page.waitForTimeout(800);

  console.log('');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('TEST 2 — TOP_48H_14 ($14) on /missions/[id]');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  const topBtn = page.getByRole('button', { name: /Top 48h 14 \$/i });
  if (await topBtn.count() === 0) {
    fail('"Top 48h 14 $" button not visible');
  } else {
    pass('"Top 48h 14 $" button visible');
    await topBtn.click({ force: true });
    if (await expectModalOpenWithStripe(page, 'TOP_48H_14')) {
      await page.screenshot({ path: 'C:/tmp/boost-top-modal.png' });
    }
    await page.getByRole('button', { name: 'Fermer' }).first().click({ force: true }).catch(() => {});
    await page.waitForTimeout(800);
  }

  console.log('');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('TEST 3 — VERIFY_EXPRESS_19 ($19) on /settings/subscription');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  await page.goto(`${BASE}/settings/subscription`, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(2500);

  if (await page.getByText("Quelque chose s'est mal passé").isVisible().catch(() => false)) {
    fail('subscription page crashed');
  } else {
    pass('subscription page loaded');
    await page.screenshot({ path: 'C:/tmp/boost-subscription-page.png' });
  }

  // Find a button that triggers verifyBoostOpen — text varies but should mention "vérification" or 19
  const verifyBtn = page.getByRole('button').filter({ hasText: /Vérification|Vérif|19\s*\$/i });
  const verifyCount = await verifyBtn.count();
  info(`verify-related buttons: ${verifyCount}`);
  if (verifyCount > 0) {
    await verifyBtn.first().click({ force: true });
    if (await expectModalOpenWithStripe(page, 'VERIFY_EXPRESS_19')) {
      await page.screenshot({ path: 'C:/tmp/boost-verify-modal.png' });
    }
    await page.getByRole('button', { name: 'Fermer' }).first().click({ force: true }).catch(() => {});
  } else {
    fail('No "Vérification express" CTA found on /settings/subscription');
  }

  console.log('');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('TEST 4 — Return URL /settings/subscription?boost=1');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  await page.goto(`${BASE}/settings/subscription?boost=1`, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(2500);
  const success = await page.getByText(/boost.*activ|paiement.*confirm|achat.*confirm/i).count();
  if (success > 0) {
    pass('?boost=1 shows confirmation message');
  } else {
    info('?boost=1 has no special handler (refetch silently?)');
    // not a hard fail — just info
  }
  await page.screenshot({ path: 'C:/tmp/boost-return-url.png' });

  console.log('');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('TEST 5 — /boosts page renders history');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  await page.goto(`${BASE}/boosts`, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(2000);
  const boostsPage = await page.getByText(/Mes boosts|boost/i).count();
  if (boostsPage > 0) {
    pass('/boosts page renders');
    await page.screenshot({ path: 'C:/tmp/boost-history-page.png' });
  } else {
    fail('/boosts page empty');
  }
  // Check upsell card CTAs
  const upsellLinks = await page.locator('[data-testid^="boost-upsell-"]').count();
  info(`upsell cards visible: ${upsellLinks}`);

  console.log('');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('Console errors collected:');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  const dedup = [...new Set(errors)];
  if (dedup.length === 0) {
    pass('no significant console errors');
  } else {
    for (const e of dedup.slice(0, 12)) console.log(`  ⚠️ ${e}`);
  }

  await browser.close();
  console.log('');
  console.log(process.exitCode === 1 ? '❌ TESTS FAILED' : '✅ ALL BOOST TESTS PASSED');
})().catch(e => { console.error('FATAL:', e); process.exit(1); });
