import { expect, test, type Page } from '@playwright/test';

import { buildFirstMessageTemplate } from '../src/platform/mockGreeting';

async function mockGuestApi(page: Page) {
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

async function mockAuthedApi(page: Page) {
  await page.route('**/api/**', async (route) => {
    const path = new URL(route.request().url()).pathname.replace(/^\/api/, '');
    if (path.includes('/auth/refresh')) {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ accessToken: 'e2e-home' }),
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

test.describe('Inicio público (SCRUM-172)', () => {
  test.use({ viewport: { width: 1440, height: 900 } });

  test('sin sesión muestra la página de inicio en /', async ({ page }) => {
    await mockGuestApi(page);
    await page.goto('/');
    await expect(page.getByTestId('page-inicio')).toBeVisible();
    await expect(page).toHaveURL(/https?:\/\/[^/]+\/?$/);
  });

  test('con sesión redirige desde / al destino habitual', async ({ page }) => {
    await mockAuthedApi(page);
    await page.goto('/');
    await page.waitForURL(/\/chat\/?$/, { timeout: 15_000 });
    await expect(page.getByTestId('page-inicio')).not.toBeVisible();
  });

  test('hero visible sin scroll y ejemplo con plantilla real', async ({ page }) => {
    await mockGuestApi(page);
    await page.goto('/');
    await expect(page.getByTestId('page-inicio')).toBeVisible();

    const scrollHeight = await page.evaluate(() => document.documentElement.scrollHeight);
    expect(scrollHeight).toBeGreaterThanOrEqual(900);

    await expect(page.getByRole('heading', { level: 1 })).toContainText('conversar');
    await expect(page.getByRole('link', { name: 'Crear mi eJoi' }).first()).toBeVisible();
    await expect(page.getByText('Espacio seguro')).toBeVisible();
    await expect(page.locator('.home-hero__portraits img')).toHaveCount(3);
    await expect(page.getByText('Ejemplo')).toBeVisible();

    const expected = buildFirstMessageTemplate('Sofía', ['Música', 'Viajes']);
    await expect(page.locator('.home-hero__example .bubble--ai')).toContainText(expected);
    await expect(page.locator('.home-hero__example .bubble__hl')).toContainText(['música', 'viajes']);
  });

  test('Tab llega a Crear mi eJoi antes que enlaces del pie', async ({ page }) => {
    await mockGuestApi(page);
    await page.goto('/');
    await page.locator('body').click({ position: { x: 8, y: 8 } });

    const footerLink = page.getByRole('link', { name: 'Términos y Condiciones' });
    const createLinks = page.getByRole('link', { name: 'Crear mi eJoi' });
    const seenCreate = { value: false };

    for (let i = 0; i < 35; i += 1) {
      await page.keyboard.press('Tab');
      if (await createLinks.first().evaluate((el) => el === document.activeElement)) {
        seenCreate.value = true;
      }
      if (
        seenCreate.value &&
        (await footerLink.evaluate((el) => el === document.activeElement))
      ) {
        break;
      }
    }

    expect(seenCreate.value).toBe(true);
    const createBeforeFooter = await page.evaluate(() => {
      const create = document.querySelector('.home-hero__ctas .btn--primary');
      const footer = document.querySelector('.home-footer a');
      if (!create || !footer) return false;
      return (
        create.compareDocumentPosition(footer) & Node.DOCUMENT_POSITION_FOLLOWING
      ) !== 0;
    });
    expect(createBeforeFooter).toBe(true);
  });

  test('Iniciar sesión en cabecera activa modo returning en acceso', async ({ page }) => {
    await mockGuestApi(page);
    await page.goto('/');
    await page.getByRole('button', { name: 'Iniciar sesión' }).click();
    await expect(page.getByRole('heading', { name: 'Qué bueno verte de nuevo' })).toBeVisible();
  });
});
