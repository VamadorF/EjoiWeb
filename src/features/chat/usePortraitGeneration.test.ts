import { renderHook, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import type { OnboardingData } from '@/features/onboarding/types';

import {
  COMPANION_AVATAR_IMAGE_SIZE,
  buildCompanionAvatarImageRequest,
  usePortraitGeneration,
} from './usePortraitGeneration';

vi.mock('@/features/companion/api/image.api', () => ({
  generateCompanionImage: vi.fn(),
}));

vi.mock('@/features/companion/api/companion.api', () => ({
  patchCompanion: vi.fn().mockResolvedValue(undefined),
}));

import { generateCompanionImage } from '@/features/companion/api/image.api';

const baseOnboarding: OnboardingData = {
  visualStyle: 'realista',
  gender: 'femenino',
  persona: 'Cálida',
  tone: '',
  interactionStyle: '',
  conversationDepth: '',
  interests: ['Música', 'Arte y cultura', 'Viajes'],
  boundaries: [],
  companionName: 'Luna',
};

describe('usePortraitGeneration', () => {
  it('no bloquea el chat si falla el retrato', async () => {
    vi.mocked(generateCompanionImage).mockRejectedValue(new Error('image down'));

    const { result } = renderHook(() =>
      usePortraitGeneration({
        steps: { portrait: false },
        onboardingData: baseOnboarding,
        canPatchCompanion: true,
      }),
    );

    await waitFor(() => expect(result.current.state).toBe('error'));
    expect(result.current.portraitPending).toBe(true);
  });

  it('marca listo si el backend ya completó portrait', () => {
    const { result } = renderHook(() =>
      usePortraitGeneration({
        steps: { portrait: true },
        onboardingData: baseOnboarding,
        canPatchCompanion: true,
        profileAvatarUrl: 'https://example.com/a.jpg',
      }),
    );
    expect(result.current.state).toBe('ready');
    expect(result.current.portraitPending).toBe(false);
  });

  it('pide el mismo tamaño C15 para realista e ilustrado', async () => {
    vi.mocked(generateCompanionImage).mockResolvedValue({
      fileUrl: 'https://example.com/new.jpg',
      storagePath: 'avatars/x',
    });

    for (const visualStyle of ['realista', 'anime'] as const) {
      vi.mocked(generateCompanionImage).mockClear();
      const onboardingData = { ...baseOnboarding, visualStyle };
      const { unmount } = renderHook(() =>
        usePortraitGeneration({
          steps: { portrait: false },
          onboardingData,
          canPatchCompanion: true,
        }),
      );
      await waitFor(() => expect(generateCompanionImage).toHaveBeenCalled());
      const request = vi.mocked(generateCompanionImage).mock.calls[0]![0];
      expect(request.size).toBe(COMPANION_AVATAR_IMAGE_SIZE);
      expect(request).toEqual(buildCompanionAvatarImageRequest(request.prompt));
      unmount();
    }
  });
});
