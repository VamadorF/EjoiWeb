import { QueryClient } from '@tanstack/react-query';
import { act, renderHook, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { profileToEditForm } from './editPatch';
import { useRegeneration } from './useRegeneration';

vi.mock('@/features/companion/api/image.api', () => ({
  generateCompanionImage: vi.fn().mockRejectedValue(new Error('C15 down')),
}));

vi.mock('~/platform/http', () => ({
  httpClient: {
    patch: vi.fn(),
  },
}));

import { generateCompanionImage } from '@/features/companion/api/image.api';
import { httpClient } from '~/platform/http';

const profile = {
  id: 'c1',
  name: 'Luna',
  visualStyle: 'realista',
  gender: 'femenino',
  persona: 'Cálida',
  intensity: 'balanced',
  interests: ['Música'],
  boundaries: [],
  avatarUrl: 'https://example.com/old.jpg',
};

describe('useRegeneration', () => {
  it('fallo de C15 no llama PATCH ni reemplaza el retrato', async () => {
    const queryClient = new QueryClient();
    const baseline = profileToEditForm(profile);
    const values = { ...baseline, visualStyle: 'anime' as const };
    const onApplied = vi.fn();

    const { result } = renderHook(() =>
      useRegeneration({
        queryClient,
        baseline,
        values,
        profile,
        onApplied,
      }),
    );

    await act(async () => {
      await result.current.generatePortrait();
    });

    await waitFor(() => expect(result.current.phase).toBe('error'));
    expect(generateCompanionImage).toHaveBeenCalled();
    expect(httpClient.patch).not.toHaveBeenCalled();
    expect(onApplied).not.toHaveBeenCalled();
    expect(result.current.pendingPortrait).toBeNull();
  });
});
