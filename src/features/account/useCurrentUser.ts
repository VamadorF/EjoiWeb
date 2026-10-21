import { useQuery } from '@tanstack/react-query';

import type { User } from '@/features/auth/types';
import { queryKeys } from '@/shared/lib/queryKeys';

import { normalizeAuthUser } from '~/features/auth/authWeb.adapter';
import { MOCK_USER_ID, isMockDemoLoggedIn } from '~/platform/mockApi';
import * as session from '~/platform/session';

function readUserFromSession(): User | null {
  const raw = session.getUserDataJson();
  if (raw) {
    try {
      return normalizeAuthUser(JSON.parse(raw) as Partial<User>);
    } catch {
      /* invalid cache */
    }
  }
  if (isMockDemoLoggedIn()) {
    return {
      id: MOCK_USER_ID,
      email: 'demo@ejoi.test',
      name: 'Vicente demo',
    };
  }
  return null;
}

export function useCurrentUser() {
  const query = useQuery({
    queryKey: queryKeys.auth.currentUser,
    queryFn: async () => readUserFromSession(),
    retry: false,
    staleTime: 60_000,
  });

  return {
    data: query.data ?? null,
    isLoading: query.isLoading,
    error: query.error,
  };
}

export function resolveUserInitials(name?: string | null, email?: string | null): string {
  const trimmed = name?.trim();
  if (trimmed) {
    const parts = trimmed.split(/\s+/).filter(Boolean);
    if (parts.length >= 2) {
      return `${parts[0]![0] ?? ''}${parts[1]![0] ?? ''}`.toUpperCase();
    }
    return trimmed.slice(0, 2).toUpperCase();
  }
  const mail = email?.trim();
  return mail ? mail.slice(0, 2).toUpperCase() : '?';
}
