import { ONBOARDING_STEPS } from '@/features/onboarding/constants/onboardingSteps';
import type { OnboardingData } from '@/features/onboarding/types';

import type { WebView } from './onboardingDraft.api';

export const WIZARD_STEP_COUNT = 4;

export const WIZARD_DRAFT_STEPS = [
  ONBOARDING_STEPS.gender,
  ONBOARDING_STEPS.intensity,
  ONBOARDING_STEPS.interests,
  ONBOARDING_STEPS.name,
] as const;

/** Reanudación §3.3: draft.step → índice 0..3 del asistente. */
export function wizardIndexFromDraftStep(step: number): number {
  if (step <= ONBOARDING_STEPS.age) return 0;
  if (step <= ONBOARDING_STEPS.conversationDepth) return 1;
  if (step <= ONBOARDING_STEPS.boundaries) return 2;
  return 3;
}

export function webViewForWizardIndex(index: number): WebView {
  return index <= 1 ? 'quien' : 'como';
}

export function draftStepForWizardIndex(index: number): number {
  return WIZARD_DRAFT_STEPS[index] ?? ONBOARDING_STEPS.gender;
}

export function wizardPath(index: number): string {
  const safe = Math.min(WIZARD_STEP_COUNT - 1, Math.max(0, index));
  return `/crear/paso-${safe + 1}`;
}

/** Slug de ruta `paso-1` … `paso-4` (DF-10). */
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

/** Nunca entrar a un paso si el anterior obligatorio está incompleto. */
export function resolveAccessibleWizardIndex(
  data: Pick<OnboardingData, 'gender' | 'visualStyle' | 'persona' | 'interests'>,
  requestedIndex: number,
): number {
  const target = Math.min(WIZARD_STEP_COUNT - 1, Math.max(0, requestedIndex));
  for (let i = 0; i < target; i++) {
    if (!canAdvanceWizardStep(i, data)) return i;
  }
  return target;
}

export function resolvePostLoginWizardPath(draft: { step?: number; data?: { webView?: WebView } } | null): string {
  if (draft?.step != null && draft.step >= 1) {
    return wizardPath(wizardIndexFromDraftStep(draft.step));
  }
  if (draft?.data?.webView === 'chat') return '/chat';
  if (draft?.data?.webView === 'como') return wizardPath(2);
  return wizardPath(0);
}
