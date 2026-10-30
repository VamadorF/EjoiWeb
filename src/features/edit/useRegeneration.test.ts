import { QueryClient } from '@tanstack/react-query';
import { act, renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { COMPANION_AVATAR_IMAGE_SIZE } from '~/features/chat/usePortraitGeneration';

import { buildAppearancePatchBody, profileToEditForm } from './editPatch';
import { useRegeneration } from './useRegeneration';

// `@/features/companion/api/image.api` resuelve al shim web (vite alias): un solo mock para ambos imports.
vi.mock('@/features/companion/api/image.api', () => ({
  generateCompanionImage: vi.fn(),
  editCompanionImageWithReference: vi.fn(),
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
import { editCompanionImageWithReference } from '~/platform/image.api.shim';
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

const unsignedAvatar = 'https://storage.googleapis.com/ejoi-images/avatars/u1/a.webp';
const signedAvatar =
  unsignedAvatar +
  '?X-Goog-Algorithm=GOOG4-RSA-SHA256&X-Goog-Credential=sa%40p.iam.gserviceaccount.com%2F20261030%2Fauto%2Fstorage%2Fgoog4_request' +
  '&X-Goog-Date=20261030T120000Z&X-Goog-Expires=3600&X-Goog-SignedHeaders=host' +
  `&X-Goog-Signature=${'a'.repeat(512)}`;

describe('useRegeneration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

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

  it('PATCH de cabello con URL firmada envía avatarUrl sin firma (SCRUM-189)', () => {
    const baseline = profileToEditForm(profile);
    const values = { ...baseline, hairColor: 'Rubio' };
    const body = buildAppearancePatchBody(baseline, values, {
      fileUrl: signedAvatar,
      storagePath: 'avatars/u1/a.webp',
    });
    expect(body).toEqual({
      avatarUrl: unsignedAvatar,
      avatarStoragePath: 'avatars/u1/a.webp',
      hairColor: 'Rubio',
    });
    expect((body.avatarUrl as string).length).toBeLessThanOrEqual(400);
  });

  it('sin storagePath igual envía avatarUrl sin firma y omite avatarStoragePath', () => {
    const baseline = profileToEditForm(profile);
    const values = { ...baseline, visualStyle: 'anime' as const };
    const body = buildAppearancePatchBody(baseline, values, { fileUrl: signedAvatar });
    expect(body).toEqual({ visualStyle: 'anime', avatarUrl: unsignedAvatar });
  });

  it('applyRegeneration hace PATCH con avatarUrl sin firma y la vista previa conserva la firmada', async () => {
    vi.mocked(generateCompanionImage).mockResolvedValue({
      fileUrl: signedAvatar,
      storagePath: 'avatars/u1/a.webp',
    });
    vi.mocked(httpClient.patch).mockResolvedValue({ data: {} } as never);
    const queryClient = new QueryClient();
    const baseline = profileToEditForm(profile);
    const values = { ...baseline, hairColor: 'Rubio' };
    const onApplied = vi.fn();

    const { result } = renderHook(() =>
      useRegeneration({ queryClient, baseline, values, profile, onApplied }),
    );

    await act(async () => {
      await result.current.generatePortrait();
    });
    await waitFor(() => expect(result.current.phase).toBe('compare'));
    expect(result.current.pendingPortrait?.fileUrl).toBe(signedAvatar);

    let applied = false;
    await act(async () => {
      applied = await result.current.applyRegeneration();
    });

    expect(applied).toBe(true);
    expect(httpClient.patch).toHaveBeenCalledWith(
      '/companion/me',
      expect.objectContaining({ avatarUrl: unsignedAvatar }),
    );
    expect(onApplied).toHaveBeenCalled();
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

  it('generatePortrait envía a C15 un prompt con el color elegido (SCRUM-192)', async () => {
    vi.mocked(generateCompanionImage).mockResolvedValue({
      fileUrl: 'https://example.com/new.jpg',
      storagePath: 'avatars/new',
    });
    const queryClient = new QueryClient();
    const profileWithHair = { ...profile, hairColor: 'Negro' };
    const baseline = profileToEditForm(profileWithHair);
    const values = { ...baseline, hairColor: 'Rubio' };

    const { result } = renderHook(() =>
      useRegeneration({
        queryClient,
        baseline,
        values,
        profile: profileWithHair,
        onApplied: vi.fn(),
      }),
    );

    await act(async () => {
      await result.current.generatePortrait();
    });

    await waitFor(() => expect(result.current.phase).toBe('compare'));
    expect(vi.mocked(generateCompanionImage).mock.calls.at(-1)![0].prompt).toContain(
      'natural blonde hair',
    );
  });

  describe('solo cambio de cabello (SCRUM-192)', () => {
    const profileWithHair = { ...profile, hairColor: 'Negro' };
    const newImage = { fileUrl: 'https://example.com/edited.png', storagePath: 'avatars/edited' };

    function renderHairChange(overrides: Partial<ReturnType<typeof profileToEditForm>> = {}, avatarUrl?: string | null) {
      const currentProfile = { ...profileWithHair, avatarUrl: avatarUrl === undefined ? profileWithHair.avatarUrl : avatarUrl };
      const baseline = profileToEditForm(currentProfile);
      const values = { ...baseline, hairColor: 'Rubio', ...overrides };
      return renderHook(() =>
        useRegeneration({ queryClient: new QueryClient(), baseline, values, profile: currentProfile, onApplied: vi.fn() }),
      );
    }

    it('edita el avatar actual con referencia y no regenera desde cero', async () => {
      vi.mocked(editCompanionImageWithReference).mockResolvedValue(newImage);
      const { result } = renderHairChange();

      await act(async () => {
        await result.current.generatePortrait();
      });

      await waitFor(() => expect(result.current.phase).toBe('compare'));
      expect(editCompanionImageWithReference).toHaveBeenCalledWith({
        referenceUrl: profileWithHair.avatarUrl,
        prompt: expect.stringContaining('natural blonde hair'),
      });
      expect(generateCompanionImage).not.toHaveBeenCalled();
      expect(result.current.pendingPortrait?.fileUrl).toBe(newImage.fileUrl);
    });

    it('si la edición falla, vuelve a la regeneración completa', async () => {
      vi.mocked(editCompanionImageWithReference).mockRejectedValue(new Error('CORS'));
      vi.mocked(generateCompanionImage).mockResolvedValue(newImage);
      const { result } = renderHairChange();

      await act(async () => {
        await result.current.generatePortrait();
      });

      await waitFor(() => expect(result.current.phase).toBe('compare'));
      expect(generateCompanionImage).toHaveBeenCalledTimes(1);
    });

    it('sin avatar remoto usa la regeneración completa', async () => {
      vi.mocked(generateCompanionImage).mockResolvedValue(newImage);
      const { result } = renderHairChange({}, null);

      await act(async () => {
        await result.current.generatePortrait();
      });

      await waitFor(() => expect(result.current.phase).toBe('compare'));
      expect(editCompanionImageWithReference).not.toHaveBeenCalled();
      expect(generateCompanionImage).toHaveBeenCalledTimes(1);
    });

    it('cabello + estilo usa la regeneración completa', async () => {
      vi.mocked(generateCompanionImage).mockResolvedValue(newImage);
      const { result } = renderHairChange({ visualStyle: 'anime' });

      await act(async () => {
        await result.current.generatePortrait();
      });

      await waitFor(() => expect(result.current.phase).toBe('compare'));
      expect(editCompanionImageWithReference).not.toHaveBeenCalled();
      expect(generateCompanionImage).toHaveBeenCalledTimes(1);
    });
  });
});
