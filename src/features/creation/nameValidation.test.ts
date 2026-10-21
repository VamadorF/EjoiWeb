import { describe, expect, it } from 'vitest';

import { validators } from '@/shared/utils/validators';

import { canSubmitCreateForm, isValidWizardCompanionName } from './createFormValidation';

describe('isValidWizardCompanionName', () => {
  it('acepta nombres con apóstrofe y guion', () => {
    expect(isValidWizardCompanionName("Ma'ría")).toBe(true);
    expect(isValidWizardCompanionName('Ana-Luis')).toBe(true);
    expect(isValidWizardCompanionName('María José')).toBe(true);
  });

  it('rechaza números, longitud inválida y todo mayúsculas', () => {
    expect(isValidWizardCompanionName('Ana2')).toBe(false);
    expect(isValidWizardCompanionName('A')).toBe(false);
    expect(isValidWizardCompanionName('ANA')).toBe(false);
    expect(isValidWizardCompanionName('Ana.')).toBe(false);
  });

  it('getNameError coincide con reglas de la app', () => {
    expect(validators.getNameError('ANA')).toMatch(/mayúsculas/i);
    expect(validators.getNameError('Ana2')).toMatch(/números/i);
  });
});

describe('canSubmitCreateForm', () => {
  const consentOk = { adult: true, termsAndPrivacy: true };
  const consentNo = { adult: false, termsAndPrivacy: false };

  it('exige nombre y consentimiento (4 combinaciones)', () => {
    expect(canSubmitCreateForm('Luna', consentOk)).toBe(true);
    expect(canSubmitCreateForm('Luna', consentNo)).toBe(false);
    expect(canSubmitCreateForm('', consentOk)).toBe(false);
    expect(canSubmitCreateForm('', consentNo)).toBe(false);
  });
});
