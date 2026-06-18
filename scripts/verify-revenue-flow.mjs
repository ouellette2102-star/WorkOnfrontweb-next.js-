import { chromium } from 'playwright';

const BASE = 'https://workonapp.vercel.app';
const stamp = Date.now();
const EMAIL = `qa-revenue-${stamp}@workon.test`;
const PASSWORD = 'WorkOn2026Test!';

let totalGaps = 0;
function pass(m) { console.log('  ✅', m); }
function fail(m) { console.error('  ❌', m); totalGaps++; process.exitCode = 1; }
function info(m) { console.log('  •', m); }
function header(n, t) {
  console.log('');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`STEP ${n} — ${t}`);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
}

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
      if (!t.includes('Permissions policy') && !t.includes('hydration') &&
          !t.includes('cookie') && !t.includes('TypeError: Failed to fetch') &&
          !/401|404/.test(t)) {
        errors.push(`CONSOLE: ${t.slice(0, 220)}`);
      }
    }
  });

  // ════════════════════════════════════════════
  header(1, 'Anonymous visit to landing — see public proof');
  // ════════════════════════════════════════════
  await page.goto(`${BASE}/`, { waitUntil: 'domcontentloaded' });
  await dismissCookies(page);
  await page.waitForTimeout(1500);

  const proofText = await page.textContent('body').catch(() => '');
  const hasProsCount = /\d+\s*(pro|travailleur|active workers?)/i.test(proofText);
  const hasMissionsCount = /\d+\s*mission/i.test(proofText);
  if (hasProsCount) pass('landing shows pro count'); else fail('landing missing pro count');
  if (hasMissionsCount) pass('landing shows mission/lead count'); else info('landing has no mission count badge');

  await page.screenshot({ path: 'C:/tmp/rev-01-landing.png' });

  // ════════════════════════════════════════════
  header(2, 'Anonymous: visit /pros (Sprint 2 deliverable)');
  // ════════════════════════════════════════════
  await page.goto(`${BASE}/pros`, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(2000);
  if (await page.getByText("Quelque chose s'est mal passé").isVisible().catch(() => false)) {
    fail('/pros page crashed for anon');
  } else {
    pass('/pros page loads for anon');
  }
  // The card links are /pro/[slug] (singular) — server-rendered ISR.
  // Wait long enough for React hydration to complete.
  await page.waitForTimeout(2000);
  const proCards = await page.locator('a[href^="/pro/"]').count();
  info(`pro card links visible: ${proCards}`);
  if (proCards === 0) fail('/pros shows zero pro cards');
  else pass(`${proCards} pro cards visible`);
  await page.screenshot({ path: 'C:/tmp/rev-02-pros.png' });

  // ════════════════════════════════════════════
  header(3, 'Sign up as employer (multi-step /register?role=employer)');
  // ════════════════════════════════════════════
  // ?role=employer makes the page skip step 2 entirely (3-step funnel
  // → 2 steps). Step 1: email+password → "Continuer". Step 3: profile.
  await page.goto(`${BASE}/register?role=employer`, { waitUntil: 'domcontentloaded' });
  await dismissCookies(page);
  await page.waitForTimeout(1500);

  if (await page.locator('input[type=email]').count() === 0) {
    fail('/register has no email input');
    await page.screenshot({ path: 'C:/tmp/rev-03-register-broken.png' });
    await browser.close();
    process.exit(1);
  }

  await page.fill('input[type=email]', EMAIL);
  await page.fill('input[type=password]', PASSWORD);
  await page.getByRole('button', { name: 'Continuer' }).click({ force: true });
  await page.waitForTimeout(1500);

  // Step 3 — first/last/phone/city
  const firstName = page.locator('input#firstName, input[name=firstName]').first();
  const lastName = page.locator('input#lastName, input[name=lastName]').first();
  const phone = page.locator('input#phone, input[name=phone], input[type=tel]').first();
  const city = page.locator('input#city, input[name=city]').first();

  if (await firstName.count() === 0) {
    fail('step 3 fields not visible — multi-step flow broken');
    await page.screenshot({ path: 'C:/tmp/rev-03-step3-broken.png' });
    await browser.close();
    process.exit(1);
  }
  await firstName.fill('Revenue');
  await lastName.fill('Test');
  if (await phone.count()) await phone.fill('5145550199');
  await city.fill('Montréal');
  pass('step 3 fields filled');

  // Submit — button text depends on role; commonly "Créer mon compte" / "Terminer".
  const finalBtn = page.getByRole('button', { name: /Créer mon compte|Terminer|S'inscrire|Finaliser/i }).first();
  if (await finalBtn.count() === 0) {
    fail('no submit button on register step 3');
    await page.screenshot({ path: 'C:/tmp/rev-03-step3-no-submit.png' });
    await browser.close();
    process.exit(1);
  }
  await finalBtn.click({ force: true });
  await page.waitForTimeout(4500);

  if (page.url().includes('/login')) {
    fail('register didn\'t auto-login');
  } else if (page.url().includes('/home') || page.url().includes('/onboarding') || page.url().includes('/missions')) {
    pass(`registered + landed at ${page.url()}`);
  } else {
    info(`landed at ${page.url()} after register`);
  }
  await page.screenshot({ path: 'C:/tmp/rev-03-after-register.png' });

  // ════════════════════════════════════════════
  header(4, 'Create a mission (onboarding gate handled)');
  // ════════════════════════════════════════════
  await page.goto(`${BASE}/missions/new`, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(2500);

  // First-time employer is redirected to /onboarding/employer with
  // ?from=missions-new. Handle that gate before the create form.
  if (page.url().includes('/onboarding/employer')) {
    info('redirected to onboarding (expected for first-time employer)');
    const bizName = page.locator('input[name=businessName], input#businessName').first();
    if (await bizName.count() === 0) {
      fail('onboarding form missing businessName');
    } else {
      await bizName.fill(`QA Employer ${stamp}`);
      // Categories are clickable buttons, not a <select>. Pick the first.
      const catButtons = page.locator('button[type="button"]').filter({
        hasText: /Nettoyage|Paysagement|Déneigement|Déménagement|Événementiel|Restauration|Autre/,
      });
      if (await catButtons.count() > 0) {
        await catButtons.first().click({ force: true });
        info('selected business category');
      }
      const onboardingBtn = page
        .locator('[data-testid=employer-onboarding-submit]')
        .first();
      if (await onboardingBtn.count()) {
        await onboardingBtn.click({ force: true });
        await page.waitForTimeout(4500);
        if (page.url().includes('/missions/new')) {
          pass('onboarding done — bounced back to /missions/new');
        } else {
          info(`after onboarding, at ${page.url()}`);
          // Force back to /missions/new
          await page.goto(`${BASE}/missions/new`, { waitUntil: 'domcontentloaded' });
          await page.waitForTimeout(2000);
        }
      }
    }
  }

  if (await page.getByText("Quelque chose s'est mal passé").isVisible().catch(() => false)) {
    fail('/missions/new crashed');
  } else {
    pass('/missions/new loads');
  }
  await page.screenshot({ path: 'C:/tmp/rev-04-mission-new.png' });

  // Wait for category buttons to load (they come from /categories API).
  await page.waitForTimeout(2000);

  await page.locator('input[name=title]').first().fill(`QA mission ${stamp}`);
  await page.locator('textarea[name=description]').first().fill(
    'Test mission pour audit revenue flow — minimum dix caractères'
  );
  await page.locator('input[name=city]').first().fill('Montréal');
  await page.locator('input[name=price]').first().fill('150');

  // Category is a list of clickable pills, NOT a <select>. Pick the
  // first one whose role is a button inside the category card.
  const catBtns = page.locator('button[type="button"]').filter({
    hasText: /Plomberie|Électricité|Ménage|Nettoyage|Construction|Peinture|Démén|Jardin|Réparation|Manuten|Beauté|Commerce/i,
  });
  const catCount = await catBtns.count();
  info(`category buttons available: ${catCount}`);
  if (catCount > 0) {
    await catBtns.first().click({ force: true });
    pass('clicked first category');
  } else {
    fail('no category buttons rendered — /categories API may have failed');
  }

  const createBtn = page.getByRole('button', { name: /Publier|Créer|Soumettre/i }).first();
  const hasCreateBtn = await createBtn.count();
  if (hasCreateBtn === 0) {
    fail('no create-mission submit button visible');
  } else {
    await createBtn.click({ force: true }).catch(() => {});
    await page.waitForTimeout(4000);
    if (page.url().includes('/missions/lm_') || /\/missions\/[^/]+\?/.test(page.url())) {
      pass(`mission created, landed on ${page.url()}`);
    } else {
      info(`after submit, at ${page.url()}`);
    }
  }
  await page.screenshot({ path: 'C:/tmp/rev-04b-after-create.png' });

  // ════════════════════════════════════════════
  header(5, 'See mission in /missions/mine');
  // ════════════════════════════════════════════
  await page.goto(`${BASE}/missions/mine`, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(2500);
  if (await page.getByText("Quelque chose s'est mal passé").isVisible().catch(() => false)) {
    fail('/missions/mine crashed');
  } else {
    pass('/missions/mine loads');
  }
  const myMissionLinks = await page.locator('a[href^="/missions/lm_"]').count();
  info(`my-mission links visible: ${myMissionLinks}`);
  if (myMissionLinks === 0) fail('no missions visible in /missions/mine after creation');
  await page.screenshot({ path: 'C:/tmp/rev-05-mine.png' });

  // ════════════════════════════════════════════
  header(6, 'Open mission detail + boost CTAs (Bloc 2H)');
  // ════════════════════════════════════════════
  if (myMissionLinks > 0) {
    const missionHref = await page.locator('a[href^="/missions/lm_"]').first().getAttribute('href');
    await page.goto(`${BASE}${missionHref}`, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(2500);
    if (await page.getByText("Quelque chose s'est mal passé").isVisible().catch(() => false)) {
      fail('mission detail crashed');
    } else {
      pass(`mission detail loads: ${missionHref}`);
    }
    const urgent = await page.getByRole('button', { name: /Urgent 9 \$/i }).count();
    const top = await page.getByRole('button', { name: /Top 48h 14 \$/i }).count();
    if (urgent > 0) pass('Urgent boost CTA visible'); else fail('Urgent boost CTA missing');
    if (top > 0) pass('Top boost CTA visible'); else fail('Top boost CTA missing');
    await page.screenshot({ path: 'C:/tmp/rev-06-mission-detail.png' });
  }

  // ════════════════════════════════════════════
  header(7, 'Browse /pros as employer + click a pro');
  // ════════════════════════════════════════════
  await page.goto(`${BASE}/pros`, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(2500);
  const proLinks = await page.locator('a[href^="/pro/"]').count();
  info(`pro card links: ${proLinks}`);
  if (proLinks === 0) {
    fail('no pro cards visible while logged in');
  } else {
    pass(`/pros shows ${proLinks} pros`);
    const firstProHref = await page.locator('a[href^="/pro/"]').first().getAttribute('href');
    await page.goto(`${BASE}${firstProHref}`, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(2000);
    if (await page.getByText("Quelque chose s'est mal passé").isVisible().catch(() => false)) {
      fail('worker profile crashed');
    } else {
      pass(`worker profile loads: ${firstProHref}`);
    }
    await page.screenshot({ path: 'C:/tmp/rev-07-worker.png' });
  }

  // ════════════════════════════════════════════
  header(8, 'Map view as employer (Bloc 2F)');
  // ════════════════════════════════════════════
  await page.goto(`${BASE}/map`, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(3000);
  if (await page.getByText("Quelque chose s'est mal passé").isVisible().catch(() => false)) {
    fail('/map crashed for employer');
  } else {
    pass('/map loads for employer');
  }
  const mapPins = await page.locator('.mission-pin').count();
  info(`mission pins on map: ${mapPins}`);
  // For an employer the map is informational (browse opportunities to
  // see what others have posted). 0 pins is acceptable here — the
  // worker-side audit (verify-map-thorough.mjs) covers pin coverage.
  await page.screenshot({ path: 'C:/tmp/rev-08-map.png' });

  // ════════════════════════════════════════════
  header(9, 'Swipe page as employer (Bloc 2E)');
  // ════════════════════════════════════════════
  await page.goto(`${BASE}/swipe`, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(3000);
  if (await page.getByText("Quelque chose s'est mal passé").isVisible().catch(() => false)) {
    fail('/swipe crashed');
  } else {
    pass('/swipe loads');
  }
  const swipeContent = await page.textContent('body').catch(() => '');
  if (/Trouver un pro|Pro.*disponible/i.test(swipeContent)) {
    pass('/swipe shows pro discovery title');
  } else {
    info('swipe page content unclear from text');
  }
  await page.screenshot({ path: 'C:/tmp/rev-09-swipe.png' });

  // ════════════════════════════════════════════
  header('—', 'Console errors collected:');
  // ════════════════════════════════════════════
  const dedup = [...new Set(errors)];
  if (dedup.length === 0) pass('no significant errors');
  else for (const e of dedup.slice(0, 12)) console.log(`  ⚠️ ${e}`);

  await browser.close();
  console.log('');
  console.log(totalGaps === 0 ? '✅ REVENUE FLOW READY — no blocking gaps' : `❌ ${totalGaps} GAP(S) BLOCKING REVENUE FLOW`);
})().catch(e => { console.error('FATAL:', e); process.exit(1); });
