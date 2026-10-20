import { describe, expect, it } from 'vitest';

import { isQuotaExhausted } from './useQuota';

describe('useQuota', () => {
  it('detecta cupo agotado por messagesRemaining', () => {
    expect(isQuotaExhausted({ messagesRemaining: 0 })).toBe(true);
    expect(isQuotaExhausted({ messagesRemaining: 3 })).toBe(false);
  });

  it('detecta cupo agotado por isFreeTierExhausted', () => {
    expect(isQuotaExhausted({ messagesRemaining: 5, isFreeTierExhausted: true })).toBe(true);
  });
});
