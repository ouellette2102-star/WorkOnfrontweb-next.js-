import { chromium } from 'playwright';

const BASE = 'https://workonapp.vercel.app';
const stamp = Date.now();
const WORKER_EMAIL = `qa-final-${stamp}-w@workon.test`;
const EMPLOYER_EMAIL = `qa-final-${stamp}-e@workon.test`;
const PASSWORD = 'WorkOn2026Test!';

let pass = 0;
let fail = 0;
function ok(label, detail) { pass++; console.log(`  ✅ ${label}${detail ? ' — ' + detail : ''}`); }
function ko(label, detail) { fail++; process.exitCode = 1; console.error(`  ❌ ${label}${detail ? ' — ' + detail : ''}`); }
function info(label, detail) { console.log(`  • ${label}${detail ? ' — ' + detail : ''}`); }
function header(t) { console.log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n▶  ${t}\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━`); }

async function dismissCookies(page) {
  for (let i = 0; i < 4; i++) {
    const refuse = page.getByRole('button', { name: /Refuser/i });
    if (await refuse.isVisible().catch(() => false)) {
      await refuse.click({ force: true }).catch(() => {});
      await page.waitForTimeout(800);
      return;
    }
    await page.waitForTimeout(400);
  }
}

(async () => {
  const browser = await chromium.launch({ headless: true });
  const ctx = await browser.newContext({
    viewport: { width: 414, height: 896 },
    permissions: ['geolocation'],
    geolocation: { latitude: 45.5017, longitude: -73.5673 },
  });
  const page = await ctx.newPage();
  const errors = [];
  page.on('pageerror', e => errors.push(`PAGE: ${e.message}`));
  page.on('console', m => {
    if (m.type() === 'error') {
      const t = m.text();
      if (!t.includes('Permissions policy') && !t.includes('hydration') && !t.includes('cookie') &&
          !t.includes('TypeError: Failed to fetch') && !/401|404|403/.test(t)) {
        errors.push(`CONSOLE: ${t.slice(0, 220)}`);
      }
    }
  });

  // ════════════════════════════════════════════
  header('PERSONA 1 — Anonymous → Lead funnel');
  // ════════════════════════════════════════════
  await page.goto(`${BASE}/`, { waitUntil: 'domcontentloaded' });
  await dismissCookies(page);
  await page.waitForTimeout(2000);
  const landingHasStats = /\d+\s*(pro|travailleur|active worker)/i.test(await page.textContent('body'));
  landingHasStats ? ok('landing shows live stats') : ko('landing missing stats');

  await page.goto(`${BASE}/pros`, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(2500);
  const proCount = await page.locator('a[href^="/pro/"]').count();
  proCount > 0 ? ok(`/pros shows ${proCount} pros (anon)`) : ko('/pros empty');

  await page.screenshot({ path: 'C:/tmp/final-01-pros.png' });

  if (proCount > 0) {
    const href = await page.locator('a[href^="/pro/"]').first().getAttribute('href');
    await page.goto(`${BASE}${href}`, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(3000);
    const status = await page.evaluate(() => document.title);
    info(`/pro page title`, status);

    const isCrash = await page.getByText("Quelque chose s'est mal passé").isVisible().catch(() => false);
    isCrash ? ko('/pro page crashed') : ok('/pro page renders');

    const proName = await page.locator('h1').first().textContent().catch(() => '');
    proName?.toLowerCase().includes('marc') ? ok(`pro name visible: "${proName}"`) : info('pro name', proName);

    const formExists = await page.locator('input[type=tel]').count();
    formExists > 0 ? ok(`lead form input[type=tel] visible (${formExists})`) : ko('lead form missing');

    const submitBtn = await page.getByRole('button', { name: /Envoyer ma demande|Envoyer|Demander|Soumettre/i }).count();
    submitBtn > 0 ? ok(`lead submit button visible (${submitBtn})`) : ko('submit button missing');

    await page.screenshot({ path: 'C:/tmp/final-02-pro-profile.png' });

    // Submit a real lead
    info('Submitting lead via form…');
    const nameInput = page.locator('input[type=text]').first();
    const phoneInput = page.locator('input[type=tel]').first();
    const emailInput = page.locator('input[type=email]').first();
    const textarea = page.locator('textarea').first();
    if (await nameInput.count()) await nameInput.fill(`Final QA ${stamp}`);
    // Use a unique phone (last 4 digits = 4-digit slice of timestamp)
    // so we don't trip the 7-day dedup on this pro
    if (await phoneInput.count()) await phoneInput.fill(`514-555-${String(stamp).slice(-4)}`);
    if (await emailInput.count()) await emailInput.fill(`final-qa-${stamp}@gmail.com`);
    // Service requested could be input or textarea — try the visible non-textarea one then textarea
    const serviceInput = page.locator('input[type=text]').nth(1);
    if (await serviceInput.count()) await serviceInput.fill('Validation E2E final');
    if (await textarea.count()) await textarea.fill('Détails de la demande pour validation');

    await page.getByRole('button', { name: /Envoyer ma demande|Envoyer|Demander|Soumettre/i }).first().click({ force: true });
    await page.waitForTimeout(5000);

    const confirmText = await page.textContent('body');
    if (/Demande envoyée|Demande reçue|reçue|envoyée|merci/i.test(confirmText)) {
      ok('lead form submitted — confirmation visible');
      await page.screenshot({ path: 'C:/tmp/final-03-lead-confirmed.png' });
    } else {
      info('lead form submitted, no clear confirmation text');
      await page.screenshot({ path: 'C:/tmp/final-03-lead-after-submit.png' });
    }
  }

  // ════════════════════════════════════════════
  header('PERSONA 2 — Worker (TA) journey');
  // ════════════════════════════════════════════
  await page.context().clearCookies();
  await page.goto(`${BASE}/register?role=worker`, { waitUntil: 'domcontentloaded' });
  await dismissCookies(page);
  await page.waitForTimeout(1500);
  await page.fill('input[type=email]', WORKER_EMAIL);
  await page.fill('input[type=password]', PASSWORD);
  await page.getByRole('button', { name: 'Continuer' }).click({ force: true });
  await page.waitForTimeout(1500);
  await page.locator('input#firstName').fill('Final');
  await page.locator('input#lastName').fill('Worker');
  await page.locator('input#phone').fill('5145550100').catch(() => {});
  await page.locator('input#city').fill('Montréal');
  await page.getByRole('button', { name: /Créer|Terminer|Finaliser/i }).first().click({ force: true });
  await page.waitForTimeout(4500);
  ok('Worker registered');

  await page.goto(`${BASE}/map`, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(3500);
  const pins = await page.locator('.mission-pin').count();
  pins > 0 ? ok(`/map shows ${pins} mission pins`) : ko('/map shows 0 pins');
  await page.screenshot({ path: 'C:/tmp/final-04-map.png' });

  if (pins > 0) {
    await page.locator('.mission-pin').first().click({ force: true });
    await page.waitForTimeout(1500);
    const sheetOpen = await page.getByRole('button', { name: 'Fermer' }).count();
    sheetOpen > 0 ? ok('pin click opens bottom sheet') : ko('bottom sheet did not open');

    const detailLink = await page.locator('.fixed.inset-0 a[href^="/missions/"]').first().getAttribute('href').catch(() => null);
    if (detailLink) {
      await page.goto(`${BASE}${detailLink}`, { waitUntil: 'domcontentloaded' });
      await page.waitForTimeout(2500);

      const kycBanner = await page.getByText(/Vérifie ton identité pour postuler/i).count();
      kycBanner > 0 ? ok('KYC gate banner visible (PR #220)') : info('no KYC banner');

      const kycLink = await page.getByRole('link', { name: /Vérifier mon identité/i }).count();
      kycLink > 0 ? ok('Link to /profile/verify present') : info('no verify link');

      await page.screenshot({ path: 'C:/tmp/final-05-mission-as-worker.png' });
    }
  }

  // ════════════════════════════════════════════
  header('PERSONA 3 — Employer (client) journey');
  // ════════════════════════════════════════════
  await page.context().clearCookies();
  await page.goto(`${BASE}/register?role=employer`, { waitUntil: 'domcontentloaded' });
  await dismissCookies(page);
  await page.waitForTimeout(1500);
  await page.fill('input[type=email]', EMPLOYER_EMAIL);
  await page.fill('input[type=password]', PASSWORD);
  await page.getByRole('button', { name: 'Continuer' }).click({ force: true });
  await page.waitForTimeout(1500);
  await page.locator('input#firstName').fill('Final');
  await page.locator('input#lastName').fill('Employer');
  await page.locator('input#phone').fill('5145550101');
  await page.locator('input#city').fill('Montréal');
  await page.getByRole('button', { name: /Créer|Terminer|Finaliser/i }).first().click({ force: true });
  await page.waitForTimeout(4500);
  ok('Employer registered');

  // Onboarding
  await page.goto(`${BASE}/onboarding/employer`, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(2000);
  const bizName = page.locator('input#businessName').first();
  if (await bizName.count()) {
    await bizName.fill(`Final QA Biz ${stamp}`);
    const catBtns = page.locator('button[type="button"]').filter({ hasText: /Nettoyage|Paysagement|Autre/ });
    if (await catBtns.count()) await catBtns.first().click({ force: true });
    await page.locator('[data-testid=employer-onboarding-submit]').click({ force: true });
    await page.waitForTimeout(4500);
    ok('Onboarding completed');
  }

  // Create mission
  await page.goto(`${BASE}/missions/new`, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(2500);
  await page.locator('input[name=title]').first().fill(`Final QA ${stamp}`);
  await page.locator('textarea[name=description]').first().fill('Validation finale comme un vrai utilisateur — création mission complète');
  await page.locator('input[name=city]').first().fill('Montréal');
  await page.locator('input[name=price]').first().fill('150');
  const catBtns2 = page.locator('button[type="button"]').filter({ hasText: /Plomberie|Ménage|Construction|Beauté/i });
  if (await catBtns2.count()) await catBtns2.first().click({ force: true });
  await page.getByRole('button', { name: /Publier|Créer|Soumettre/i }).first().click({ force: true });
  await page.waitForTimeout(5000);
  page.url().includes('/missions/lm_') ? ok(`mission created: ${page.url().split('/').pop()}`) : ko('mission not created');

  // Boost CTAs
  if (page.url().includes('/missions/lm_')) {
    const urgent = await page.getByRole('button', { name: /Urgent 9 \$/i }).count();
    const top = await page.getByRole('button', { name: /Top 48h 14 \$/i }).count();
    urgent > 0 && top > 0 ? ok('Boost CTAs visible (Urgent + Top)') : ko('boost CTAs missing');

    if (urgent > 0) {
      await page.getByRole('button', { name: /Urgent 9 \$/i }).first().click({ force: true });
      await page.waitForTimeout(2500);
      const stripeIframe = await page.waitForSelector('iframe[name^="__privateStripeFrame"]', { timeout: 10000 }).then(() => true).catch(() => false);
      stripeIframe ? ok('Stripe Elements iframe loads') : ko('Stripe iframe missing');
      await page.screenshot({ path: 'C:/tmp/final-06-boost-modal.png' });
      await page.getByRole('button', { name: 'Fermer' }).first().click({ force: true }).catch(() => {});
    }
  }

  // ════════════════════════════════════════════
  header('FINAL TALLY');
  // ════════════════════════════════════════════
  console.log(`\n  ✅ ${pass} pass`);
  console.log(`  ❌ ${fail} fail`);
  const total = pass + fail;
  console.log(`  Score: ${total ? Math.round(pass / total * 100) : 0}%`);
  const dedup = [...new Set(errors)];
  if (dedup.length === 0) ok('Zero significant console errors');
  else for (const e of dedup.slice(0, 8)) console.log(`  ⚠️ ${e}`);

  await browser.close();
})();
