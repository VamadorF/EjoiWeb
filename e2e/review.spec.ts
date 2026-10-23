import { expect, test } from '@playwright/test';

import {
  installIntegrationMock,
  LEGACY_BE_DRAFT_WEB_VIEWS,
  loginWithTestSession,
  resetIntegrationMockState,
} from './fixtures/integrationMock';
import { advanceToWizardStep } from './fixtures/wizardFlow';
import { WIZARD_V2_SCREENS } from '../src/platform/mocks/wizard';

test.describe('Revisión antes de crear', () => {
  test.beforeEach(() => {
    resetIntegrationMockState();
  });

  test('wizard nombre guarda revision y muestra tarjeta con CTA bloqueado', async ({ page }) => {
    await installIntegrationMock(page);
    await page.goto('/acceso');
    await loginWithTestSession(page);
    await advanceToWizardStep(page, 4);

    await page.getByLabel('Nombre').fill('Luna');
    await page.getByRole('checkbox').click();
    await page.getByRole('button', { name: 'Crear' }).click();
    await page.waitForURL('**/crear/revision');

    await expect(page.getByTestId('create-review-page')).toBeVisible();
    await expect(page.getByTestId('companion-card')).toBeVisible();
    await expect(page.getByTestId('review-create-cta')).toBeDisabled();
  });

  test('Crear llega a revisión aunque el BE rechace webView "revision"', async ({ page }) => {
    await installIntegrationMock(page, { draftWebViews: LEGACY_BE_DRAFT_WEB_VIEWS });
    await page.goto('/acceso');
    await loginWithTestSession(page);
    await advanceToWizardStep(page, 4);

    await page.getByLabel('Nombre').fill('Luna');
    await page.getByRole('checkbox').click();
    await page.getByRole('button', { name: 'Crear' }).click();
    await page.waitForURL('**/crear/revision');

    await expect(page.getByTestId('create-review-page')).toBeVisible();
  });

  test('consentimiento y creación envían retrato', async ({ page }) => {
    await installIntegrationMock(page);
    let companionBody: Record<string, unknown> | null = null;
    await page.route('**/api/companion/me', async (route) => {
      if (route.request().method() === 'POST') {
        companionBody = route.request().postDataJSON() as Record<string, unknown>;
      }
      await route.continue();
    });

    await page.goto('/acceso');
    await loginWithTestSession(page);
    await advanceToWizardStep(page, 4);
    await page.getByLabel('Nombre').fill('Luna');
    await page.getByRole('checkbox').click();
    await page.getByRole('button', { name: 'Crear' }).click();
    await page.waitForURL('**/crear/revision');

    await expect(page.getByTestId('review-create-cta')).toBeEnabled({ timeout: 20_000 });

    const consentChecks = page.getByTestId('review-consent').getByRole('checkbox');
    const count = await consentChecks.count();
    for (let i = 0; i < count; i += 1) {
      const box = consentChecks.nth(i);
      if (!(await box.isChecked())) await box.check();
    }

    await page.getByTestId('review-create-cta').click();
    await page.waitForURL('**/crear/creando');

    expect(companionBody?.avatarUrl).toBeTruthy();
    expect(companionBody?.name).toBe('Luna');
  });

  test('Crear compañera llega a creando aunque el BE rechace webView "revision"', async ({ page }) => {
    await installIntegrationMock(page, { draftWebViews: LEGACY_BE_DRAFT_WEB_VIEWS });
    await page.goto('/acceso');
    await loginWithTestSession(page);
    await advanceToWizardStep(page, 4);
    await page.getByLabel('Nombre').fill('Luna');
    await page.getByRole('checkbox').click();
    await page.getByRole('button', { name: 'Crear' }).click();
    await page.waitForURL('**/crear/revision');

    const consentChecks = page.getByTestId('review-consent').getByRole('checkbox');
    const count = await consentChecks.count();
    for (let i = 0; i < count; i += 1) {
      const box = consentChecks.nth(i);
      if (!(await box.isChecked())) await box.check();
    }

    await expect(page.getByTestId('review-create-cta')).toBeEnabled({ timeout: 20_000 });
    await page.getByTestId('review-create-cta').click();
    await page.waitForURL('**/crear/creando');
  });

  test('editar desde revisión vuelve con volver=revision', async ({ page }) => {
    await installIntegrationMock(page);
    await page.goto('/acceso');
    await loginWithTestSession(page);
    await advanceToWizardStep(page, 4);
    await page.getByLabel('Nombre').fill('Luna');
    await page.getByRole('checkbox').click();
    await page.getByRole('button', { name: 'Crear' }).click();
    await page.waitForURL('**/crear/revision');

    await page.getByRole('button', { name: 'Editar' }).first().click();
    await page.waitForURL(`**${WIZARD_V2_SCREENS.nombre}**volver=revision`);
    await expect(page.getByRole('button', { name: 'Guardar y volver' })).toBeVisible();
  });
});
