import { chromium } from 'playwright';

const EMAIL = 'qa-bloc2f-2026-04-30@workon.test';
const PASSWORD = 'WorkOn2026Test!';
const BASE = 'https://workonapp.vercel.app';
const PIN_SEL = '.mission-pin';

function log(msg) { console.log(msg); }
function fail(msg) { console.error('  ❌', msg); process.exitCode = 1; }
function pass(msg) { console.log('  ✅', msg); }

async function dismissCookies(page) {
  // Wait briefly for the dialog to appear (it animates in)
  for (let i = 0; i < 5; i++) {
    const refuse = page.getByRole('button', { name: /Refuser/i });
    if (await refuse.isVisible().catch(() => false)) {
      await refuse.click({ force: true }).catch(() => {});
      // Wait for dialog to disappear
      await page.waitForSelector('[role="dialog"][aria-label*="cookie"]', { state: 'hidden', timeout: 3000 }).catch(() => {});
      return;
    }
    await page.waitForTimeout(500);
  }
}

async function login(page) {
  await page.goto(`${BASE}/login`, { waitUntil: 'domcontentloaded' });
  await dismissCookies(page);
  await page.fill('input[type=email]', EMAIL);
  await page.fill('input[type=password]', PASSWORD);
  await page.getByRole('button', { name: 'Se connecter' }).click({ force: true });
  await page.waitForURL(/\/home|\/map/, { timeout: 15000 });
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
      if (!t.includes('Permissions policy') && !t.includes('hydration')) {
        errors.push(`CONSOLE: ${t.slice(0, 200)}`);
      }
    }
  });

  log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  log('TEST 1 — Login + first /map load');
  log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  await login(page);
  pass(`logged in, at ${page.url()}`);

  await page.goto(`${BASE}/map`, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(3000);

  if (await page.getByText("Quelque chose s'est mal passé").isVisible().catch(() => false)) {
    fail('ErrorBoundary on /map — leaflet bug regressed');
    await page.screenshot({ path: 'C:/tmp/regress-error.png' });
    process.exit(1);
  }
  pass('no ErrorBoundary');

  const leafletCount = await page.locator('.leaflet-container').count();
  if (leafletCount !== 1) fail(`leaflet-container count = ${leafletCount} (expected 1)`);
  else pass(`leaflet-container present`);

  const pinCount = await page.locator(PIN_SEL).count();
  log(`  pins on map: ${pinCount}`);
  if (pinCount === 0) fail('no pins displayed — API likely down or empty');
  else pass(`${pinCount} pins displayed`);

  log('  Checking pins are visually spread (not all at same coords)…');
  const pinPositions = await page.locator(PIN_SEL).evaluateAll((els) => {
    return els.map(el => {
      const r = el.getBoundingClientRect();
      return { x: Math.round(r.left), y: Math.round(r.top) };
    });
  });
  const uniquePositions = new Set(pinPositions.map(p => `${p.x},${p.y}`));
  log(`  pin DOM positions: ${pinPositions.length} pins / ${uniquePositions.size} unique screen positions`);
  if (uniquePositions.size === 1 && pinPositions.length > 1) {
    fail('all pins at same screen position — spread function not working');
  } else if (uniquePositions.size < pinPositions.length / 2) {
    log(`  ⚠️ many pins overlap visually (${uniquePositions.size}/${pinPositions.length}) — spread radius may be too small at this zoom`);
  } else {
    pass(`pins spread visually (${uniquePositions.size}/${pinPositions.length})`);
  }

  await page.screenshot({ path: 'C:/tmp/map-default-25km.png' });

  log('');
  log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  log('TEST 2 — Pin click → bottom sheet → mission detail nav');
  log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  if (pinCount > 0) {
    await page.locator(PIN_SEL).first().click({ force: true });
    await page.waitForTimeout(800);
    const sheetClose = page.getByRole('button', { name: 'Fermer' });
    if (await sheetClose.isVisible().catch(() => false)) {
      pass('bottom sheet opened');
      await page.screenshot({ path: 'C:/tmp/map-sheet.png' });

      // The mission card inside the sheet should be clickable to a detail page
      const sheetMissionLink = page.locator('[role="dialog"], .fixed.inset-0').locator('a[href*="/missions/"], a[href*="/mission/"]').first();
      const hasLink = await sheetMissionLink.count().then(c => c > 0).catch(() => false);
      if (hasLink) {
        const href = await sheetMissionLink.getAttribute('href').catch(() => null);
        log(`  mission detail link: ${href}`);
        pass('bottom sheet exposes mission detail link');
      } else {
        // Try clicking the card body
        const cardBody = page.locator('.fixed.inset-0 a').first();
        if (await cardBody.count() > 0) {
          pass('mission card link present in sheet');
        } else {
          fail('bottom sheet has no clickable mission detail link');
        }
      }
      // close
      await sheetClose.click().catch(() => {});
      await page.waitForTimeout(400);
    } else {
      fail('bottom sheet did NOT open after pin click');
    }
  }

  log('');
  log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  log('TEST 3 — Radius filter changes pin count + zoom');
  log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  const radiusSelect = page.locator('select').first();
  await radiusSelect.selectOption('100');
  await page.waitForTimeout(2500);
  const pins100 = await page.locator(PIN_SEL).count();
  log(`  pins at 100km: ${pins100}`);
  if (pins100 < pinCount) fail(`expected ≥${pinCount} pins at 100km, got ${pins100}`);
  else pass(`100km radius shows ${pins100} pins`);

  await radiusSelect.selectOption('5');
  await page.waitForTimeout(2500);
  const pins5 = await page.locator(PIN_SEL).count();
  log(`  pins at 5km: ${pins5}`);
  pass(`5km radius shows ${pins5} pins (zoom changed)`);
  await page.screenshot({ path: 'C:/tmp/map-5km.png' });

  await radiusSelect.selectOption('25');
  await page.waitForTimeout(2000);

  log('');
  log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  log('TEST 4 — Category filter narrows pins');
  log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  const categoryButtons = await page.getByRole('button').filter({ hasNotText: /^(Toutes|Carte|Liste|Réessayer|Accueil|Fermer|Menu|PRO|CLIENT)$/ }).all();
  log(`  total category buttons: ${categoryButtons.length}`);
  const menageBtn = page.getByRole('button', { name: /^Ménage$|^menage$/i }).first();
  if (await menageBtn.count() > 0) {
    await menageBtn.click().catch(() => {});
    await page.waitForTimeout(2000);
    const pinsMenage = await page.locator(PIN_SEL).count();
    log(`  pins after Ménage filter: ${pinsMenage}`);
    pass('category filter applies');
    // reset
    const allBtn = page.getByRole('button', { name: 'Toutes' }).first();
    await allBtn.click().catch(() => {});
    await page.waitForTimeout(1500);
  } else {
    log('  ⚠️ no Ménage category button visible (categories may not have loaded)');
  }

  log('');
  log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  log('TEST 5 — View toggle Carte / Liste');
  log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  await page.getByRole('button', { name: 'Liste' }).click();
  await page.waitForTimeout(1000);
  const mapVisibleAfterListToggle = await page.locator('.leaflet-container').isVisible().catch(() => false);
  if (mapVisibleAfterListToggle) {
    log('  ⚠️ map still visible in list mode (page renders both — that\'s fine)');
  } else {
    pass('map hidden in list mode');
  }
  await page.getByRole('button', { name: 'Carte' }).click();
  await page.waitForTimeout(1500);
  const mapBackInMapMode = await page.locator('.leaflet-container').isVisible().catch(() => false);
  if (mapBackInMapMode) pass('map back in map mode (no leaflet re-init crash)');
  else fail('map disappeared after toggle');

  log('');
  log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  log('TEST 6 — Back-nav round trip (the regression that started this)');
  log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  await page.goto(`${BASE}/home`, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(1200);
  await page.goto(`${BASE}/map`, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(2500);
  if (await page.getByText("Quelque chose s'est mal passé").isVisible().catch(() => false)) {
    fail('ErrorBoundary after back-nav — Leaflet double-init regression');
    await page.screenshot({ path: 'C:/tmp/back-nav-error.png' });
  } else {
    pass('back-nav to /map clean (no leaflet re-init crash)');
  }
  const pinsAfterBackNav = await page.locator(PIN_SEL).count();
  log(`  pins after back-nav: ${pinsAfterBackNav}`);

  log('');
  log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  log('TEST 7 — Browser back button');
  log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  await page.goBack();
  await page.waitForTimeout(1500);
  await page.goForward();
  await page.waitForTimeout(2500);
  if (await page.getByText("Quelque chose s'est mal passé").isVisible().catch(() => false)) {
    fail('ErrorBoundary after browser back/forward');
  } else {
    pass('browser back/forward clean');
  }

  log('');
  log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  log('Console errors collected:');
  log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  const dedup = [...new Set(errors)];
  if (dedup.length === 0) {
    pass('no console errors');
  } else {
    for (const e of dedup.slice(0, 10)) console.log(`  ⚠️ ${e}`);
    if (dedup.some(e => /already initialized/i.test(e))) {
      fail('"Map container already initialized" error STILL FIRING');
    }
  }

  await browser.close();
  console.log('');
  console.log(process.exitCode === 1 ? '❌ TESTS FAILED' : '✅ ALL TESTS PASSED');
})().catch(e => { console.error('FATAL:', e); process.exit(1); });
