/**
 * READ-ONLY prod audit — surface publique uniquement.
 * AUCUNE écriture (pas de register / create mission / boost) → sûr contre la prod.
 * Extrait des sections read-only de prelaunch-audit.mjs (l.82-213) + flag missions seed.
 *
 *   node scripts/readonly-prod-audit.mjs
 */
import { chromium } from 'playwright';

const BASE = 'https://workonapp.vercel.app';
const API = 'https://workon-backend-production-8908.up.railway.app';

const results = {
  rendering: { pass: 0, fail: 0, items: [] },
  seo: { pass: 0, fail: 0, items: [] },
  perf: { pass: 0, fail: 0, items: [] },
  security: { pass: 0, fail: 0, items: [] },
  compliance: { pass: 0, fail: 0, items: [] },
  a11y: { pass: 0, fail: 0, items: [] },
  monitoring: { pass: 0, fail: 0, items: [] },
  content: { pass: 0, fail: 0, items: [] },
};

function record(category, ok, label, detail) {
  const slot = results[category];
  if (ok) slot.pass++; else slot.fail++;
  slot.items.push({ ok, label, detail });
  console.log(`  ${ok ? '✅' : '❌'} [${category}] ${label}${detail ? ` — ${detail}` : ''}`);
}

async function dismissCookies(page) {
  for (let i = 0; i < 5; i++) {
    const refuse = page.getByRole('button', { name: /Refuser/i });
    if (await refuse.isVisible().catch(() => false)) {
      await refuse.click({ force: true }).catch(() => {});
      return;
    }
    await page.waitForTimeout(400);
  }
}
async function noCrash(page, label) {
  const crashed = await page.getByText("Quelque chose s'est mal passé").isVisible().catch(() => false);
  record('rendering', !crashed, `${label} rend sans ErrorBoundary`);
  return !crashed;
}
async function timeRequest(url) { const s = Date.now(); try { await fetch(url); } catch {} return Date.now() - s; }
async function timePageLoad(page, url) { const s = Date.now(); await page.goto(url, { waitUntil: 'domcontentloaded' }); return Date.now() - s; }

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

  console.log('\n━━━━ SURFACE ANONYME / RENDU ━━━━');
  await page.goto(`${BASE}/`, { waitUntil: 'domcontentloaded' });
  await dismissCookies(page);
  await page.waitForTimeout(2000);
  await noCrash(page, '/');
  const landingHtml = await page.content();
  record('content', /Recevoir mes premières opportunités|Trouve|découvre/i.test(landingHtml), 'landing a un CTA principal');
  record('content', !landingHtml.includes('�'), 'landing sans artefact d\'encodage U+FFFD');

  await page.goto(`${BASE}/pros`, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(2500);
  await noCrash(page, '/pros');
  const proCount = await page.locator('a[href^="/pro/"]').count();
  record('content', proCount > 0, '/pros liste au moins un pro', `${proCount} pros`);
  if (proCount > 0) {
    const href = await page.locator('a[href^="/pro/"]').first().getAttribute('href');
    await page.goto(`${BASE}${href}`, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(2000);
    await noCrash(page, href);
  }

  await page.goto(`${BASE}/rejoindre-pro`, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(2000);
  await noCrash(page, '/rejoindre-pro');
  const cta = await page.locator('a[href*="role=worker"]').count();
  record('content', cta > 0, '/rejoindre-pro pointe vers /register?role=worker', `${cta} CTAs`);

  // Routes clés : rendu sans crash (lecture seule)
  for (const path of ['/login', '/register', '/register?role=worker', '/register?role=employer', '/missions']) {
    const status = await page.goto(`${BASE}${path}`, { waitUntil: 'domcontentloaded' }).then(r => r?.status() ?? 0).catch(() => 0);
    await page.waitForTimeout(1200);
    await noCrash(page, path);
    record('content', status > 0 && status < 400, `route ${path} répond`, `HTTP ${status}`);
  }

  console.log('\n━━━━ SEO / META ━━━━');
  const sitemap = await page.goto(`${BASE}/sitemap.xml`).then(r => r.status()).catch(() => 0);
  record('seo', sitemap === 200, '/sitemap.xml dispo', `HTTP ${sitemap}`);
  const robots = await page.goto(`${BASE}/robots.txt`).then(r => r.status()).catch(() => 0);
  record('seo', robots === 200, '/robots.txt dispo', `HTTP ${robots}`);
  await page.goto(`${BASE}/`, { waitUntil: 'domcontentloaded' });
  const title = await page.title();
  record('seo', title.length > 10 && title.length < 70, 'home <title> longueur', `"${title.slice(0, 50)}…" (${title.length})`);
  const desc = await page.locator('meta[name="description"]').getAttribute('content').catch(() => '');
  record('seo', !!desc && desc.length > 50, 'home meta description', `${desc?.length || 0} chars`);
  const ogImage = await page.locator('meta[property="og:image"]').getAttribute('content').catch(() => '');
  record('seo', !!ogImage, 'home og:image', ogImage?.slice(0, 50));
  const lang = await page.locator('html').getAttribute('lang').catch(() => '');
  record('seo', lang?.startsWith('fr'), '<html lang> = fr', lang);

  console.log('\n━━━━ PERF ━━━━');
  const homeMs = await timePageLoad(page, `${BASE}/`);
  record('perf', homeMs < 5000, 'home DOMContentLoaded < 5s', `${homeMs}ms`);
  const apiHealthMs = await timeRequest(`${API}/api/v1/health`);
  record('perf', apiHealthMs < 1000, 'API /health < 1s', `${apiHealthMs}ms`);
  const statsMs = await timeRequest(`${API}/api/v1/public/stats`);
  record('perf', statsMs < 1500, 'API /public/stats < 1.5s', `${statsMs}ms`);

  console.log('\n━━━━ SÉCURITÉ (headers, CORS) ━━━━');
  const h = await fetch(`${BASE}/`).then(r => r.headers).catch(() => null);
  if (h) {
    record('security', !!h.get('strict-transport-security'), 'HSTS (frontend)');
    record('security', !!h.get('x-frame-options') || !!h.get('content-security-policy'), 'X-Frame-Options ou CSP');
    record('security', !!h.get('x-content-type-options'), 'X-Content-Type-Options: nosniff');
  }
  const cors = await fetch(`${API}/api/v1/public/stats`, { headers: { Origin: 'http://evil.example.com' } }).then(r => r.headers.get('access-control-allow-origin') || '').catch(() => 'fail');
  record('security', cors !== '*', 'CORS pas wildcard', `ACAO: "${cors}"`);

  console.log('\n━━━━ COMPLIANCE / LOI 25 ━━━━');
  await page.goto(`${BASE}/`, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(1500);
  const cookieDialog = await page.locator('[role="dialog"][aria-label*="cookie"]').count();
  record('compliance', cookieDialog > 0, 'bandeau cookies (Loi 25)', cookieDialog ? 'présent' : 'MANQUANT');
  let legalFound = 0;
  for (const path of ['/conditions', '/terms', '/cgu', '/privacy', '/confidentialite']) {
    const s = await fetch(`${BASE}${path}`).then(r => r.status).catch(() => 0);
    if (s === 200) legalFound++;
  }
  record('compliance', legalFound >= 2, 'pages légales (CGU + confidentialité) en ligne', `${legalFound} trouvées`);

  console.log('\n━━━━ A11Y (basique) ━━━━');
  await page.goto(`${BASE}/`, { waitUntil: 'domcontentloaded' });
  await dismissCookies(page);
  await page.waitForTimeout(1500);
  const imgsNoAlt = await page.locator('img:not([alt])').count();
  record('a11y', imgsNoAlt === 0, 'toutes les <img> ont alt', `${imgsNoAlt} sans alt`);
  const h1 = await page.locator('h1').count();
  record('a11y', h1 === 1, 'exactement un <h1> sur home', `${h1}`);

  console.log('\n━━━━ MONITORING ━━━━');
  const health = await fetch(`${API}/api/v1/health`).then(r => r.json()).catch(() => null);
  if (health) {
    record('monitoring', health.status === 'ok' || health.status === 'degraded', 'API /health répond', `status=${health.status}`);
    record('monitoring', !!health.deployVersion, 'deployVersion exposé', health.deployVersion);
  }
  const sentry = await page.evaluate(() => typeof window !== 'undefined' && !!window.Sentry).catch(() => false);
  record('monitoring', sentry, 'Sentry SDK chargé (browser)');

  console.log('\n━━━━ DONNÉES SEED PUBLIQUES (🔒 pas de mocks visibles) ━━━━');
  const stats = await fetch(`${API}/api/v1/public/stats`).then(r => r.json()).catch(() => null);
  if (stats) {
    const seedVisible = (stats.openMissions || 0) + (stats.completedMissions || 0) > 0;
    record('content', !seedVisible, 'aucune mission seed/démo publique',
      `open=${stats.openMissions} completed=${stats.completedMissions} rating=${stats.averagePlatformRating} workers=${stats.activeWorkers}`);
  }

  // ════════ RÉSUMÉ / INVENTAIRE ════════
  console.log('\n\n════════ INVENTAIRE BUGS / MANQUES (read-only) ════════');
  let totalPass = 0, totalFail = 0;
  const fails = [];
  for (const [cat, slot] of Object.entries(results)) {
    totalPass += slot.pass; totalFail += slot.fail;
    console.log(`${slot.fail === 0 ? '✅' : '⚠️ '} ${cat.padEnd(12)} ${slot.pass} ok / ${slot.fail} échec`);
    for (const it of slot.items) if (!it.ok) fails.push(`[${cat}] ${it.label}${it.detail ? ` — ${it.detail}` : ''}`);
  }
  console.log(`\nTOTAL: ${totalPass} ok / ${totalFail} échec`);
  if (fails.length) {
    console.log('\n❌ À CORRIGER :');
    fails.forEach((f, i) => console.log(`  ${i + 1}. ${f}`));
  }
  if (errors.length) {
    console.log(`\n🐞 ERREURS CONSOLE/PAGE (${errors.length}) :`);
    [...new Set(errors)].slice(0, 15).forEach(e => console.log(`  • ${e}`));
  }

  await browser.close();
  process.exit(0);
})().catch(e => { console.error('AUDIT CRASH:', e); process.exit(1); });
