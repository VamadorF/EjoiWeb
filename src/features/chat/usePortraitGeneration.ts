import { useCallback, useEffect, useRef, useState } from 'react';

import { patchCompanion } from '@/features/companion/api/companion.api';
import { generateCompanionImage } from '@/features/companion/api/image.api';
import type { OnboardingData } from '@/features/onboarding/types';
import { generateCompanionImagePrompt } from '@/shared/utils/companionImagePrompt';

import { toPersistedAvatarUrl } from '~/features/companion/avatarUrl';

import type { CreationSteps } from './useCreationStatus';

export type PortraitGenerationState = 'idle' | 'generating' | 'ready' | 'error';

export const COMPANION_AVATAR_IMAGE_SIZE = '1024x1024' as const;

/** Mismo tamaño y parámetros C15 para realista e ilustrado; solo cambia el prompt. */
export function buildCompanionAvatarImageRequest(prompt: string) {
  return {
    prompt,
    size: COMPANION_AVATAR_IMAGE_SIZE,
    quality: 'hd' as const,
    style: 'natural' as const,
  };
}

export function usePortraitGeneration(options: {
  steps: CreationSteps;
  onboardingData: OnboardingData | null;
  canPatchCompanion: boolean;
  profileAvatarUrl?: string;
}) {
  const [state, setState] = useState<PortraitGenerationState>('idle');
  const [avatarUrl, setAvatarUrl] = useState<string | null>(options.profileAvatarUrl ?? null);
  const inFlightRef = useRef(false);

  useEffect(() => {
    if (options.profileAvatarUrl) {
      setAvatarUrl(options.profileAvatarUrl);
      if (options.steps.portrait) setState('ready');
    }
  }, [options.profileAvatarUrl, options.steps.portrait]);

  const run = useCallback(async () => {
    if (options.steps.portrait || !options.onboardingData || !options.canPatchCompanion) return;
    if (inFlightRef.current) return;
    inFlightRef.current = true;
    setState('generating');
    try {
      const prompt = generateCompanionImagePrompt(options.onboardingData, 'avatar');
      const image = await generateCompanionImage(buildCompanionAvatarImageRequest(prompt));
      await patchCompanion({
        avatarUrl: toPersistedAvatarUrl(image.fileUrl),
        avatarStoragePath: image.storagePath,
      });
      setAvatarUrl(image.fileUrl);
      setState('ready');
    } catch {
      setState('error');
      inFlightRef.current = false;
    }
  }, [options.canPatchCompanion, options.onboardingData, options.steps.portrait]);

  useEffect(() => {
    if (options.steps.portrait) {
      setState('ready');
      return;
    }
    void run();
  }, [options.steps.portrait, run]);

  const retry = useCallback(() => {
    inFlightRef.current = false;
    void run();
  }, [run]);

  const portraitPending = !options.steps.portrait && state !== 'ready';

  return {
    state,
    avatarUrl,
    portraitPending,
    retry,
  };
}
