import { useQuery, type QueryClient } from '@tanstack/react-query';

import type { SharedMomentResponse } from '@/features/memories/types';

import { httpClient } from '~/platform/http';

export type CompanionProfile = {
  id: string;
  name: string;
  avatarUrl?: string | null;
  avatarStoragePath?: string | null;
  visualStyle?: string;
  gender?: string;
  ethnicity?: string | null;
  hairColor?: string | null;
  age?: number | null;
  persona?: string;
  intensity?: string;
  interests?: string[];
  boundaries?: string[];
  voiceKey?: string;
  updatedAt?: string;
  sharedMoments?: SharedMomentResponse[];
};

export const companionProfileQueryKey = ['companion', 'me', 'profile'] as const;

export async function fetchCompanionProfile(): Promise<CompanionProfile> {
  const response = await httpClient.get<CompanionProfile>('/companion/me/profile', undefined, {
    suppressFatalBoundary: true,
  });
  return response.data;
}

export function useProfile(enabled = true) {
  return useQuery({
    queryKey: companionProfileQueryKey,
    queryFn: fetchCompanionProfile,
    enabled,
    staleTime: 30_000,
  });
}

export function invalidateCompanionProfile(client: QueryClient) {
  return client.invalidateQueries({ queryKey: companionProfileQueryKey });
}
