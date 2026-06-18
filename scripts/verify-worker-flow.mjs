import { chromium } from 'playwright';

const BASE = 'https://workonapp.vercel.app';
const stamp = Date.now();
const EMAIL = `qa-worker-${stamp}@workon.test`;
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
          !/401|404|403/.test(t)) {
        errors.push(`CONSOLE: ${t.slice(0, 220)}`);
      }
    }
  });

  // ════════════════════════════════════════════
  header(1, 'Anonymous: see "Devenir pro" landing /rejoindre-pro');
  // ════════════════════════════════════════════
  await page.goto(`${BASE}/rejoindre-pro`, { waitUntil: 'domcontentloaded' });
  await dismissCookies(page);
  await page.waitForTimeout(2000);
  if (await page.getByText("Quelque chose s'est mal passé").isVisible().catch(() => false)) {
    fail('/rejoindre-pro crashed');
  } else {
    pass('/rejoindre-pro loads');
  }
  // CTA to /register?role=worker
  const ctaWorker = await page.locator('a[href*="role=worker"], a[href*="/register?role=worker"]').count();
  info(`worker-register CTAs visible: ${ctaWorker}`);
  if (ctaWorker === 0) info('no explicit ?role=worker CTA — may rely on /register default radio');
  await page.screenshot({ path: 'C:/tmp/wf-01-rejoindre-pro.png' });

  // ════════════════════════════════════════════
  header(2, 'Register as worker (multi-step /register?role=worker)');
  // ════════════════════════════════════════════
  await page.goto(`${BASE}/register?role=worker`, { waitUntil: 'domcontentloaded' });
  await dismissCookies(page);
  await page.waitForTimeout(1500);
  await page.fill('input[type=email]', EMAIL);
  await page.fill('input[type=password]', PASSWORD);
  await page.getByRole('button', { name: 'Continuer' }).click({ force: true });
  await page.waitForTimeout(1500);

  const firstName = page.locator('input#firstName, input[name=firstName]').first();
  const lastName = page.locator('input#lastName, input[name=lastName]').first();
  const phone = page.locator('input#phone, input[name=phone], input[type=tel]').first();
  const city = page.locator('input#city, input[name=city]').first();
  if (await firstName.count() === 0) {
    fail('register step 3 fields not visible');
    await page.screenshot({ path: 'C:/tmp/wf-02-step3-broken.png' });
    await browser.close();
    process.exit(1);
  }
  await firstName.fill('Worker');
  await lastName.fill('QA');
  if (await phone.count()) await phone.fill('5145550199');
  await city.fill('Montréal');

  const finalBtn = page.getByRole('button', { name: /Créer mon compte|Terminer|S'inscrire|Finaliser/i }).first();
  await finalBtn.click({ force: true });
  await page.waitForTimeout(4500);

  if (page.url().includes('/login')) {
    fail('register did not auto-login');
    await page.screenshot({ path: 'C:/tmp/wf-02-after-register-fail.png' });
  } else {
    pass(`registered as worker, landed at ${page.url()}`);
  }
  await page.screenshot({ path: 'C:/tmp/wf-02-after-register.png' });

  // ════════════════════════════════════════════
  header(3, 'Worker /home as worker — check role-aware UI');
  // ════════════════════════════════════════════
  await page.goto(`${BASE}/home`, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(2500);
  if (await page.getByText("Quelque chose s'est mal passé").isVisible().catch(() => false)) {
    fail('/home crashed for worker');
  } else {
    pass('/home loads for worker');
  }
  // Worker home should show "Trouve des missions", not "Publier une mission"
  const homeText = (await page.textContent('body').catch(() => '')) || '';
  const hasFindMission = /Trouve|Voir.*missions|opportunités/i.test(homeText);
  if (hasFindMission) pass('worker /home shows mission-discovery context');
  else info('worker /home content unclear');
  await page.screenshot({ path: 'C:/tmp/wf-03-home.png' });

  // ════════════════════════════════════════════
  header(4, 'Browse missions on /map');
  // ════════════════════════════════════════════
  await page.goto(`${BASE}/map`, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(3000);
  if (await page.getByText("Quelque chose s'est mal passé").isVisible().catch(() => false)) {
    fail('/map crashed for worker');
  } else {
    pass('/map loads for worker');
  }
  const pinCount = await page.locator('.mission-pin').count();
  info(`mission pins visible: ${pinCount}`);
  if (pinCount === 0) fail('no missions visible on /map for worker — discovery broken');
  else pass(`${pinCount} mission pins visible`);

  await page.screenshot({ path: 'C:/tmp/wf-04-map.png' });

  // ════════════════════════════════════════════
  header(5, 'Open a mission detail as worker — see Apply/Offer CTA');
  // ════════════════════════════════════════════
  if (pinCount > 0) {
    await page.locator('.mission-pin').first().click({ force: true });
    await page.waitForTimeout(1200);
    const sheet = page.getByRole('button', { name: 'Fermer' });
    if (await sheet.count() > 0) {
      pass('bottom sheet opens on pin click');
      // Find the link inside sheet
      const detailLink = page.locator('.fixed.inset-0 a[href^="/missions/"]').first();
      const href = await detailLink.getAttribute('href').catch(() => null);
      if (href) {
        await page.goto(`${BASE}${href}`, { waitUntil: 'domcontentloaded' });
        await page.waitForTimeout(2500);
        if (await page.getByText("Quelque chose s'est mal passé").isVisible().catch(() => false)) {
          fail('mission detail crashed for worker');
        } else {
          pass(`mission detail loads: ${href}`);
        }
        // Worker UX is two-state:
        //  • idVerified === true  → "Faire une offre" + "Accepter au prix affiché"
        //  • idVerified === false → KYC gating banner with "Vérifier mon identité"
        //                            link to /profile/verify (PR #220).
        // Either is correct as long as one of them shows up — what's
        // unacceptable is neither, which means the worker has no path
        // forward.
        const applyBtn = await page.getByRole('button', { name: /Faire une offre|Postuler|Apply|Accepter au prix/i }).count();
        const kycBanner = await page.getByText(/Vérifie ton identité pour postuler/i).count();
        const kycCta = await page.getByRole('link', { name: /Vérifier mon identité/i }).count();
        info(`apply CTAs: ${applyBtn} · KYC banner: ${kycBanner} · /profile/verify link: ${kycCta}`);
        if (applyBtn > 0) {
          pass('verified-worker apply CTA visible — can earn');
        } else if (kycBanner > 0 && kycCta > 0) {
          pass('unverified worker sees KYC gating banner with /profile/verify link (PR #220)');
        } else {
          fail('worker has neither apply CTA nor KYC banner — dead-end UX');
        }
        await page.screenshot({ path: 'C:/tmp/wf-05-mission-as-worker.png' });
      }
    } else {
      fail('pin click did not open bottom sheet');
    }
  }

  // ════════════════════════════════════════════
  header(6, 'Worker Earnings page (/earnings or /missions/mine)');
  // ════════════════════════════════════════════
  // A worker's "missions/mine" is their assigned/completed missions
  await page.goto(`${BASE}/missions/mine`, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(2500);
  if (await page.getByText("Quelque chose s'est mal passé").isVisible().catch(() => false)) {
    fail('/missions/mine crashed for worker');
  } else {
    pass('/missions/mine loads for worker');
  }
  await page.screenshot({ path: 'C:/tmp/wf-06-mine.png' });

  // ════════════════════════════════════════════
  header(7, 'Worker /settings/profile — fill skills/availability');
  // ════════════════════════════════════════════
  await page.goto(`${BASE}/settings/profile`, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(2500);
  if (await page.getByText("Quelque chose s'est mal passé").isVisible().catch(() => false)) {
    fail('/settings/profile crashed');
  } else {
    pass('/settings/profile loads');
  }
  // Skill chips
  const skillFields = await page.locator('text=/Compétences|Skills|Catégories/i').count();
  info(`skill section count: ${skillFields}`);
  await page.screenshot({ path: 'C:/tmp/wf-07-profile.png' });

  // ════════════════════════════════════════════
  header(8, 'Worker /swipe — should show employers (Bloc 2E)');
  // ════════════════════════════════════════════
  await page.goto(`${BASE}/swipe`, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(3000);
  if (await page.getByText("Quelque chose s'est mal passé").isVisible().catch(() => false)) {
    fail('/swipe crashed for worker');
  } else {
    pass('/swipe loads for worker');
  }
  const swipeText = await page.textContent('body').catch(() => '');
  if (/Trouver un client|client.*disponible|opportunit/i.test(swipeText)) {
    pass('/swipe shows client discovery title');
  } else {
    info('swipe page content unclear from text');
  }
  await page.screenshot({ path: 'C:/tmp/wf-08-swipe.png' });

  // ════════════════════════════════════════════
  header('—', 'Console errors:');
  // ════════════════════════════════════════════
  const dedup = [...new Set(errors)];
  if (dedup.length === 0) pass('no significant errors');
  else for (const e of dedup.slice(0, 12)) console.log(`  ⚠️ ${e}`);

  await browser.close();
  console.log('');
  console.log(totalGaps === 0 ? '✅ WORKER FLOW READY' : `❌ ${totalGaps} GAP(S) BLOCKING WORKER FLOW`);
})().catch(e => { console.error('FATAL:', e); process.exit(1); });
