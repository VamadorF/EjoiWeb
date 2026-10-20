import { useCallback, useState } from 'react';
import type { QueryClient } from '@tanstack/react-query';

import { generateCompanionImage } from '@/features/companion/api/image.api';
import { generateCompanionImagePrompt } from '@/shared/utils/companionImagePrompt';

import { buildCompanionAvatarImageRequest } from '~/features/chat/usePortraitGeneration';
import { httpClient } from '~/platform/http';
import {
  fetchCompanionProfile,
  invalidateCompanionProfile,
  type CompanionProfile,
} from '~/features/chat/useProfile';

import {
  buildAppearancePatchBody,
  editFormToOnboardingData,
  hasAppearanceChanges,
  type EditFormSnapshot,
} from './editPatch';

export type RegenerationPhase = 'idle' | 'generating' | 'compare' | 'error';

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

  const generatePortrait = useCallback(async () => {
    if (!options.baseline || !options.values || !appearanceDirty) return;
    setPhase('generating');
    setErrorMessage(null);
    setPendingPortrait(null);
    try {
      const onboardingData = editFormToOnboardingData(options.values);
      const prompt = generateCompanionImagePrompt(onboardingData, 'avatar');
      const image = await generateCompanionImage(buildCompanionAvatarImageRequest(prompt));
      setPendingPortrait({ fileUrl: image.fileUrl, storagePath: image.storagePath });
      setPhase('compare');
    } catch {
      setPhase('error');
      setErrorMessage('regen');
    }
  }, [appearanceDirty, options.baseline, options.values]);

  const applyRegeneration = useCallback(async (): Promise<boolean> => {
    if (!options.baseline || !options.values || !pendingPortrait) return false;
    const body = buildAppearancePatchBody(options.baseline, options.values, pendingPortrait);
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
