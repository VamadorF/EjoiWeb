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

  test.describe('composición calmada SCRUM-175', () => {
    test.use({ viewport: { width: 1440, height: 900 } });

    test.beforeEach(async ({ page }) => {
      await page.addInitScript(() => {
        sessionStorage.setItem('ejoi-mock-demo-logged-in', '1');
      });
      await page.route('**/api/**', async (route) => {
        const path = new URL(route.request().url()).pathname.replace(/^\/api/, '');
        if (path.includes('/auth/refresh')) {
          await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({ accessToken: 'e2e-wizard-175' }),
          });
          return;
        }
        if (path.includes('/users/me/onboarding-draft')) {
          await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({ draft: null }),
          });
          return;
        }
        await route.fulfill({ status: 200, contentType: 'application/json', body: '{}' });
      });
    });

    async function openWizardStep(page: import('@playwright/test').Page, step: 1 | 2 | 3 | 4) {
      await page.goto('/crear/paso-1');
      await page.getByTestId('create-wizard').waitFor({ state: 'visible', timeout: 15_000 });
      if (step === 1) return;
      await advanceToWizardStep(page, step);
      await page.waitForURL(`**/crear/paso-${step}`, { timeout: 15_000 });
    }

    for (const step of [1, 2, 3, 4] as const) {
      test(`paso ${step} cabe sin scroll a 1440×900`, async ({ page }) => {
        await openWizardStep(page, step);
        await page.getByTestId('wizard-step-panel').waitFor({ state: 'visible' });
        await page.waitForTimeout(280);
        const scrollHeight = await page.evaluate(() => document.documentElement.scrollHeight);
        // ponytail: 1px de holgura por subpíxeles / animación de paso
        expect(scrollHeight).toBeLessThanOrEqual(901);
        const main = page.locator('#main-content');
        const mainScroll = await main.evaluate((el) => ({
          scrollHeight: el.scrollHeight,
          clientHeight: el.clientHeight,
        }));
        expect(mainScroll.scrollHeight).toBeLessThanOrEqual(mainScroll.clientHeight);
      });

      test(`paso ${step} tiene un h1 y como máximo 3 grupos`, async ({ page }) => {
        await openWizardStep(page, step);
        await expect(page.locator('#main-content h1')).toHaveCount(1);
        const groups = await page.getByTestId('wizard-step-group').count();
        expect(groups).toBeGreaterThan(0);
        expect(groups).toBeLessThanOrEqual(3);
      });
    }

    test('preview vacío muestra retratos atenuados y texto', async ({ page }) => {
      await openWizardStep(page, 1);
      await expect(page.getByTestId('creation-preview-empty')).toBeVisible();
      await expect(page.getByText(/Aquí verás a tu eJoi/i)).toBeVisible();
    });

    test('reducedMotion usa fundido sin desplazamiento', async ({ page }) => {
      await openWizardStep(page, 1);
      await page.emulateMedia({ reducedMotion: 'reduce' });
      await fillWizardStep1(page);
      await page.getByRole('button', { name: 'Continuar' }).click();
      await page.waitForURL('**/crear/paso-2');
      const panel = page.getByTestId('wizard-step-panel');
      await expect(panel).toHaveCSS('animation-name', 'create-wizard-step-fade');
    });
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
