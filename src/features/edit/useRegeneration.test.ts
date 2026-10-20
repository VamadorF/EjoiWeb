import { QueryClient } from '@tanstack/react-query';
import { act, renderHook, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { COMPANION_AVATAR_IMAGE_SIZE } from '~/features/chat/usePortraitGeneration';

import { buildAppearancePatchBody, profileToEditForm } from './editPatch';
import { useRegeneration } from './useRegeneration';

vi.mock('@/features/companion/api/image.api', () => ({
  generateCompanionImage: vi.fn(),
}));

vi.mock('~/platform/http', () => ({
  httpClient: {
    patch: vi.fn(),
  },
}));

vi.mock('~/features/chat/useProfile', () => ({
  fetchCompanionProfile: vi.fn().mockResolvedValue({ id: 'c1', name: 'Luna' }),
  invalidateCompanionProfile: vi.fn().mockResolvedValue(undefined),
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
    vi.mocked(generateCompanionImage).mockRejectedValue(new Error('C15 down'));
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

  it('PATCH de estilo envía solo visualStyle y avatar', () => {
    const baseline = profileToEditForm(profile);
    const values = { ...baseline, visualStyle: 'anime' as const };
    const body = buildAppearancePatchBody(baseline, values, {
      fileUrl: 'https://example.com/new.jpg',
      storagePath: 'avatars/new',
    });
    expect(body).toEqual({
      visualStyle: 'anime',
      avatarUrl: 'https://example.com/new.jpg',
      avatarStoragePath: 'avatars/new',
    });
  });

  it('generación ilustrada usa el mismo tamaño C15 que realista', async () => {
    vi.mocked(generateCompanionImage).mockResolvedValue({
      fileUrl: 'https://example.com/new.jpg',
      storagePath: 'avatars/new',
    });
    const queryClient = new QueryClient();
    const baseline = profileToEditForm(profile);
    const values = { ...baseline, visualStyle: 'anime' as const };

    const { result } = renderHook(() =>
      useRegeneration({
        queryClient,
        baseline,
        values,
        profile,
        onApplied: vi.fn(),
      }),
    );

    await act(async () => {
      await result.current.generatePortrait();
    });

    await waitFor(() => expect(result.current.phase).toBe('compare'));
    expect(vi.mocked(generateCompanionImage).mock.calls[0]![0].size).toBe(
      COMPANION_AVATAR_IMAGE_SIZE,
    );
  });
});
