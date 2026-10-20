import { expect, test } from '@playwright/test';

import {
  installIntegrationMock,
  loginWithTestSession,
  resetIntegrationMockState,
} from './fixtures/integrationMock';

test.describe('Asistente de creación SCRUM-166', () => {
  test.use({ viewport: { width: 1440, height: 900 } });

  test.beforeEach(() => {
    resetIntegrationMockState();
  });

  async function boot(page: import('@playwright/test').Page) {
    await installIntegrationMock(page);
    await page.goto('/acceso');
    await loginWithTestSession(page);
    await page.reload();
    await page.waitForURL('**/crear/quien', { timeout: 15_000 });
  }

  test('Salir pide confirmación y conserva el draft tras volver a entrar', async ({ page }) => {
    const handle = await installIntegrationMock(page);
    await page.goto('/acceso');
    await loginWithTestSession(page);
    await page.reload();
    await page.goto('/crear/quien');
    await page.getByRole('radio', { name: 'Femenino' }).click();
    await page.getByRole('radio', { name: 'Realista' }).click();
    for (const label of ['Música', 'Cine y series', 'Viajes']) {
      await page.getByRole('button', { name: label }).click();
    }
    await page.waitForTimeout(500);

    await page.getByTestId('create-exit').click();
    await expect(page.getByTestId('create-exit-dialog')).toBeVisible();
    await page.getByRole('button', { name: 'Seguir creando' }).click();
    await expect(page.getByTestId('create-exit-dialog')).not.toBeVisible();

    await page.getByTestId('create-exit').click();
    await page.getByTestId('create-exit-confirm').click();
    await page.waitForURL('**/acceso', { timeout: 15_000 });
    expect(handle.getDraft()?.data).toMatchObject({
      gender: 'femenino',
      visualStyle: 'realista',
    });

    await loginWithTestSession(page);
    await page.reload();
    await page.goto('/crear/quien');
    await expect(page.getByRole('radio', { name: 'Femenino' })).toHaveAttribute('aria-checked', 'true');
    await expect(page.getByRole('button', { name: 'Música' })).toHaveAttribute('aria-pressed', 'true');
  });

  async function fillWho(page: import('@playwright/test').Page) {
    await page.getByRole('radio', { name: 'Femenino' }).click();
    await page.getByRole('radio', { name: 'Realista' }).click();
    for (const label of ['Música', 'Cine y series', 'Viajes']) {
      await page.getByRole('button', { name: label }).click();
    }
  }

  test('presencia muestra descripción y Recomendada en Equilibrada', async ({ page }) => {
    await boot(page);
    await fillWho(page);
    await page.getByRole('button', { name: 'Continuar' }).click();
    await page.waitForURL('**/crear/como');
    await expect(page.getByTestId('presence-balanced')).toContainText('Equilibrio entre cercanía');
    await expect(page.getByTestId('presence-balanced')).toContainText('Recomendada');
    await expect(page.getByTestId('presence-soft')).toContainText('Una presencia ligera');
  });

  test('preview cita intereses con nombre válido', async ({ page }) => {
    await boot(page);
    await fillWho(page);
    await page.getByRole('button', { name: 'Continuar' }).click();
    await page.waitForURL('**/crear/como');

    await page.route('**/api/companion/greeting-preview', async (route) => {
      const body = route.request().postDataJSON() as { interests?: string[] };
      const i1 = body.interests?.[0]?.toLowerCase() ?? 'música';
      const i2 = body.interests?.[1]?.toLowerCase() ?? 'viajes';
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          greeting: `¡Hola! Soy Luna. Vi que te interesan ${i1} y ${i2}, así que tengo curiosidad.`,
          basedOnInterests: body.interests ?? [],
          quickReplies: [],
          source: 'template',
        }),
      });
    });

    await page.locator('#create-how-form .field__control').first().fill('Luna');
    await expect(page.getByTestId('creation-preview-greeting')).toContainText(/música y cine y series/i, {
      timeout: 5_000,
    });
  });
});
