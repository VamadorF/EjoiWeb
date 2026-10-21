import { expect, test, type Page } from '@playwright/test';

import {
  installIntegrationMock,
  loginWithTestSession,
  resetIntegrationMockState,
} from './fixtures/integrationMock';
import {
  pickWizardStep4WithKeyboard,
  pickWizardThroughStep3WithKeyboard,
  sendChatWithKeyboard,
} from './fixtures/keyboardFlow';
import { advanceToWizardStep, fillWizardStep1 } from './fixtures/wizardFlow';

async function bootAuthed(page: Page, mockOpts?: Parameters<typeof installIntegrationMock>[1]) {
  const handle = await installIntegrationMock(page, mockOpts);
  await page.goto('/acceso');
  await loginWithTestSession(page);
  await page.reload();
  await page.waitForLoadState('networkidle');
  return handle;
}

test.describe('QA cross-browser SCRUM-116', () => {
  test.setTimeout(60_000);

  test.beforeEach(() => {
    resetIntegrationMockState();
  });

  test('recarga en paso 1 y paso 4 conserva el draft', async ({ page }) => {
    await bootAuthed(page);
    await page.goto('/crear/paso-1');
    await fillWizardStep1(page);
    await page.waitForTimeout(400);
    await page.reload();
    await expect(page.getByRole('radio', { name: 'Femenino' })).toHaveAttribute('aria-checked', 'true');
    await advanceToWizardStep(page, 4);
    await page.locator('#create-wizard-form .field__control').first().fill('Luna');
    await page.locator('.check__input').nth(0).check();
    await page.locator('.check__input').nth(1).check();
    await page.waitForTimeout(400);
    await page.reload();
    await expect(page.locator('#create-wizard-form .field__control').first()).toHaveValue('Luna');
  });

  test('nuevo contexto con storageState retoma vista y elecciones', async ({ browser }) => {
    const context = await browser.newContext();
    const page = await context.newPage();
    await bootAuthed(page);
    await page.goto('/crear/paso-1');
    await page.getByRole('radio', { name: 'Masculino' }).click();
    await page.getByRole('radio', { name: 'Amigable y empática' }).click();
    await page.getByRole('radio', { name: 'Realista' }).click();
    await page.getByRole('button', { name: 'Continuar' }).click();
    await page.waitForURL('**/crear/paso-2');
    await page.getByRole('button', { name: 'Continuar' }).click();
    await page.waitForURL('**/crear/paso-3');
    for (const label of ['Deportes', 'Cine y series', 'Música']) {
      await page.getByRole('button', { name: label }).click();
    }
    await page.waitForTimeout(400);
    const storageState = await context.storageState();

    await context.close();
    const context2 = await browser.newContext({ storageState });
    const page2 = await context2.newPage();
    await installIntegrationMock(page2);
    await page2.goto('/acceso');
    await loginWithTestSession(page2);
    await page2.reload();
    await page2.goto('/crear/paso-1');
    await page2.waitForLoadState('networkidle');
    await expect(page2.getByRole('radio', { name: 'Masculino' })).toHaveAttribute('aria-checked', 'true');
    await page2.goto('/crear/paso-3');
    await expect(page2.getByRole('button', { name: 'Música' })).toHaveAttribute('aria-pressed', 'true');
    await context2.close();
  });

  test('creación con fallo, reintento y pendiente enviado una sola vez', async ({ page }) => {
    const handle = await bootAuthed(page, { companionCreateFailures: 1, readyAfterMs: 500 });
    await advanceToWizardStep(page, 4);
    await page.locator('#create-wizard-form .field__control').first().fill('Luna');
    await page.locator('.check__input').nth(0).check();
    await page.locator('.check__input').nth(1).check();
    await page.getByRole('button', { name: /Crear a Luna/ }).click();
    await page.waitForURL('**/chat');

    await page.waitForSelector('[data-testid="chat-composer"]');
    await page.locator('.chat-composer__input').fill('Mensaje pendiente e2e');
    await page.getByRole('button', { name: 'Enviar mensaje' }).click();
    await expect(page.getByText('Mensaje pendiente e2e')).toBeVisible();

    await expect(page.getByTestId('chat-error-banner')).toBeVisible({ timeout: 15_000 });
    await page.getByRole('button', { name: 'Intentar de nuevo' }).click();

    await expect(page.getByText('Hola, soy Luna')).toBeVisible({ timeout: 15_000 });
    await page.waitForTimeout(800);
    const posts = handle.getMessagePosts().filter((p) => p.message === 'Mensaje pendiente e2e');
    expect(posts).toHaveLength(1);
    expect(posts[0]?.clientMessageId).toBeTruthy();
  });

  test('flujo guiado solo teclado desde acceso hasta editar', async ({ page }) => {
    await bootAuthed(page, { readyAfterMs: 300 });
    await page.goto('/crear/paso-1');
    await pickWizardThroughStep3WithKeyboard(page);
    await pickWizardStep4WithKeyboard(page);
    await page.waitForURL('**/chat');
    await sendChatWithKeyboard(page, 'Hola teclado QA');
    await page.goto('/chat/editar');
    await page.waitForSelector('[data-testid="edit-companion-page"]');
    await page.getByTestId('edit-row-personality').click();
    await page.getByTestId('edit-section-dialog').waitFor();
    const nameInput = page.locator('[aria-labelledby="edit-name"]').last();
    await nameInput.focus();
    await page.keyboard.press('End');
    await page.keyboard.type('a');
    await expect(nameInput).toHaveValue(/a$/);
  });

  test('cronómetro técnico acceso → primer mensaje visible', async ({ page }, testInfo) => {
    await installIntegrationMock(page, { readyAfterMs: 200 });
    const started = Date.now();
    await page.goto('/acceso');
    await expect(page.getByRole('heading', { name: 'Entra para crear tu eJoi' })).toBeVisible();
    await loginWithTestSession(page);
    await page.reload();
    await page.waitForURL('**/crear/paso-1', { timeout: 15_000 });
    await pickWizardThroughStep3WithKeyboard(page);
    await pickWizardStep4WithKeyboard(page);
    await page.waitForURL('**/chat');
    await expect(page.getByText('Hola, soy Luna')).toBeVisible({ timeout: 20_000 });
    const elapsedMs = Date.now() - started;
    await testInfo.attach('cronometro-tecnico-ms', {
      body: String(elapsedMs),
      contentType: 'text/plain',
    });
  });
});
