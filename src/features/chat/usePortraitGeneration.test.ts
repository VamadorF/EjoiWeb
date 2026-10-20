import { renderHook, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { usePortraitGeneration } from './usePortraitGeneration';

vi.mock('@/features/companion/api/image.api', () => ({
  generateCompanionImage: vi.fn().mockRejectedValue(new Error('image down')),
}));

vi.mock('@/features/companion/api/companion.api', () => ({
  patchCompanion: vi.fn(),
}));

import type { OnboardingData } from '@/features/onboarding/types';

const onboardingData: OnboardingData = {
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
    const { result } = renderHook(() =>
      usePortraitGeneration({
        steps: { portrait: false },
        onboardingData,
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
        onboardingData,
        canPatchCompanion: true,
        profileAvatarUrl: 'https://example.com/a.jpg',
      }),
    );
    expect(result.current.state).toBe('ready');
    expect(result.current.portraitPending).toBe(false);
  });
});
