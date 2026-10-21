import { expect, test } from '@playwright/test';

import {
  installIntegrationMock,
  loginWithTestSession,
  resetIntegrationMockState,
} from './fixtures/integrationMock';
import { advanceToWizardStep, fillWizardStep1, fillWizardStep3Interests } from './fixtures/wizardFlow';
import { WIZARD_V2_SCREENS } from '../src/platform/mocks/wizard';

test.describe('Asistente v2 — 7 pantallas en 4 pasos', () => {
  test.beforeEach(() => {
    resetIntegrationMockState();
  });

  test.describe('escritorio 1440', () => {
    test.use({ viewport: { width: 1440, height: 900 } });

    test('recorre pantallas y redirects quien/como', async ({ page }) => {
      await installIntegrationMock(page);
      await page.goto('/acceso');
      await loginWithTestSession(page);
      await page.reload();
      await page.waitForURL(`**${WIZARD_V2_SCREENS.genero}`, { timeout: 15_000 });

      await page.goto('/crear/quien');
      await page.waitForURL(`**${WIZARD_V2_SCREENS.genero}`);
      await page.goto('/crear/como');
      await page.waitForURL(`**${WIZARD_V2_SCREENS.nombre}`);

      await page.goto(WIZARD_V2_SCREENS.genero);
      await fillWizardStep1(page);
      await page.getByRole('button', { name: 'Siguiente' }).click();
      await page.waitForURL(`**${WIZARD_V2_SCREENS.presencia}`);
      await page.getByRole('button', { name: 'Siguiente' }).click();
      await page.waitForURL(`**${WIZARD_V2_SCREENS.limites}`);
      await page.getByRole('button', { name: 'Siguiente' }).click();
      await page.waitForURL(`**${WIZARD_V2_SCREENS.intereses}`);
      await fillWizardStep3Interests(page);
      await page.getByRole('button', { name: 'Siguiente' }).click();
      await page.waitForURL(`**${WIZARD_V2_SCREENS.nombre}`);
      await expect(page.getByTestId('create-wizard')).toBeVisible();
    });

    test('presencia con descripción en Balanceada', async ({ page }) => {
      await installIntegrationMock(page);
      await page.goto('/acceso');
      await loginWithTestSession(page);
      await advanceToWizardStep(page, 2);
      await expect(page.getByTestId('presence-balanced')).toBeVisible();
      await expect(page.locator('#main-content')).toContainText(/equilibrio entre cercan/i);
    });
  });

  test('recarga en pantallas clave conserva elecciones', async ({ page }) => {
    await installIntegrationMock(page);
    await page.goto('/acceso');
    await loginWithTestSession(page);
    await page.goto(WIZARD_V2_SCREENS.genero);
    await page.getByRole('radio', { name: 'Femenino' }).click();
    await page.waitForTimeout(400);
    await page.reload();
    await expect(page.getByRole('radio', { name: 'Femenino' })).toHaveAttribute('aria-checked', 'true');

    await fillWizardStep1(page);
    await page.getByRole('button', { name: 'Siguiente' }).click();
    await page.waitForURL(`**${WIZARD_V2_SCREENS.presencia}`);
    await page.waitForTimeout(400);
    await page.reload();
    await expect(page.getByTestId('presence-balanced')).toHaveAttribute('aria-checked', 'true');

    await page.getByRole('button', { name: 'Siguiente' }).click();
    await page.waitForURL(`**${WIZARD_V2_SCREENS.limites}`);
    await page.getByRole('button', { name: 'Siguiente' }).click();
    await page.waitForURL(`**${WIZARD_V2_SCREENS.intereses}`);
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

    async function openWizardGroup(page: import('@playwright/test').Page, group: 1 | 2 | 3 | 4) {
      await page.goto(WIZARD_V2_SCREENS.genero);
      await page.getByTestId('create-wizard').waitFor({ state: 'visible', timeout: 15_000 });
      if (group === 1) return;
      await advanceToWizardStep(page, group);
    }

    for (const group of [1, 2, 3, 4] as const) {
      test(`grupo ${group} cabe sin scroll a 1440×900`, async ({ page }) => {
        await openWizardGroup(page, group);
        await page.getByTestId('wizard-step-panel').waitFor({ state: 'visible' });
        await page.waitForTimeout(280);
        const scrollHeight = await page.evaluate(() => document.documentElement.scrollHeight);
        expect(scrollHeight).toBeLessThanOrEqual(901);
        const main = page.locator('#main-content');
        const mainScroll = await main.evaluate((el) => ({
          scrollHeight: el.scrollHeight,
          clientHeight: el.clientHeight,
        }));
        expect(mainScroll.scrollHeight).toBeLessThanOrEqual(mainScroll.clientHeight);
      });

      test(`grupo ${group} tiene un h1 y un solo grupo de opciones`, async ({ page }) => {
        await openWizardGroup(page, group);
        await expect(page.locator('#main-content h1')).toHaveCount(1);
        expect(await page.getByTestId('wizard-step-group').count()).toBe(1);
      });
    }

    test('sin género no muestra preview en escritorio', async ({ page }) => {
      await page.goto(WIZARD_V2_SCREENS.genero);
      await expect(page.getByTestId('shell-preview')).toHaveCount(0);
    });

    test('con género las migas van bajo el progreso, sin panel lateral', async ({ page }) => {
      await page.goto(WIZARD_V2_SCREENS.genero);
      await page.getByRole('radio', { name: 'Femenino' }).click();
      await expect(page.getByTestId('shell-preview')).toHaveCount(0);
      await expect(page.getByTestId('wizard-choice-pills')).toBeVisible();
    });

    test('reducedMotion usa fundido sin desplazamiento', async ({ page }) => {
      await page.goto(WIZARD_V2_SCREENS.genero);
      await page.emulateMedia({ reducedMotion: 'reduce' });
      await page.getByRole('radio', { name: 'Femenino' }).click();
      await page.getByRole('button', { name: 'Siguiente' }).click();
      await page.waitForURL(`**${WIZARD_V2_SCREENS.personalidad}`);
      const panel = page.getByTestId('wizard-step-panel');
      await expect(panel).toHaveCSS('animation-name', 'create-wizard-step-fade');
    });
  });

  test('800 px recorre los 4 pasos de grupo', async ({ page }) => {
    await page.setViewportSize({ width: 800, height: 900 });
    await installIntegrationMock(page);
    await page.goto('/acceso');
    await loginWithTestSession(page);
    await page.goto(WIZARD_V2_SCREENS.genero);
    await expect(page.getByTestId('create-wizard-step')).toContainText('Paso 1 de 4');
    await fillWizardStep1(page);
    await page.getByRole('button', { name: 'Siguiente' }).click();
    await expect(page.getByTestId('create-wizard-step')).toContainText('Paso 2 de 4');
    await page.getByRole('button', { name: 'Siguiente' }).click();
    await page.waitForURL(`**${WIZARD_V2_SCREENS.limites}`);
    await page.getByRole('button', { name: 'Siguiente' }).click();
    await expect(page.getByTestId('create-wizard-step')).toContainText('Paso 3 de 4');
    await fillWizardStep3Interests(page);
    await page.getByRole('button', { name: 'Siguiente' }).click();
    await expect(page.getByTestId('create-wizard-step')).toContainText('Paso 4 de 4');
  });
});
