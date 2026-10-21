import { ONBOARDING_STEPS } from '@/features/onboarding/constants/onboardingSteps';
import { getIntensityConfig } from '@/features/onboarding/data/companionIntensity';
import type { OnboardingData } from '@/features/onboarding/types';
import { wizardPathForStep } from './wizardSteps';

export function getCompanionImagePromptKey(data: OnboardingData): string {
  return JSON.stringify({
    name: data.companionName,
    visualStyle: data.visualStyle,
    gender: data.gender,
    persona: data.persona,
    tone: data.tone,
    interests: data.interests,
    ethnicity: data.ethnicity,
    age: data.age,
    archetypeId: data.archetypeId,
    intensity: data.intensity,
  });
}

export function isLoginConsentComplete(ageConfirmed: boolean, legalAccepted: boolean): boolean {
  return ageConfirmed && legalAccepted;
}

export function wizardEditPathFromRevision(step: number): string {
  return `${wizardPathForStep(step)}?volver=revision`;
}

export const REVISION_EDIT_PATHS = {
  name: wizardEditPathFromRevision(ONBOARDING_STEPS.name),
  persona: wizardEditPathFromRevision(ONBOARDING_STEPS.persona),
  interests: wizardEditPathFromRevision(ONBOARDING_STEPS.interests),
  boundaries: wizardEditPathFromRevision(ONBOARDING_STEPS.boundaries),
  visualStyle: wizardEditPathFromRevision(ONBOARDING_STEPS.visualStyle),
  gender: wizardEditPathFromRevision(ONBOARDING_STEPS.gender),
  intensity: wizardEditPathFromRevision(ONBOARDING_STEPS.intensity),
} as const;

export function intensityLabelForCard(data: OnboardingData): string {
  const id = data.intensity ?? 'balanced';
  return getIntensityConfig(id).label;
}

export function hasMinimumReviewData(
  data: Pick<OnboardingData, 'gender' | 'visualStyle' | 'persona' | 'intensity' | 'interests' | 'companionName'>,
): boolean {
  return Boolean(
    data.gender &&
      data.visualStyle &&
      data.persona &&
      data.intensity &&
      data.interests.length >= 3 &&
      data.companionName?.trim(),
  );
}
