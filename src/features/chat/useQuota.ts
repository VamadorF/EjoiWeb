import { useQuery } from '@tanstack/react-query';

import { queryKeys } from '@/shared/lib/queryKeys';

import { httpClient } from '~/platform/http';

/**
 * GET /subscription/me. `messages*` es el cupo del plan pago; `freeMessages*` el cupo gratuito.
 * Sin suscripción activa el BE manda `messagesRemaining: 0` y el cupo real va en `freeMessages*`.
 */
export type SubscriptionMe = {
  hasActiveSubscription?: boolean;
  messageLimit?: number;
  messagesUsed?: number;
  messagesRemaining: number;
  freeMessagesUsed?: number;
  freeMessagesLimit?: number;
  freeMessagesRemaining?: number;
  isFreeTierExhausted?: boolean;
  planLabel?: string;
};

export async function fetchSubscriptionMe(): Promise<SubscriptionMe> {
  const response = await httpClient.get<SubscriptionMe>('/subscription/me', undefined, {
    suppressFatalBoundary: true,
  });
  return response.data;
}

export function useQuota(enabled = true) {
  return useQuery({
    queryKey: queryKeys.subscription.me,
    queryFn: fetchSubscriptionMe,
    enabled,
    staleTime: 60_000,
  });
}

/** Misma regla que la app móvil (useMessageQuota): free mientras no haya suscripción activa. */
export function resolveMessagesRemaining(subscription: SubscriptionMe | undefined): number | undefined {
  if (!subscription) return undefined;
  if (subscription.hasActiveSubscription) return Math.max(0, subscription.messagesRemaining);

  const { freeMessagesRemaining, freeMessagesLimit, freeMessagesUsed } = subscription;
  if (freeMessagesRemaining != null) return Math.max(0, freeMessagesRemaining);
  if (freeMessagesLimit != null && freeMessagesUsed != null) {
    return Math.max(0, freeMessagesLimit - freeMessagesUsed);
  }
  return Math.max(0, subscription.messagesRemaining);
}

export function isQuotaExhausted(subscription: SubscriptionMe | undefined): boolean {
  if (!subscription) return false;
  const remaining = resolveMessagesRemaining(subscription) ?? 0;
  if (subscription.hasActiveSubscription) {
    return subscription.messageLimit !== 0 && remaining <= 0;
  }
  return Boolean(subscription.isFreeTierExhausted) || remaining <= 0;
}
