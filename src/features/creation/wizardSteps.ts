import {
  getV2NextStep,
  getV2PreviousStep,
  getV2WizardGroupIndex,
  getV2WizardProgress,
  ONBOARDING_STEPS,
  V2_WIZARD_PATH,
} from '@/features/onboarding/constants/onboardingSteps';
import type { OnboardingData } from '@/features/onboarding/types';

import type { WebView } from './onboardingDraft.api';
import { isValidWizardCompanionName } from './createFormValidation';

export { getV2WizardGroupIndex, getV2WizardProgress, V2_WIZARD_PATH };

export const WIZARD_GROUP_COUNT = 4;

/** Slug de URL por id `ONBOARDING_STEPS` (6.1). */
export const WIZARD_SCREEN_SLUG: Record<number, string> = {
  [ONBOARDING_STEPS.gender]: 'genero',
  [ONBOARDING_STEPS.persona]: 'personalidad',
  [ONBOARDING_STEPS.visualStyle]: 'estilo',
  [ONBOARDING_STEPS.intensity]: 'presencia',
  [ONBOARDING_STEPS.boundaries]: 'limites',
  [ONBOARDING_STEPS.interests]: 'intereses',
  [ONBOARDING_STEPS.name]: 'nombre',
};

const SLUG_TO_STEP = Object.fromEntries(
  Object.entries(WIZARD_SCREEN_SLUG).map(([step, slug]) => [slug, Number(step)]),
) as Record<string, number>;

const FIRST_SCREEN_BY_GROUP: Record<number, number> = {
  1: ONBOARDING_STEPS.gender,
  2: ONBOARDING_STEPS.intensity,
  3: ONBOARDING_STEPS.interests,
  4: ONBOARDING_STEPS.name,
};

export function wizardScreenSlug(step: number): string | null {
  return WIZARD_SCREEN_SLUG[step] ?? null;
}

export function wizardPathForStep(step: number): string {
  const slug = wizardScreenSlug(step);
  const group = getV2WizardGroupIndex(step);
  if (!slug) return `/crear/paso-1/${WIZARD_SCREEN_SLUG[ONBOARDING_STEPS.gender]}`;
  return `/crear/paso-${group}/${slug}`;
}

/** Redirección `/crear/paso-N` sin pantalla → primera pantalla del paso. */
export function legacyWizardRedirect(wizardStep: string | undefined, screen: string | undefined): string | null {
  if (screen) return null;
  const match = /^paso-([1-4])$/.exec(wizardStep ?? '');
  if (!match) return null;
  const group = Number(match[1]);
  const first = FIRST_SCREEN_BY_GROUP[group];
  return first ? wizardPathForStep(first) : null;
}

export function parseWizardRoute(
  wizardStep: string | undefined,
  screen: string | undefined,
): number | null {
  if (!screen) return null;
  const groupMatch = /^paso-([1-4])$/.exec(wizardStep ?? '');
  if (!groupMatch) return null;
  const group = Number(groupMatch[1]);
  const step = SLUG_TO_STEP[screen];
  if (!step || getV2WizardGroupIndex(step) !== group) return null;
  return step;
}

export function webViewForOnboardingStep(step: number): WebView {
  return step >= ONBOARDING_STEPS.interests ? 'como' : 'quien';
}

export function onboardingStepFromDraftStep(step: number): number {
  if ((V2_WIZARD_PATH as readonly number[]).includes(step)) return step;
  if (step <= ONBOARDING_STEPS.visualStyle || step <= ONBOARDING_STEPS.age) {
    return ONBOARDING_STEPS.gender;
  }
  if (step <= ONBOARDING_STEPS.conversationDepth) return ONBOARDING_STEPS.intensity;
  if (step <= ONBOARDING_STEPS.boundaries) return ONBOARDING_STEPS.interests;
  return ONBOARDING_STEPS.name;
}

function isGateOpenForNext(
  step: number,
  data: Pick<OnboardingData, 'gender' | 'visualStyle' | 'persona' | 'intensity' | 'interests'>,
  target: number,
): boolean {
  switch (step) {
    case ONBOARDING_STEPS.gender:
      return Boolean(data.gender);
    case ONBOARDING_STEPS.persona:
      return Boolean(data.persona);
    case ONBOARDING_STEPS.visualStyle:
      return Boolean(data.visualStyle);
    case ONBOARDING_STEPS.intensity:
      return Boolean(data.intensity);
    case ONBOARDING_STEPS.boundaries:
      return true;
    case ONBOARDING_STEPS.interests: {
      const targetIdx = (V2_WIZARD_PATH as readonly number[]).indexOf(target);
      const interestsIdx = (V2_WIZARD_PATH as readonly number[]).indexOf(ONBOARDING_STEPS.interests);
      if (targetIdx > interestsIdx) return data.interests.length >= 3;
      return true;
    }
    default:
      return true;
  }
}

export function canProceedWizardScreen(
  step: number,
  data: Pick<
    OnboardingData,
    'gender' | 'visualStyle' | 'persona' | 'intensity' | 'interests' | 'companionName'
  >,
  options?: { adultConfirmed?: boolean; editFromRevision?: boolean },
): boolean {
  switch (step) {
    case ONBOARDING_STEPS.gender:
      return Boolean(data.gender);
    case ONBOARDING_STEPS.persona:
      return Boolean(data.persona);
    case ONBOARDING_STEPS.visualStyle:
      return Boolean(data.visualStyle);
    case ONBOARDING_STEPS.intensity:
      return Boolean(data.intensity);
    case ONBOARDING_STEPS.boundaries:
      return true;
    case ONBOARDING_STEPS.interests:
      return options?.editFromRevision
        ? data.interests.length > 0
        : data.interests.length >= 3;
    case ONBOARDING_STEPS.name:
      return (
        isValidWizardCompanionName(data.companionName?.trim() ?? '') && Boolean(options?.adultConfirmed)
      );
    default:
      return false;
  }
}

/** Nunca entrar a una pantalla si falta un obligatorio anterior en `V2_WIZARD_PATH`. */
export function resolveAccessibleOnboardingStep(
  data: Pick<OnboardingData, 'gender' | 'visualStyle' | 'persona' | 'intensity' | 'interests'>,
  requestedStep: number,
): number {
  const inPath = (V2_WIZARD_PATH as readonly number[]).includes(requestedStep);
  const target = inPath ? requestedStep : ONBOARDING_STEPS.gender;
  for (const step of V2_WIZARD_PATH) {
    if (step === target) return target;
    if (!isGateOpenForNext(step, data, target)) return step;
  }
  return ONBOARDING_STEPS.name;
}

export function nextWizardStep(current: number): number | null {
  return getV2NextStep(current, false);
}

export function previousWizardStep(current: number): number | null {
  return getV2PreviousStep(current, false);
}

export function resolvePostLoginWizardPath(
  draft: {
    step?: number;
    data?: Partial<OnboardingData> & { webView?: WebView };
  } | null,
): string {
  if (draft?.data?.webView === 'chat') return '/chat';
  if (draft?.data?.webView === 'revision') return '/crear/revision';

  const data: Pick<OnboardingData, 'gender' | 'visualStyle' | 'persona' | 'intensity' | 'interests'> = {
    gender: (draft?.data?.gender ?? '') as OnboardingData['gender'],
    visualStyle: (draft?.data?.visualStyle ?? '') as OnboardingData['visualStyle'],
    persona: draft?.data?.persona ?? '',
    intensity: draft?.data?.intensity,
    interests: draft?.data?.interests ?? [],
  };

  let target: number = ONBOARDING_STEPS.gender;
  if (draft?.step != null && draft.step >= 1) {
    target = onboardingStepFromDraftStep(draft.step);
  } else if (draft?.data?.webView === 'como') {
    target = ONBOARDING_STEPS.interests;
  }

  return wizardPathForStep(resolveAccessibleOnboardingStep(data, target));
}

/** @deprecated Usar `wizardPathForStep(ONBOARDING_STEPS.gender)` o rutas por pantalla. */
export function wizardPath(groupIndex: number): string {
  const group = Math.min(WIZARD_GROUP_COUNT - 1, Math.max(0, groupIndex)) + 1;
  const first = FIRST_SCREEN_BY_GROUP[group] ?? ONBOARDING_STEPS.gender;
  return wizardPathForStep(first);
}

/** @deprecated Usar `resolveAccessibleOnboardingStep`. */
export function resolveAccessibleWizardIndex(
  data: Pick<OnboardingData, 'gender' | 'visualStyle' | 'persona' | 'interests'>,
  requestedIndex: number,
): number {
  const steps: number[] = [
    ONBOARDING_STEPS.gender,
    ONBOARDING_STEPS.intensity,
    ONBOARDING_STEPS.interests,
    ONBOARDING_STEPS.name,
  ];
  const requested = steps[Math.min(3, Math.max(0, requestedIndex))] ?? ONBOARDING_STEPS.gender;
  return resolveAccessibleOnboardingStep(data, requested);
}

/** @deprecated Usar `onboardingStepFromDraftStep`. */
export function wizardIndexFromDraftStep(step: number): number {
  const mapped = onboardingStepFromDraftStep(step);
  const legacyGroups: number[] = [
    ONBOARDING_STEPS.gender,
    ONBOARDING_STEPS.intensity,
    ONBOARDING_STEPS.interests,
    ONBOARDING_STEPS.name,
  ];
  const idx = legacyGroups.indexOf(mapped);
  return idx >= 0 ? idx : 0;
}

export function webViewForWizardIndex(index: number): WebView {
  return index <= 1 ? 'quien' : 'como';
}

export function draftStepForWizardIndex(index: number): number {
  const steps = [
    ONBOARDING_STEPS.gender,
    ONBOARDING_STEPS.intensity,
    ONBOARDING_STEPS.interests,
    ONBOARDING_STEPS.name,
  ];
  return steps[index] ?? ONBOARDING_STEPS.gender;
}

export function parseWizardRouteSlug(slug: string | undefined): number | null {
  const match = /^paso-([1-4])$/.exec(slug ?? '');
  if (!match) return null;
  return Number(match[1]) - 1;
}

export function canAdvanceWizardStep(
  index: number,
  data: Pick<OnboardingData, 'gender' | 'visualStyle' | 'persona' | 'interests'>,
): boolean {
  if (index === 0) return Boolean(data.gender && data.visualStyle && data.persona);
  if (index === 1) return true;
  if (index === 2) return data.interests.length >= 3;
  return true;
}
