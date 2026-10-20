import { describe, expect, it } from 'vitest';

import { canSubmitCreateForm, isValidCompanionName } from './nameValidation';

describe('isValidCompanionName', () => {
  it('acepta nombres con apóstrofe, guion y punto', () => {
    expect(isValidCompanionName("Ma'ría")).toBe(true);
    expect(isValidCompanionName('Ana-Luis')).toBe(true);
    expect(isValidCompanionName('Dr. Eva')).toBe(true);
  });

  it('rechaza números, longitud inválida y todo mayúsculas', () => {
    expect(isValidCompanionName('Ana2')).toBe(false);
    expect(isValidCompanionName('A')).toBe(false);
    expect(isValidCompanionName('ANA')).toBe(false);
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
