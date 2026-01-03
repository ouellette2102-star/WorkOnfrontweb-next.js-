/**
 * Smoke Tests - WorkOn Frontend
 * 
 * Tests de sanité de base pour vérifier que les routes principales fonctionnent.
 * Ces tests sont rapides et doivent passer avant tout déploiement.
 * 
 * IMPORTANT: Ces tests ne nécessitent PAS le backend pour passer.
 * Les routes protégées doivent rediriger vers /sign-in ou /setup sans crash.
 * 
 * Usage:
 *   npm run smoke        # Run smoke tests
 *   npm run smoke:headed # Run with browser visible
 */

import { test, expect } from '@playwright/test';

// Configuration des timeouts
test.setTimeout(30000); // 30 secondes max par test

/**
 * 1. Frontend - Landing Page
 * Vérifie que la page d'accueil se charge sans crash
 */
test.describe('Frontend - Landing Page', () => {
  test('should load home page without crashing', async ({ page }) => {
    // Collecter les erreurs JavaScript
    const errors: string[] = [];
    page.on('pageerror', (error) => {
      errors.push(error.message);
    });

    // Naviguer vers la page d'accueil
    const response = await page.goto('/');
    
    // Vérifier que la page charge (200 ou redirect vers /setup si env manquant)
    expect(response?.status()).toBeLessThan(500);
    
    // Vérifier que le body est visible
    await expect(page.locator('body')).toBeVisible();
    
    // Attendre un peu pour que les erreurs potentielles se manifestent
    await page.waitForTimeout(2000);
    
    // Vérifier qu'il n'y a pas d'erreurs critiques
    const criticalErrors = errors.filter(err => 
      err.includes('Cannot read') || 
      err.includes('undefined is not') ||
      err.includes('null is not')
    );
    expect(criticalErrors).toHaveLength(0);
  });

  test('should not show 500 error', async ({ page }) => {
    await page.goto('/');
    
    const bodyText = await page.locator('body').textContent();
    expect(bodyText).not.toMatch(/500 Internal Server Error/i);
    expect(bodyText).not.toMatch(/Application error: a server-side exception/i);
  });
});

/**
 * 2. Frontend - Setup Page (always accessible)
 * La page /setup doit toujours fonctionner pour diagnostiquer les problèmes
 */
test.describe('Frontend - Setup Page', () => {
  test('should load setup page', async ({ page }) => {
    const response = await page.goto('/setup');
    
    expect(response?.status()).toBe(200);
    await expect(page.locator('body')).toBeVisible();
    
    // Vérifier que la page contient des infos de configuration
    const bodyText = await page.locator('body').textContent();
    expect(bodyText).toMatch(/Configuration|setup|env/i);
  });
});

/**
 * 3. Frontend - Public Pages
 * Vérifie que les pages publiques se chargent sans crash (200 ou redirect accepté)
 */
test.describe('Frontend - Public Pages', () => {
  const publicPages = [
    { path: '/', name: 'Home' },
    { path: '/setup', name: 'Setup' },
    { path: '/pricing', name: 'Pricing' },
    { path: '/faq', name: 'FAQ' },
    { path: '/legal/terms', name: 'Terms' },
    { path: '/legal/privacy', name: 'Privacy' },
  ];

  for (const { path, name } of publicPages) {
    test(`should load ${name} page (${path}) without 500`, async ({ page }) => {
      const response = await page.goto(path, { waitUntil: 'domcontentloaded' });
      
      // La page peut charger avec 200 ou rediriger (302/307) - pas de 500
      expect(response?.status()).toBeLessThan(500);
      
      // Vérifier que le body est visible
      await expect(page.locator('body')).toBeVisible();
      
      // Vérifier qu'il n'y a pas d'erreur serveur 500
      const bodyText = await page.locator('body').textContent();
      expect(bodyText).not.toMatch(/500 Internal Server Error/i);
      expect(bodyText).not.toMatch(/Application error: a server-side exception/i);
    });
  }
});

/**
 * 4. Frontend - Auth Protection (redirects)
 * Vérifie que les routes protégées redirigent proprement sans crash
 * Note: Avec le hardening PR-04, si Clerk n'est pas configuré,
 * les routes redirigent vers /setup au lieu de /sign-in
 */
test.describe('Frontend - Auth Protection', () => {
  const protectedPages = [
    { path: '/dashboard', name: 'Dashboard' },
    { path: '/profile', name: 'Profile' },
    { path: '/onboarding', name: 'Onboarding' },
    { path: '/missions/new', name: 'New Mission' },
    { path: '/missions/mine', name: 'My Missions' },
    { path: '/worker/dashboard', name: 'Worker Dashboard' },
    { path: '/employer/dashboard', name: 'Employer Dashboard' },
  ];

  for (const { path, name } of protectedPages) {
    test(`${name} (${path}) should redirect or load without crash`, async ({ page }) => {
      // Naviguer vers la page protégée
      const response = await page.goto(path, { waitUntil: 'domcontentloaded' });
      
      // Attendre une éventuelle redirection
      await page.waitForTimeout(2000);
      
      // La page peut:
      // 1. Rediriger vers /sign-in (si Clerk configuré)
      // 2. Rediriger vers /setup (si Clerk non configuré)
      // 3. Charger normalement (si auth OK)
      // Dans tous les cas, pas de 500
      const currentUrl = page.url();
      const status = response?.status() ?? 0;
      
      // Vérifier: soit redirect, soit 200, mais jamais 500
      const isRedirected = currentUrl.includes('/sign-in') || currentUrl.includes('/setup');
      const isLoaded = status === 200;
      const isNotServerError = status < 500;
      
      expect(isNotServerError).toBe(true);
      
      // Vérifier pas d'erreur visible dans le body
      const bodyText = await page.locator('body').textContent();
      expect(bodyText).not.toMatch(/500 Internal Server Error/i);
      expect(bodyText).not.toMatch(/Application error: a server-side exception/i);
    });
  }
});

/**
 * 5. Frontend - Debug Routes
 * Routes de debug qui doivent toujours fonctionner
 */
test.describe('Frontend - Debug Routes', () => {
  test('should load debug/health page', async ({ page }) => {
    const response = await page.goto('/debug/health');
    
    expect(response?.status()).toBe(200);
    await expect(page.locator('body')).toBeVisible();
  });

  test('should load debug/error-test page', async ({ page }) => {
    const response = await page.goto('/debug/error-test');
    
    expect(response?.status()).toBe(200);
    await expect(page.locator('body')).toBeVisible();
  });
});

/**
 * 6. API Routes (frontend-side)
 * Vérifie que les API routes Next.js répondent (peuvent être 401 si pas auth)
 */
test.describe('Frontend - API Routes', () => {
  test('should respond to /api/feed (may be 401)', async ({ request }) => {
    const response = await request.get('/api/feed');
    
    // L'API peut retourner 401 (non auth), 200 (success), ou autre
    // Mais pas 500 (crash)
    expect(response.status()).toBeLessThan(500);
  });
});

/**
 * 7. Backend Health (OPTIONAL - skip si non disponible)
 * Ce test est informatif et ne fait pas échouer la suite
 */
test.describe('Backend Health (optional)', () => {
  test.skip(({ }, testInfo) => {
    // Skip ce test si la variable SKIP_BACKEND_TESTS est définie
    return process.env.SKIP_BACKEND_TESTS === 'true';
  }, 'Backend tests skipped');

  test('backend health check (informative)', async ({ request }) => {
    try {
      const response = await request.get('http://localhost:3001/api/v1/health', {
        timeout: 5000,
      });
      
      if (response.status() === 200) {
        const data = await response.json();
        console.log('✅ Backend is running:', data);
      } else {
        console.log('⚠️ Backend responded with:', response.status());
      }
    } catch (error) {
      // Ne pas faire échouer le test si le backend n'est pas disponible
      console.log('ℹ️ Backend not available (this is OK for frontend-only smoke test)');
      test.skip();
    }
  });
});
