import { expect, type Page } from '@playwright/test';

export async function pickWhoWithKeyboard(page: Page) {
  await page.waitForSelector('.opt');
  await page.locator('[role="radio"]').first().focus();
  await page.keyboard.press(' ');
  await page.locator('[aria-labelledby="create-who-style"] [role="radio"]').first().focus();
  await page.keyboard.press(' ');
  const interests = page.locator('[aria-labelledby="create-who-interests"] button');
  for (let i = 0; i < 3; i += 1) {
    await interests.nth(i).focus();
    await page.keyboard.press(' ');
  }
  await page.getByRole('button', { name: 'Continuar' }).focus();
  await page.keyboard.press('Enter');
  await page.waitForURL('**/crear/como');
}

export async function pickHowWithKeyboard(page: Page) {
  await page.waitForSelector('.create-how');
  const persona = page.getByRole('radio', { name: 'Amigable y empática' });
  await persona.focus();
  await page.keyboard.press(' ');
  const intensity = page.getByRole('radio', { name: 'Equilibrada' });
  await intensity.focus();
  await page.keyboard.press(' ');
  const nameInput = page.locator('#create-how-form .field__control').first();
  await nameInput.focus();
  await page.keyboard.type('Luna');
  const consents = page.locator('.check__input');
  await consents.nth(0).focus();
  await page.keyboard.press(' ');
  await consents.nth(1).focus();
  await page.keyboard.press(' ');
  await page.getByRole('button', { name: /Crear a .+ y conversar/ }).focus();
  await page.keyboard.press('Enter');
}

export async function sendChatWithKeyboard(page: Page, text: string) {
  await page.waitForSelector('[data-testid="chat-composer"]');
  const textarea = page.locator('.chat-composer__input');
  await textarea.focus();
  await page.keyboard.type(text);
  await page.keyboard.press('Enter');
  await expect(textarea).toHaveValue('');
}
