import { expect, test } from '@playwright/test';

import {
  installIntegrationMock,
  loginWithTestSession,
  resetIntegrationMockState,
  type IntegrationMockHandle,
} from './fixtures/integrationMock';

async function loginAndKickCreation(
  page: import('@playwright/test').Page,
): Promise<IntegrationMockHandle> {
  const handle = await installIntegrationMock(page, { readyAfterMs: 0 });
  await page.goto('/acceso');
  await loginWithTestSession(page);
  await page.evaluate(async () => {
    const res = await fetch('/api/companion/me', {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Luna',
        gender: 'femenino',
        visualStyle: 'realista',
        persona: 'Amigable y empática',
        intensity: 'balanced',
        interests: ['Música', 'Cine y series', 'Viajes'],
        boundaries: [],
      }),
    });
    if (!res.ok) throw new Error(`companion create ${res.status}`);
  });
  return handle;
}

test.describe('Creando y Lista', () => {
  test.beforeEach(() => {
    resetIntegrationMockState();
  });

  test('permanece en creando al menos 4 s antes de lista', async ({ page }) => {
    await loginAndKickCreation(page);
    const started = Date.now();
    await page.goto('/crear/creando');
    await expect(page.getByTestId('create-creating-page')).toBeVisible();
    await page.waitForURL('**/crear/lista', { timeout: 20_000 });
    expect(Date.now() - started).toBeGreaterThanOrEqual(4000);
    await expect(page.getByTestId('create-ready-title')).toContainText('Luna');
  });

  test('error permite reintentar o volver a revisión', async ({ page }) => {
    const handle = await loginAndKickCreation(page);
    await page.goto('/crear/creando');
    await expect(page.getByTestId('create-creating-page')).toBeVisible();
    handle.forceCreationError();
    await expect(page.getByTestId('create-creating-error')).toBeVisible({ timeout: 10_000 });
    await page.getByRole('button', { name: 'Revisar mis elecciones' }).click();
    await page.waitForURL('**/crear/revision');
  });

  test('lista abre chat sin volver a creando', async ({ page }) => {
    await loginAndKickCreation(page);
    await page.goto('/crear/creando');
    await page.waitForURL('**/crear/lista', { timeout: 20_000 });
    await page.getByTestId('create-ready-cta').click();
    await page.waitForURL('**/chat');
    await page.goBack();
    expect(page.url()).not.toMatch(/\/crear\/creando/);
  });
});
