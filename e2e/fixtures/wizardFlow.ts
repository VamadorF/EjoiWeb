import type { Page } from '@playwright/test';

export async function fillWizardStep1(page: Page) {
  await page.getByRole('radio', { name: 'Femenino' }).click();
  await page.getByRole('radio', { name: 'Amigable y empática' }).click();
  await page.getByRole('radio', { name: 'Realista' }).click();
}

export async function fillWizardStep3Interests(page: Page) {
  for (const label of ['Música', 'Cine y series', 'Viajes']) {
    await page.getByRole('button', { name: label }).click();
  }
}

/** Deja la UI en paso 2, 3 o 4 (índice de ruta). */
export async function advanceToWizardStep(page: Page, target: 2 | 3 | 4) {
  await fillWizardStep1(page);
  await page.getByRole('button', { name: 'Continuar' }).click();
  await page.waitForURL('**/crear/paso-2');
  if (target === 2) return;

  await page.getByRole('button', { name: 'Continuar' }).click();
  await page.waitForURL('**/crear/paso-3');
  if (target === 3) return;

  await fillWizardStep3Interests(page);
  await page.getByRole('button', { name: 'Continuar' }).click();
  await page.waitForURL('**/crear/paso-4');
}
