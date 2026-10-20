import { afterEach, describe, expect, it } from 'vitest';

import {
  clearPendingReferralCode,
  getPendingReferralCode,
  setPendingReferralCode,
} from './referralCode';

describe('referralCode', () => {
  afterEach(() => {
    clearPendingReferralCode();
  });

  it('guarda solo el código de invitación, no tokens', () => {
    setPendingReferralCode('ABC123');
    expect(getPendingReferralCode()).toBe('ABC123');
    expect(getPendingReferralCode()).not.toMatch(/Bearer|refresh/i);
  });
});
