import { expect, test } from '@playwright/test';

import {
  installIntegrationMock,
  loginWithTestSession,
  resetIntegrationMockState,
} from './fixtures/integrationMock';
import { advanceToWizardStep, fillWizardStep1, fillWizardStep3Interests } from './fixtures/wizardFlow';

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
    await page.waitForURL('**/crear/paso-1', { timeout: 15_000 });
  }

  test('Salir pide confirmación y conserva el draft tras volver a entrar', async ({ page }) => {
    const handle = await installIntegrationMock(page);
    await page.goto('/acceso');
    await loginWithTestSession(page);
    await page.reload();
    await page.goto('/crear/paso-1');
    await fillWizardStep1(page);
    await page.getByRole('button', { name: 'Continuar' }).click();
    await page.waitForURL('**/crear/paso-2');
    await page.getByRole('button', { name: 'Continuar' }).click();
    await page.waitForURL('**/crear/paso-3');
    await fillWizardStep3Interests(page);
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
    await page.goto('/crear/paso-3');
    await expect(page.getByRole('button', { name: 'Música' })).toHaveAttribute('aria-pressed', 'true');
  });

  test('preview cita intereses con nombre válido', async ({ page }) => {
    await boot(page);
    await advanceToWizardStep(page, 4);

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

    await page.locator('#create-wizard-form .field__control').first().fill('Luna');
    await expect(page.getByTestId('creation-preview-greeting')).toContainText(/música y cine y series/i, {
      timeout: 5_000,
    });
  });
});
