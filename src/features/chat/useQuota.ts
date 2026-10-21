import { useQuery } from '@tanstack/react-query';

import { queryKeys } from '@/shared/lib/queryKeys';

import { httpClient } from '~/platform/http';

export type SubscriptionMe = {
  messagesRemaining: number;
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

export function isQuotaExhausted(subscription: SubscriptionMe | undefined): boolean {
  if (!subscription) return false;
  if (subscription.isFreeTierExhausted) return true;
  return subscription.messagesRemaining <= 0;
}
