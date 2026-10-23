import { describe, expect, it } from 'vitest';

import { isQuotaExhausted, resolveMessagesRemaining, type SubscriptionMe } from './useQuota';

/** Forma real de GET /subscription/me para un usuario sin suscripción (eJoi-BE emptyStatusResponse). */
const FREE_NEW_USER: SubscriptionMe = {
  hasActiveSubscription: false,
  messageLimit: 0,
  messagesUsed: 0,
  messagesRemaining: 0,
  freeMessagesUsed: 0,
  freeMessagesLimit: 60,
  freeMessagesRemaining: 60,
  isFreeTierExhausted: false,
};

function expectQuota(sub: SubscriptionMe | undefined, remaining: number | undefined, exhausted: boolean) {
  expect(resolveMessagesRemaining(sub)).toBe(remaining);
  expect(isQuotaExhausted(sub)).toBe(exhausted);
}

describe('useQuota', () => {
  it('usuario free nuevo usa el cupo gratuito, no messagesRemaining del plan pago', () => {
    expectQuota(FREE_NEW_USER, 60, false);
  });

  it('usuario free sin cupo gratuito está agotado', () => {
    expectQuota(
      { ...FREE_NEW_USER, freeMessagesUsed: 60, freeMessagesRemaining: 0, isFreeTierExhausted: true },
      0,
      true,
    );
  });

  it('suscripción expirada se rige por el cupo free aunque quede cupo pago', () => {
    expectQuota(
      { hasActiveSubscription: false, messagesRemaining: 50, freeMessagesLimit: 60, freeMessagesUsed: 60 },
      0,
      true,
    );
  });

  it('usuario pago con cupo ignora isFreeTierExhausted', () => {
    expectQuota(
      { hasActiveSubscription: true, messageLimit: 300, messagesRemaining: 120, isFreeTierExhausted: true },
      120,
      false,
    );
  });

  it('usuario pago sin cupo está agotado', () => {
    expectQuota({ hasActiveSubscription: true, messageLimit: 300, messagesRemaining: 0 }, 0, true);
  });

  it('payload mínimo (solo messagesRemaining) sigue funcionando', () => {
    expectQuota({ messagesRemaining: 12 }, 12, false);
    expectQuota({ messagesRemaining: 0 }, 0, true);
  });

  it('sin datos no bloquea', () => {
    expectQuota(undefined, undefined, false);
  });
});
