import type { User } from '@/features/auth/types';

import { normalizeAuthUser } from '~/features/auth/authWeb.adapter';
import { httpClient } from '~/platform/http';
import * as session from '~/platform/session';

export async function patchUserName(name: string): Promise<User> {
  const response = await httpClient.patch<{ name: string }>('/users/me/name', { name });
  const raw = session.getUserDataJson();
  if (raw) {
    try {
      const user = normalizeAuthUser({
        ...(JSON.parse(raw) as Partial<User>),
        name: response.data.name,
      });
      session.setUserDataJson(JSON.stringify(user));
      return user;
    } catch {
      /* stale cache */
    }
  }
  return normalizeAuthUser({ name: response.data.name });
}

export async function deleteUserAccount(): Promise<void> {
  await httpClient.delete('/auth/account');
}
