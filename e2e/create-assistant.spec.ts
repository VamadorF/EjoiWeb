import { expect, test } from '@playwright/test';

import {
  installIntegrationMock,
  loginWithTestSession,
  resetIntegrationMockState,
} from './fixtures/integrationMock';
import { advanceToWizardStep, fillWizardStep1, fillWizardStep3Interests } from './fixtures/wizardFlow';
import { WIZARD_V2_SCREENS } from '../src/platform/mocks/wizard';

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
    await page.waitForURL(`**${WIZARD_V2_SCREENS.genero}`, { timeout: 15_000 });
  }

  test('Salir pide confirmación y conserva el draft tras volver a entrar', async ({ page }) => {
    const handle = await installIntegrationMock(page);
    await page.goto('/acceso');
    await loginWithTestSession(page);
    await page.reload();
    await page.goto(WIZARD_V2_SCREENS.genero);
    await fillWizardStep1(page);
    await page.getByRole('button', { name: 'Siguiente' }).click();
    await page.waitForURL(`**${WIZARD_V2_SCREENS.presencia}`);
    await page.getByRole('button', { name: 'Siguiente' }).click();
    await page.waitForURL(`**${WIZARD_V2_SCREENS.limites}`);
    await page.getByRole('button', { name: 'Siguiente' }).click();
    await page.waitForURL(`**${WIZARD_V2_SCREENS.intereses}`);
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
    await page.goto(WIZARD_V2_SCREENS.intereses);
    await expect(page.getByRole('button', { name: 'Música' })).toHaveAttribute('aria-pressed', 'true');
  });

  test('el nombre no abre el panel lateral', async ({ page }) => {
    await boot(page);
    await advanceToWizardStep(page, 4);
    await page.locator('#companion-name-input').fill('Luna');
    await expect(page.getByTestId('shell-preview')).toHaveCount(0);
    await expect(page.getByTestId('creation-preview-card')).toHaveCount(0);
  });
});
