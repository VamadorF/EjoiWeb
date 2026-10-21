import { expect, test } from '@playwright/test';

import {
  installIntegrationMock,
  loginWithTestSession,
  resetIntegrationMockState,
} from './fixtures/integrationMock';
import { advanceToWizardStep, fillWizardStep1, fillWizardStep3Interests } from './fixtures/wizardFlow';

test.describe('Asistente único 4 pasos SCRUM-174', () => {
  test.beforeEach(() => {
    resetIntegrationMockState();
  });

  test.describe('escritorio 1440', () => {
    test.use({ viewport: { width: 1440, height: 900 } });

    test('pasos 1→4 y redirects quien/como', async ({ page }) => {
      await installIntegrationMock(page);
      await page.goto('/acceso');
      await loginWithTestSession(page);
      await page.reload();
      await page.waitForURL('**/crear/paso-1', { timeout: 15_000 });

      await page.goto('/crear/quien');
      await page.waitForURL('**/crear/paso-1');
      await page.goto('/crear/como');
      await page.waitForURL('**/crear/paso-4');

      await page.goto('/crear/paso-1');
      await fillWizardStep1(page);
      await page.getByRole('button', { name: 'Continuar' }).click();
      await page.waitForURL('**/crear/paso-2');
      await page.getByRole('button', { name: 'Continuar' }).click();
      await page.waitForURL('**/crear/paso-3');
      await fillWizardStep3Interests(page);
      await page.getByRole('button', { name: 'Continuar' }).click();
      await page.waitForURL('**/crear/paso-4');
      await expect(page.getByTestId('create-wizard')).toBeVisible();
    });

    test('presencia con descripción y Recomendada', async ({ page }) => {
      await installIntegrationMock(page);
      await page.goto('/acceso');
      await loginWithTestSession(page);
      await advanceToWizardStep(page, 2);
      await expect(page.getByTestId('presence-balanced')).toContainText('Equilibrio entre cercanía');
      await expect(page.getByTestId('presence-balanced')).toContainText('Recomendada');
    });
  });

  test('recarga en cada paso conserva elecciones', async ({ page }) => {
    await installIntegrationMock(page);
    await page.goto('/acceso');
    await loginWithTestSession(page);
    await page.goto('/crear/paso-1');
    await fillWizardStep1(page);
    await page.waitForTimeout(400);
    await page.reload();
    await expect(page.getByRole('radio', { name: 'Femenino' })).toHaveAttribute('aria-checked', 'true');

    await page.getByRole('button', { name: 'Continuar' }).click();
    await page.waitForURL('**/crear/paso-2');
    await page.getByRole('radio', { name: 'Equilibrada' }).click();
    await page.waitForTimeout(400);
    await page.reload();
    await expect(page.getByRole('radio', { name: 'Equilibrada' })).toHaveAttribute('aria-checked', 'true');

    await page.getByRole('button', { name: 'Continuar' }).click();
    await page.waitForURL('**/crear/paso-3');
    await fillWizardStep3Interests(page);
    await page.waitForTimeout(400);
    await page.reload();
    await expect(page.getByRole('button', { name: 'Música' })).toHaveAttribute('aria-pressed', 'true');
  });

  test('800 px recorre los 4 pasos', async ({ page }) => {
    await page.setViewportSize({ width: 800, height: 900 });
    await installIntegrationMock(page);
    await page.goto('/acceso');
    await loginWithTestSession(page);
    await page.goto('/crear/paso-1');
    await expect(page.getByTestId('create-wizard-step')).toContainText('1/4');
    await fillWizardStep1(page);
    await page.getByRole('button', { name: 'Continuar' }).click();
    await expect(page.getByTestId('create-wizard-step')).toContainText('2/4');
    await page.getByRole('button', { name: 'Continuar' }).click();
    await expect(page.getByTestId('create-wizard-step')).toContainText('3/4');
    await fillWizardStep3Interests(page);
    await page.getByRole('button', { name: 'Continuar' }).click();
    await expect(page.getByTestId('create-wizard-step')).toContainText('4/4');
  });
});
