const COMPANION_NAME_MIN = 2;
const COMPANION_NAME_MAX = 20;

const NAME_FORMAT = /^[\p{L}\s'.-]+$/u;

export function isValidCompanionName(name: string): boolean {
  const trimmed = name.trim();
  if (trimmed.length < COMPANION_NAME_MIN || trimmed.length > COMPANION_NAME_MAX) return false;
  if (name !== trimmed) return false;
  if (/\s{2,}/.test(trimmed)) return false;
  if (!NAME_FORMAT.test(trimmed)) return false;
  const lettersOnly = trimmed.replace(/[^\p{L}]/gu, '');
  if (lettersOnly.length === 0) return false;
  if (lettersOnly === lettersOnly.toUpperCase()) return false;
  return true;
}

export type CreateConsentState = {
  adult: boolean;
  termsAndPrivacy: boolean;
};

export function canSubmitCreateForm(
  companionName: string | undefined,
  consent: CreateConsentState,
): boolean {
  return isValidCompanionName(companionName?.trim() ?? '') && consent.adult && consent.termsAndPrivacy;
}
