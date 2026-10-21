import type { Page } from '@playwright/test';

/** Rutas API mínimas para e2e de bienvenida (invitado). */
export async function mockWelcomeGuestApi(page: Page) {
  await page.route('**/api/**', async (route) => {
    const path = new URL(route.request().url()).pathname.replace(/^\/api/, '');
    if (path.includes('/auth/refresh')) {
      await route.fulfill({ status: 401, contentType: 'application/json', body: '{}' });
      return;
    }
    if (path.includes('/campaign/founder-count')) {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ claimed: 0, max: 100 }),
      });
      return;
    }
    await route.fulfill({ status: 200, contentType: 'application/json', body: '{}' });
  });
}

/** Sesión autenticada + companion listo (redirección desde `/`). */
export async function mockWelcomeAuthedApi(page: Page) {
  await page.route('**/api/**', async (route) => {
    const path = new URL(route.request().url()).pathname.replace(/^\/api/, '');
    if (path.includes('/auth/refresh')) {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ accessToken: 'e2e-welcome' }),
      });
      return;
    }
    if (path.includes('/companion/me/creation')) {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          state: 'ready',
          profile: { id: 'c1', name: 'Luna', visualStyle: 'realista' },
        }),
      });
      return;
    }
    if (path.includes('/users/me/onboarding-draft')) {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ data: null }),
      });
      return;
    }
    await route.fulfill({ status: 200, contentType: 'application/json', body: '{}' });
  });
}
