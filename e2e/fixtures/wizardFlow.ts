import type { Page } from '@playwright/test';

import { WIZARD_V2_SCREENS } from '../../src/platform/mocks/wizard';

export async function fillWizardGender(page: Page) {
  await page.getByRole('radio', { name: 'Femenino' }).click();
}

export async function fillWizardPersonality(page: Page) {
  await page.getByRole('radio', { name: /Amigable y empática/i }).click();
}

export async function fillWizardStyle(page: Page) {
  await page.getByRole('radio', { name: 'Realista' }).click();
}

/** Paso 1 completo (género → personalidad → estilo). */
export async function fillWizardStep1(page: Page) {
  await fillWizardGender(page);
  await page.getByRole('button', { name: 'Siguiente' }).click();
  await page.waitForURL(`**${WIZARD_V2_SCREENS.personalidad}`);
  await fillWizardPersonality(page);
  await page.getByRole('button', { name: 'Siguiente' }).click();
  await page.waitForURL(`**${WIZARD_V2_SCREENS.estilo}`);
  await fillWizardStyle(page);
}

export async function fillWizardStep3Interests(page: Page) {
  for (const label of ['Música', 'Cine y series', 'Viajes']) {
    await page.getByRole('button', { name: label }).click();
  }
}

/** Deja la UI en el primer pantalla del paso de grupo 2, 3 o 4. */
export async function advanceToWizardStep(page: Page, target: 2 | 3 | 4) {
  await page.goto(WIZARD_V2_SCREENS.genero);
  await fillWizardStep1(page);
  await page.getByRole('button', { name: 'Siguiente' }).click();
  await page.waitForURL(`**${WIZARD_V2_SCREENS.presencia}`);
  if (target === 2) return;

  await page.getByRole('button', { name: 'Siguiente' }).click();
  await page.waitForURL(`**${WIZARD_V2_SCREENS.limites}`);
  await page.getByRole('button', { name: 'Siguiente' }).click();
  await page.waitForURL(`**${WIZARD_V2_SCREENS.intereses}`);
  if (target === 3) return;

  await fillWizardStep3Interests(page);
  await page.getByRole('button', { name: 'Siguiente' }).click();
  await page.waitForURL(`**${WIZARD_V2_SCREENS.nombre}`);
}
