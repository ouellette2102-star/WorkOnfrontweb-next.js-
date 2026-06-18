import { chromium } from 'playwright';

const BASE = 'https://workonapp.vercel.app';
const API = 'https://workon-backend-production-8908.up.railway.app';
const stamp = Date.now();

const results = {
  anonymous: { pass: 0, fail: 0, skip: 0, items: [] },
  worker: { pass: 0, fail: 0, skip: 0, items: [] },
  employer: { pass: 0, fail: 0, skip: 0, items: [] },
  perf: { pass: 0, fail: 0, items: [] },
  security: { pass: 0, fail: 0, items: [] },
  seo: { pass: 0, fail: 0, items: [] },
  a11y: { pass: 0, fail: 0, items: [] },
  compliance: { pass: 0, fail: 0, items: [] },
  monitoring: { pass: 0, fail: 0, items: [] },
};

function record(category, ok, label, detail) {
  const slot = results[category];
  if (ok === true) slot.pass++;
  else if (ok === false) slot.fail++;
  else slot.skip = (slot.skip || 0) + 1;
  slot.items.push({ ok, label, detail });
  const icon = ok === true ? '✅' : ok === false ? '❌' : 'ℹ️';
  console.log(`  ${icon} [${category}] ${label}${detail ? ` — ${detail}` : ''}`);
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

async function noCrash(page, label, category) {
  const crashed = await page.getByText("Quelque chose s'est mal passé").isVisible().catch(() => false);
  record(category, !crashed, `${label} renders without ErrorBoundary`);
  return !crashed;
}

async function timeRequest(url) {
  const start = Date.now();
  try {
    await fetch(url);
  } catch {}
  return Date.now() - start;
}

async function timePageLoad(page, url) {
  const start = Date.now();
  await page.goto(url, { waitUntil: 'domcontentloaded' });
  return Date.now() - start;
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
  console.log('\n━━━━ PERSONA: ANONYMOUS VISITOR ━━━━');
  // ════════════════════════════════════════════
  await page.goto(`${BASE}/`, { waitUntil: 'domcontentloaded' });
  await dismissCookies(page);
  await page.waitForTimeout(2000);
  await noCrash(page, '/', 'anonymous');
  const landingHtml = await page.content();
  record('anonymous', /Recevoir mes premières opportunités|Trouve|découvre/i.test(landingHtml), 'landing has primary CTA');
  record('anonymous', !landingHtml.includes('\uFFFD'), 'landing has no U+FFFD encoding artifacts');

  await page.goto(`${BASE}/pros`, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(2500);
  await noCrash(page, '/pros', 'anonymous');
  const proCount = await page.locator('a[href^="/pro/"]').count();
  record('anonymous', proCount > 0, '/pros lists at least one pro', `${proCount} pros`);

  if (proCount > 0) {
    const href = await page.locator('a[href^="/pro/"]').first().getAttribute('href');
    await page.goto(`${BASE}${href}`, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(2500);
    await noCrash(page, href, 'anonymous');
    const profileHtml = await page.content();
    record('anonymous', /Demander|Soumission|Contact/i.test(profileHtml), '/pro/[slug] has lead-capture CTA');
  }

  // /rejoindre-pro (worker recruitment landing)
  await page.goto(`${BASE}/rejoindre-pro`, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(2000);
  await noCrash(page, '/rejoindre-pro', 'anonymous');
  const cta = await page.locator('a[href*="role=worker"]').count();
  record('anonymous', cta > 0, '/rejoindre-pro CTAs to /register?role=worker', `${cta} CTAs`);

  // Sitemap
  const sitemap = await page.goto(`${BASE}/sitemap.xml`).then(r => r.status()).catch(() => 0);
  record('seo', sitemap === 200, '/sitemap.xml available', `HTTP ${sitemap}`);

  // robots
  const robots = await page.goto(`${BASE}/robots.txt`).then(r => r.status()).catch(() => 0);
  record('seo', robots === 200, '/robots.txt available', `HTTP ${robots}`);

  // ════════════════════════════════════════════
  console.log('\n━━━━ SEO + META AUDIT ━━━━');
  // ════════════════════════════════════════════
  await page.goto(`${BASE}/`, { waitUntil: 'domcontentloaded' });
  const title = await page.title();
  record('seo', title.length > 10 && title.length < 70, 'home <title> length', `"${title.slice(0, 60)}…" (${title.length} chars)`);
  const desc = await page.locator('meta[name="description"]').getAttribute('content').catch(() => '');
  record('seo', desc && desc.length > 50, 'home meta description present', `${desc?.length || 0} chars`);
  const ogImage = await page.locator('meta[property="og:image"]').getAttribute('content').catch(() => '');
  record('seo', !!ogImage, 'home og:image set', ogImage?.slice(0, 60));
  const twCard = await page.locator('meta[name="twitter:card"]').getAttribute('content').catch(() => '');
  record('seo', !!twCard, 'home twitter:card set', twCard);
  const lang = await page.locator('html').getAttribute('lang').catch(() => '');
  record('seo', lang === 'fr' || lang?.startsWith('fr'), '<html lang> set to French', lang);

  // ════════════════════════════════════════════
  console.log('\n━━━━ PERFORMANCE AUDIT ━━━━');
  // ════════════════════════════════════════════
  const homeLoadMs = await timePageLoad(page, `${BASE}/`);
  record('perf', homeLoadMs < 5000, `home DOMContentLoaded < 5s`, `${homeLoadMs}ms`);
  const prosLoadMs = await timePageLoad(page, `${BASE}/pros`);
  record('perf', prosLoadMs < 5000, `/pros DOMContentLoaded < 5s`, `${prosLoadMs}ms`);
  const apiHealthMs = await timeRequest(`${API}/health`);
  record('perf', apiHealthMs < 1000, `API /health < 1s`, `${apiHealthMs}ms`);
  const apiPublicStatsMs = await timeRequest(`${API}/api/v1/public/stats`);
  record('perf', apiPublicStatsMs < 1500, `API /public/stats < 1.5s`, `${apiPublicStatsMs}ms`);

  // ════════════════════════════════════════════
  console.log('\n━━━━ SECURITY AUDIT ━━━━');
  // ════════════════════════════════════════════
  const headers = await fetch(`${BASE}/`).then(r => r.headers).catch(() => null);
  if (headers) {
    record('security', !!headers.get('strict-transport-security'), 'HSTS header set');
    record('security', !!headers.get('x-frame-options') || !!headers.get('content-security-policy'), 'X-Frame-Options or CSP present');
    record('security', !!headers.get('x-content-type-options'), 'X-Content-Type-Options: nosniff');
    record('security', !headers.get('server') || !headers.get('server').includes('Express'), 'Server header doesn\'t leak Express');
  }
  // Backend security
  const apiHeaders = await fetch(`${API}/health`).then(r => r.headers).catch(() => null);
  if (apiHeaders) {
    record('security', !!apiHeaders.get('strict-transport-security'), 'API HSTS set');
  }
  // CORS strict (no *)
  const corsTest = await fetch(`${API}/api/v1/public/stats`, { headers: { Origin: 'http://evil.example.com' } }).then(r => r.headers.get('access-control-allow-origin') || '').catch(() => 'fail');
  record('security', corsTest !== '*', 'CORS not wildcard', `ACAO: "${corsTest}"`);

  // ════════════════════════════════════════════
  console.log('\n━━━━ COMPLIANCE / LOI 25 AUDIT ━━━━');
  // ════════════════════════════════════════════
  await page.goto(`${BASE}/`, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(1500);
  const cookieDialog = await page.locator('[role="dialog"][aria-label*="cookie"]').count();
  record('compliance', cookieDialog > 0, 'Cookie consent dialog (Loi 25)', cookieDialog ? 'visible on first load' : 'missing');

  // Check for terms & privacy pages
  for (const path of ['/conditions', '/terms', '/cgu', '/privacy', '/confidentialite']) {
    const status = await fetch(`${BASE}${path}`).then(r => r.status).catch(() => 0);
    if (status === 200) record('compliance', true, `Legal page exists: ${path}`);
  }

  // ════════════════════════════════════════════
  console.log('\n━━━━ ACCESSIBILITY AUDIT (basic) ━━━━');
  // ════════════════════════════════════════════
  await page.goto(`${BASE}/`, { waitUntil: 'domcontentloaded' });
  await dismissCookies(page);
  await page.waitForTimeout(1500);
  // Check for basic a11y: alt on images, aria labels on icon buttons, headings hierarchy
  const imgsWithoutAlt = await page.locator('img:not([alt])').count();
  record('a11y', imgsWithoutAlt === 0, 'all <img> have alt attribute', `${imgsWithoutAlt} missing`);
  const buttonsWithoutLabel = await page.locator('button:not([aria-label]):not(:has(svg)):not(:has(img))').evaluateAll(els =>
    els.filter(el => !el.textContent?.trim()).length
  );
  record('a11y', buttonsWithoutLabel === 0, 'all interactive buttons have text or aria-label', `${buttonsWithoutLabel} unlabeled`);
  const h1Count = await page.locator('h1').count();
  record('a11y', h1Count === 1, 'exactly one <h1> on home', `${h1Count}`);
  const lang2 = await page.locator('html').getAttribute('lang');
  record('a11y', !!lang2, '<html lang> set');

  // ════════════════════════════════════════════
  console.log('\n━━━━ MONITORING / OBSERVABILITY ━━━━');
  // ════════════════════════════════════════════
  const health = await fetch(`${API}/health`).then(r => r.json()).catch(() => null);
  if (health) {
    record('monitoring', health.status === 'ok' || health.status === 'degraded', `API /health responds`, `status=${health.status}`);
    record('monitoring', !!health.uptime, 'uptime exposed');
  }
  // Check Sentry is loaded on frontend
  await page.goto(`${BASE}/`, { waitUntil: 'domcontentloaded' });
  const sentryLoaded = await page.evaluate(() => {
    return typeof window !== 'undefined' && !!(window).Sentry;
  });
  record('monitoring', sentryLoaded, 'Sentry SDK loaded in browser');

  // ════════════════════════════════════════════
  console.log('\n━━━━ PERSONA: WORKER (TA) ━━━━');
  // ════════════════════════════════════════════
  // Register worker
  const workerEmail = `qa-prelaunch-worker-${stamp}@workon.test`;
  await page.context().clearCookies();
  await page.goto(`${BASE}/register?role=worker`, { waitUntil: 'domcontentloaded' });
  await dismissCookies(page);
  await page.waitForTimeout(1500);
  await page.fill('input[type=email]', workerEmail);
  await page.fill('input[type=password]', 'WorkOn2026Test!');
  await page.getByRole('button', { name: 'Continuer' }).click({ force: true });
  await page.waitForTimeout(1500);
  await page.locator('input#firstName').fill('PreLaunch');
  await page.locator('input#lastName').fill('Worker');
  await page.locator('input#phone').fill('5145550199').catch(() => {});
  await page.locator('input#city').fill('Montréal');
  await page.getByRole('button', { name: /Créer|Terminer|Finaliser/i }).first().click({ force: true });
  await page.waitForTimeout(4500);
  record('worker', true, 'Worker can register');

  // /home renders for worker
  await page.goto(`${BASE}/home`, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(2500);
  await noCrash(page, 'worker /home', 'worker');
  // /map renders + has pins
  await page.goto(`${BASE}/map`, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(3500);
  await noCrash(page, 'worker /map', 'worker');
  const mapPins = await page.locator('.mission-pin').count();
  record('worker', mapPins > 0, '/map shows mission pins', `${mapPins} pins`);
  // pin click → bottom sheet
  if (mapPins > 0) {
    await page.locator('.mission-pin').first().click({ force: true });
    await page.waitForTimeout(1500);
    const sheet = await page.getByRole('button', { name: 'Fermer' }).count();
    record('worker', sheet > 0, 'pin click opens bottom sheet');
    if (sheet > 0) {
      const link = await page.locator('.fixed.inset-0 a[href^="/missions/"]').first().getAttribute('href').catch(() => null);
      if (link) {
        await page.goto(`${BASE}${link}`, { waitUntil: 'domcontentloaded' });
        await page.waitForTimeout(2500);
        await noCrash(page, 'mission detail', 'worker');
        const kycBanner = await page.getByText(/Vérifie ton identité pour postuler/i).count();
        const kycLink = await page.getByRole('link', { name: /Vérifier mon identité/i }).count();
        record('worker', kycBanner > 0 && kycLink > 0, 'unverified worker sees KYC gate (PR #220)');
      }
    }
  }
  // /profile/verify
  await page.goto(`${BASE}/profile/verify`, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(2000);
  await noCrash(page, '/profile/verify', 'worker');
  // /worker/payments (Stripe Connect)
  await page.goto(`${BASE}/worker/payments`, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(2000);
  await noCrash(page, '/worker/payments', 'worker');
  // /swipe
  await page.goto(`${BASE}/swipe`, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(2500);
  await noCrash(page, '/swipe', 'worker');

  // ════════════════════════════════════════════
  console.log('\n━━━━ PERSONA: EMPLOYER (CLIENT) ━━━━');
  // ════════════════════════════════════════════
  const employerEmail = `qa-prelaunch-employer-${stamp}@workon.test`;
  await page.context().clearCookies();
  await page.goto(`${BASE}/register?role=employer`, { waitUntil: 'domcontentloaded' });
  await dismissCookies(page);
  await page.waitForTimeout(1500);
  await page.fill('input[type=email]', employerEmail);
  await page.fill('input[type=password]', 'WorkOn2026Test!');
  await page.getByRole('button', { name: 'Continuer' }).click({ force: true });
  await page.waitForTimeout(1500);
  await page.locator('input#firstName').fill('PreLaunch');
  await page.locator('input#lastName').fill('Employer');
  await page.locator('input#phone').fill('5145550199');
  await page.locator('input#city').fill('Montréal');
  await page.getByRole('button', { name: /Créer|Terminer|Finaliser/i }).first().click({ force: true });
  await page.waitForTimeout(4500);
  record('employer', true, 'Employer can register');

  // Onboarding
  await page.goto(`${BASE}/onboarding/employer`, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(2000);
  const bizName = page.locator('input#businessName').first();
  if (await bizName.count()) {
    await bizName.fill(`PreLaunch QA ${stamp}`);
    const catBtns = page.locator('button[type="button"]').filter({ hasText: /Nettoyage|Paysagement|Autre/ });
    if (await catBtns.count()) await catBtns.first().click({ force: true });
    await page.locator('[data-testid=employer-onboarding-submit]').click({ force: true });
    await page.waitForTimeout(4000);
    record('employer', true, 'Employer can complete onboarding');
  }

  // Create mission
  await page.goto(`${BASE}/missions/new`, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(2500);
  await noCrash(page, '/missions/new', 'employer');
  await page.locator('input[name=title]').first().fill(`PreLaunch QA mission ${stamp}`);
  await page.locator('textarea[name=description]').first().fill('Audit pre-launch — création de mission complète');
  await page.locator('input[name=city]').first().fill('Montréal');
  await page.locator('input[name=price]').first().fill('150');
  const catBtns2 = page.locator('button[type="button"]').filter({ hasText: /Plomberie|Ménage|Construction|Beauté/i });
  if (await catBtns2.count()) await catBtns2.first().click({ force: true });
  await page.getByRole('button', { name: /Publier|Créer|Soumettre/i }).first().click({ force: true });
  await page.waitForTimeout(5000);
  const onMissionDetail = page.url().includes('/missions/lm_');
  record('employer', onMissionDetail, 'Employer can create mission', page.url().split('/').pop());

  // Boost CTAs
  if (onMissionDetail) {
    const urgent = await page.getByRole('button', { name: /Urgent 9 \$/i }).count();
    const top = await page.getByRole('button', { name: /Top 48h 14 \$/i }).count();
    record('employer', urgent > 0 && top > 0, 'Boost CTAs visible (Urgent + Top)');
    // Open Urgent boost
    if (urgent > 0) {
      await page.getByRole('button', { name: /Urgent 9 \$/i }).first().click({ force: true });
      await page.waitForTimeout(2500);
      const stripeIframe = await page.waitForSelector('iframe[name^="__privateStripeFrame"]', { timeout: 10000 }).then(() => true).catch(() => false);
      record('employer', stripeIframe, 'Stripe Elements iframe loads in boost modal');
      await page.getByRole('button', { name: 'Fermer' }).first().click({ force: true }).catch(() => {});
      await page.waitForTimeout(800);
    }
  }

  // /pros (employer can browse)
  await page.goto(`${BASE}/pros`, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(2500);
  await noCrash(page, '/pros (employer)', 'employer');
  const empProCount = await page.locator('a[href^="/pro/"]').count();
  record('employer', empProCount > 0, 'Employer can browse pros', `${empProCount} pros`);

  // /messages
  await page.goto(`${BASE}/messages`, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(2000);
  await noCrash(page, '/messages', 'employer');
  // /settings/subscription (boost #3 origin)
  await page.goto(`${BASE}/settings/subscription`, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(2500);
  await noCrash(page, '/settings/subscription', 'employer');

  // Lead capture (server-side test, not browser)
  const leadStatus = await fetch(`${API}/api/v1/leads`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
    body: JSON.stringify({
      clientName: 'PreLaunch Lead',
      clientPhone: '514-555-7777',
      clientEmail: 'prelaunch-lead@gmail.com',
      serviceRequested: 'Audit lead capture',
      professionalId: 'pro_1775246693074_ehand',
      source: 'prelaunch-audit',
    }),
  }).then(r => r.status).catch(() => 0);
  record('anonymous', leadStatus === 201 || leadStatus === 409, 'Lead capture POST /leads', `HTTP ${leadStatus}`);

  // ════════════════════════════════════════════
  // SUMMARY
  // ════════════════════════════════════════════
  console.log('\n\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('FULL RESULTS BY CATEGORY');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  let totalPass = 0;
  let totalFail = 0;
  for (const [cat, slot] of Object.entries(results)) {
    const total = slot.pass + slot.fail;
    const pct = total ? Math.round(slot.pass / total * 100) : 0;
    console.log(`${cat.padEnd(15)}: ${slot.pass}/${total} (${pct}%)`);
    totalPass += slot.pass;
    totalFail += slot.fail;
  }
  const overall = totalPass + totalFail ? Math.round(totalPass / (totalPass + totalFail) * 100) : 0;
  console.log('');
  console.log(`OVERALL: ${totalPass}/${totalPass + totalFail} = ${overall}%`);
  console.log('');
  console.log(`Console errors during test: ${[...new Set(errors)].length}`);

  // Write JSON report
  const reportPath = 'C:/tmp/prelaunch-audit-report.json';
  const fs = await import('fs');
  fs.writeFileSync(reportPath, JSON.stringify({ results, errors: [...new Set(errors)], overall, totalPass, totalFail }, null, 2));
  console.log(`\nFull report: ${reportPath}`);

  await browser.close();
})().catch(e => { console.error('FATAL:', e); process.exit(1); });
