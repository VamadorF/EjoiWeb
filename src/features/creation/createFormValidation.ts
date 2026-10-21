import { validators } from '@/shared/utils/validators';

export type CreateConsentState = {
  adult: boolean;
  termsAndPrivacy: boolean;
};

export function isValidWizardCompanionName(name: string): boolean {
  const trimmed = name.trim();
  return trimmed.length >= 2 && trimmed.length <= 20 && validators.name(trimmed);
}

export function canSubmitCreateForm(
  companionName: string | undefined,
  consent: CreateConsentState,
): boolean {
  return isValidWizardCompanionName(companionName?.trim() ?? '') && consent.adult && consent.termsAndPrivacy;
}
