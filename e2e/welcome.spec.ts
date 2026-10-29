import { expect, test } from '@playwright/test';

import { mockWelcomeAuthedApi, mockWelcomeGuestApi } from '../src/platform/mocks/welcome';

test.describe('Bienvenida (PAR-WEB-04)', () => {
  test.use({ viewport: { width: 1440, height: 900 } });

  test('sin sesión muestra bienvenida en /', async ({ page }) => {
    await mockWelcomeGuestApi(page);
    await page.goto('/');
    await expect(page.getByTestId('page-bienvenida')).toBeVisible();
    await expect(page).toHaveURL(/https?:\/\/[^/]+\/?$/);
  });

  test('con sesión redirige desde / al destino habitual', async ({ page }) => {
    await mockWelcomeAuthedApi(page);
    await page.goto('/');
    await page.waitForURL(/\/chat\/?$/, { timeout: 15_000 });
    await expect(page.getByTestId('page-bienvenida')).not.toBeVisible();
  });

  test('/acceso redirige a /', async ({ page }) => {
    await mockWelcomeGuestApi(page);
    await page.goto('/acceso');
    await expect(page).toHaveURL(/https?:\/\/[^/]+\/?$/);
    await expect(page.getByTestId('page-bienvenida')).toBeVisible();
  });

  test('composición LoginScreen sin marketing', async ({ page }) => {
    await mockWelcomeGuestApi(page);
    await page.goto('/');
    await expect(page.getByRole('heading', { level: 1 })).toContainText('conversar');
    await expect(page.getByText('Espacio seguro')).toBeVisible();
    await expect(page.getByText('Apoyo emocional')).toBeVisible();
    await expect(page.getByText('Hábitos')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Tengo un código' })).toBeDisabled();
    await expect(page.locator('.home-hero__portraits')).toHaveCount(0);
    await expect(page.getByText('Ejemplo')).not.toBeVisible();
  });

  test('la bienvenida no muestra Iniciar sesión', async ({ page }) => {
    await mockWelcomeGuestApi(page);
    await page.goto('/');
    await expect(page.getByRole('button', { name: 'Iniciar sesión' })).toHaveCount(0);
    await expect(page.getByRole('button', { name: 'Tengo un código' })).toBeVisible();
  });
});
