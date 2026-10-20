import { QueryClient } from '@tanstack/react-query';
import { act, renderHook, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { useEditForm } from './useEditForm';

vi.mock('@/features/companion/api/image.api', () => ({
  generateCompanionImage: vi.fn(),
}));

vi.mock('~/platform/http', () => ({
  httpClient: {
    patch: vi.fn().mockResolvedValue({ data: {} }),
    get: vi.fn(),
  },
}));

vi.mock('~/features/chat/useProfile', async (importOriginal) => {
  const actual = await importOriginal<typeof import('~/features/chat/useProfile')>();
  return {
    ...actual,
    fetchCompanionProfile: vi.fn().mockResolvedValue({
      id: 'c1',
      name: 'Luna',
      visualStyle: 'realista',
      gender: 'femenino',
      persona: 'Cálida',
      intensity: 'balanced',
      interests: ['Música'],
      boundaries: [],
      voiceKey: 'NORAH',
    }),
    invalidateCompanionProfile: vi.fn().mockResolvedValue(undefined),
  };
});

import { generateCompanionImage } from '@/features/companion/api/image.api';
import { httpClient } from '~/platform/http';
import { fetchCompanionProfile } from '~/features/chat/useProfile';

describe('useEditForm', () => {
  it('guardar conversacional no llama a la API de imagen', async () => {
    const queryClient = new QueryClient();
    const { result } = renderHook(() => useEditForm(queryClient));

    await waitFor(() => expect(result.current.loaded).toBe(true));

    act(() => {
      result.current.setValues((prev) => (prev ? { ...prev, persona: 'Intelectual' } : prev));
    });

    await act(async () => {
      await result.current.saveConversational();
    });

    expect(httpClient.patch).toHaveBeenCalledWith('/companion/me', { persona: 'Intelectual' });
    expect(generateCompanionImage).not.toHaveBeenCalled();
    expect(fetchCompanionProfile).toHaveBeenCalledTimes(2);
  });
});
