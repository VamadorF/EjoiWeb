import { expect, type Page } from '@playwright/test';

import { fillWizardStep1, fillWizardStep3Interests } from './wizardFlow';

export async function pickWizardThroughStep3WithKeyboard(page: Page) {
  await page.waitForSelector('.opt');
  await page.locator('[aria-labelledby="wizard-gender"] [role="radio"]').first().focus();
  await page.keyboard.press(' ');
  await page.locator('[aria-labelledby="wizard-persona"] [role="radio"]').first().focus();
  await page.keyboard.press(' ');
  await page.locator('[aria-labelledby="wizard-style"] [role="radio"]').first().focus();
  await page.keyboard.press(' ');
  await page.getByRole('button', { name: 'Continuar' }).click();
  await page.waitForURL('**/crear/paso-2');
  await page.getByRole('button', { name: 'Continuar' }).click();
  await page.waitForURL('**/crear/paso-3');
  const interests = page.locator('[aria-labelledby="wizard-interests"] button');
  for (let i = 0; i < 3; i += 1) {
    await interests.nth(i).focus();
    await page.keyboard.press(' ');
  }
  await page.getByRole('button', { name: 'Continuar' }).click();
  await page.waitForURL('**/crear/paso-4');
}

export async function pickWizardStep4WithKeyboard(page: Page) {
  await page.waitForSelector('#create-wizard-form');
  const nameInput = page.locator('#create-wizard-form .field__control').first();
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

/** @deprecated use pickWizardThroughStep3WithKeyboard */
export async function pickWhoWithKeyboard(page: Page) {
  await fillWizardStep1(page);
  await page.getByRole('button', { name: 'Continuar' }).click();
  await page.waitForURL('**/crear/paso-2');
  await page.getByRole('button', { name: 'Continuar' }).click();
  await page.waitForURL('**/crear/paso-3');
  await fillWizardStep3Interests(page);
  await page.getByRole('button', { name: 'Continuar' }).click();
  await page.waitForURL('**/crear/paso-4');
}

/** @deprecated use pickWizardStep4WithKeyboard */
export async function pickHowWithKeyboard(page: Page) {
  await pickWizardStep4WithKeyboard(page);
}

export async function sendChatWithKeyboard(page: Page, text: string) {
  await page.waitForSelector('[data-testid="chat-composer"]');
  const textarea = page.locator('.chat-composer__input');
  await textarea.focus();
  await page.keyboard.type(text);
  await page.keyboard.press('Enter');
  await expect(textarea).toHaveValue('');
}
