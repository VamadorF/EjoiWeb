const STORAGE_KEY = 'ejoi:pending-referral-code';

export function getPendingReferralCode(): string | null {
  try {
    return sessionStorage.getItem(STORAGE_KEY);
  } catch {
    return null;
  }
}

export function setPendingReferralCode(code: string): void {
  try {
    sessionStorage.setItem(STORAGE_KEY, code.trim());
  } catch {
    /* private mode */
  }
}

export function clearPendingReferralCode(): void {
  try {
    sessionStorage.removeItem(STORAGE_KEY);
  } catch {
    /* noop */
  }
}
