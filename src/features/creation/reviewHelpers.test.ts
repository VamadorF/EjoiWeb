import { describe, expect, it } from 'vitest';

import { ONBOARDING_STEPS } from '@/features/onboarding/constants/onboardingSteps';
import { PERSONALITY_OPTIONS } from '@/features/onboarding/data/personalityOptions';

import {
  getCompanionImagePromptKey,
  hasMinimumReviewData,
  isLoginConsentComplete,
  wizardEditPathFromRevision,
} from './reviewHelpers';

describe('reviewHelpers', () => {
  it('genera clave estable del prompt', () => {
    const keyA = getCompanionImagePromptKey({
      visualStyle: 'realista',
      gender: 'femenino',
      persona: PERSONALITY_OPTIONS[0],
      tone: '',
      interactionStyle: '',
      conversationDepth: '',
      interests: ['Música'],
      boundaries: [],
      companionName: 'Luna',
      intensity: 'balanced',
    });
    const keyB = getCompanionImagePromptKey({
      visualStyle: 'realista',
      gender: 'femenino',
      persona: PERSONALITY_OPTIONS[0],
      tone: '',
      interactionStyle: '',
      conversationDepth: '',
      interests: ['Música'],
      boundaries: [],
      companionName: 'Luna',
      intensity: 'balanced',
    });
    expect(keyA).toBe(keyB);
  });

  it('exige consentimiento doble', () => {
    expect(isLoginConsentComplete(true, false)).toBe(false);
    expect(isLoginConsentComplete(true, true)).toBe(true);
  });

  it('arma rutas de edición con volver=revision', () => {
    expect(wizardEditPathFromRevision(ONBOARDING_STEPS.persona)).toContain('volver=revision');
  });

  it('valida datos mínimos de revisión', () => {
    expect(
      hasMinimumReviewData({
        gender: 'femenino',
        visualStyle: 'realista',
        persona: PERSONALITY_OPTIONS[0],
        intensity: 'balanced',
        interests: ['a', 'b', 'c'],
        companionName: 'Luna',
      }),
    ).toBe(true);
  });
});
