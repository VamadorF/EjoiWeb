import { QueryClient } from '@tanstack/react-query';
import { describe, expect, it, vi } from 'vitest';

import { httpClient } from '~/platform/http';

import {
  companionProfileQueryKey,
  fetchCompanionProfile,
  invalidateCompanionProfile,
} from './useProfile';

vi.mock('~/platform/http', () => ({
  httpClient: {
    get: vi.fn(),
  },
}));

describe('useProfile', () => {
  it('fetchCompanionProfile llama GET /companion/me/profile', async () => {
    vi.mocked(httpClient.get).mockResolvedValue({
      data: { id: 'c1', name: 'Luna' },
    } as never);

    const profile = await fetchCompanionProfile();

    expect(httpClient.get).toHaveBeenCalledWith('/companion/me/profile', undefined, {
      suppressFatalBoundary: true,
    });
    expect(profile.name).toBe('Luna');
  });

  it('invalidateCompanionProfile marca la query para refetch', async () => {
    const client = new QueryClient();
    client.setQueryData(companionProfileQueryKey, { id: 'c1', name: 'Antes' });

    await invalidateCompanionProfile(client);

    expect(client.getQueryState(companionProfileQueryKey)?.isInvalidated).toBe(true);
  });
});
