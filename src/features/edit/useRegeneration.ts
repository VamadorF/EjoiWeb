import { useCallback, useState } from 'react';
import type { QueryClient } from '@tanstack/react-query';

import { generateCompanionImage } from '@/features/companion/api/image.api';
import { generateCompanionImagePrompt } from '@/shared/utils/companionImagePrompt';
import { logger } from '@/shared/utils/logger';

import { buildCompanionAvatarImageRequest } from '~/features/chat/usePortraitGeneration';
import { httpClient } from '~/platform/http';
import { editCompanionImageWithReference, type GenerateImageResponse } from '~/platform/image.api.shim';
import {
  fetchCompanionProfile,
  invalidateCompanionProfile,
  type CompanionProfile,
} from '~/features/chat/useProfile';

import {
  buildAppearancePatchBody,
  editFormToOnboardingData,
  hasAppearanceChanges,
  isHairOnlyChange,
  resolvePromptHairColor,
  type EditFormSnapshot,
} from './editPatch';
import { buildHairColorEditPrompt } from './hairEditPrompt';

export type RegenerationPhase = 'idle' | 'generating' | 'compare' | 'error';

/**
 * Si solo cambió el cabello, edita el retrato actual (misma persona, ojos, ropa y escena).
 * `null` cuando no aplica o la edición falla: se usa la regeneración completa (SCRUM-192).
 */
async function editHairOnly(
  baseline: EditFormSnapshot,
  current: EditFormSnapshot,
  profile: CompanionProfile | null,
): Promise<GenerateImageResponse | null> {
  const referenceUrl = profile?.avatarUrl?.trim();
  if (!isHairOnlyChange(baseline, current) || !referenceUrl?.startsWith('http')) return null;
  const prompt = buildHairColorEditPrompt(current.hairColor ?? '', current.visualStyle);
  if (!prompt) return null;
  try {
    return await editCompanionImageWithReference({ prompt, referenceUrl });
  } catch (error) {
    logger.warn('[Edit][regeneration] edición con referencia falló; regenerando completo', {
      message: error instanceof Error ? error.message : String(error),
    });
    return null;
  }
}

export type PendingPortrait = {
  fileUrl: string;
  storagePath?: string;
};

export function useRegeneration(options: {
  queryClient: QueryClient;
  baseline: EditFormSnapshot | null;
  values: EditFormSnapshot | null;
  profile: CompanionProfile | null;
  onApplied: (nextProfile: CompanionProfile) => void;
}) {
  const [phase, setPhase] = useState<RegenerationPhase>('idle');
  const [pendingPortrait, setPendingPortrait] = useState<PendingPortrait | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [applying, setApplying] = useState(false);

  const appearanceDirty =
    options.baseline != null &&
    options.values != null &&
    hasAppearanceChanges(options.baseline, options.values);

  const resetRegeneration = useCallback(() => {
    setPhase('idle');
    setPendingPortrait(null);
    setErrorMessage(null);
  }, []);

  const generatePortrait = useCallback(async (snapshot?: EditFormSnapshot) => {
    const current = snapshot ?? options.values;
    if (!options.baseline || !current) return;
    if (!hasAppearanceChanges(options.baseline, current)) return;
    setPhase('generating');
    setErrorMessage(null);
    setPendingPortrait(null);
    try {
      const image =
        (await editHairOnly(options.baseline, current, options.profile)) ??
        (await generateCompanionImage(
          buildCompanionAvatarImageRequest(
            generateCompanionImagePrompt(
              editFormToOnboardingData(
                current,
                resolvePromptHairColor(options.baseline, current, options.profile),
              ),
              'avatar',
            ),
          ),
        ));
      setPendingPortrait({ fileUrl: image.fileUrl, storagePath: image.storagePath });
      setPhase('compare');
    } catch {
      setPhase('error');
      setErrorMessage('regen');
    }
  }, [options.baseline, options.values, options.profile]);

  const applyRegeneration = useCallback(async (snapshot?: EditFormSnapshot): Promise<boolean> => {
    const current = snapshot ?? options.values;
    if (!options.baseline || !current || !pendingPortrait) return false;
    const body = buildAppearancePatchBody(options.baseline, current, pendingPortrait);
    if (Object.keys(body).length === 0) return false;

    setApplying(true);
    setErrorMessage(null);
    try {
      await httpClient.patch('/companion/me', body);
      await invalidateCompanionProfile(options.queryClient);
      const refreshed = await fetchCompanionProfile();
      options.onApplied(refreshed);
      resetRegeneration();
      return true;
    } catch {
      setPhase('error');
      setErrorMessage('regen');
      return false;
    } finally {
      setApplying(false);
    }
  }, [options, pendingPortrait, resetRegeneration]);

  return {
    phase,
    pendingPortrait,
    errorMessage,
    applying,
    appearanceDirty,
    generatePortrait,
    applyRegeneration,
    resetRegeneration,
  };
}
