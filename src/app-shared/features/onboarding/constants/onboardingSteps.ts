// AUTO-SINCRONIZADO desde ejoiFE b20f6d62a97a0266796ebfb82e772f0961ed9136@b20f6d62a97a0266796ebfb82e772f0961ed9136:src/features/onboarding/constants/onboardingSteps.ts. No editar: npm run sync:app
export const ONBOARDING_STEPS = {
  gender: 1,
  visualStyle: 2,
  archetypeRecommendation: 3,
  archetypeSelection: 4,
  ethnicity: 5,
  age: 6,
  intensity: 7,
  persona: 8,
  tone: 9,
  interactionStyle: 10,
  conversationDepth: 11,
  interests: 12,
  boundaries: 13,
  name: 14,
} as const;

export const TOTAL_ONBOARDING_STEPS = ONBOARDING_STEPS.name;

export const COMPANION_MIN_AGE = 18;
export const COMPANION_MAX_AGE = 76;
export const COMPANION_DEFAULT_AGE = 25;

export type OnboardingPath = 'archetype' | 'manual';

/** Camino corto: arquetipo curado + etnia, edad, intensidad, límites y nombre. */
export const ARCHETYPE_PATH = [
  ONBOARDING_STEPS.gender,
  ONBOARDING_STEPS.visualStyle,
  ONBOARDING_STEPS.archetypeRecommendation,
  ONBOARDING_STEPS.archetypeSelection,
  ONBOARDING_STEPS.ethnicity,
  ONBOARDING_STEPS.age,
  ONBOARDING_STEPS.intensity,
  ONBOARDING_STEPS.boundaries,
  ONBOARDING_STEPS.name,
] as const;

/** Camino largo: cada rasgo a mano, sin intensidad ni selección de arquetipo. */
export const MANUAL_PATH = [
  ONBOARDING_STEPS.gender,
  ONBOARDING_STEPS.visualStyle,
  ONBOARDING_STEPS.archetypeRecommendation,
  ONBOARDING_STEPS.ethnicity,
  ONBOARDING_STEPS.age,
  ONBOARDING_STEPS.persona,
  ONBOARDING_STEPS.tone,
  ONBOARDING_STEPS.interactionStyle,
  ONBOARDING_STEPS.conversationDepth,
  ONBOARDING_STEPS.interests,
  ONBOARDING_STEPS.boundaries,
  ONBOARDING_STEPS.name,
] as const;

/** Head start creíble (Nunes & Drèze). Nunca empezar la barra en 0. */
export const ENDOWED_PROGRESS = 0.2;
const USER_PROGRESS_SPAN = 1 - ENDOWED_PROGRESS;

const MANUAL_ONLY_STEPS: ReadonlySet<number> = new Set([
  ONBOARDING_STEPS.persona,
  ONBOARDING_STEPS.tone,
  ONBOARDING_STEPS.interactionStyle,
  ONBOARDING_STEPS.conversationDepth,
  ONBOARDING_STEPS.interests,
]);

export function getPathSteps(path: OnboardingPath): readonly number[] {
  return path === 'archetype' ? ARCHETYPE_PATH : MANUAL_PATH;
}

/**
 * Resuelve el camino activo sin usar el ID crudo del paso como progreso.
 * Analytics sigue reportando `ONBOARDING_STEPS.*` (1–14).
 */
export function resolveOnboardingPath(
  step: number,
  hasArchetype: boolean,
): OnboardingPath {
  if (
    step === ONBOARDING_STEPS.archetypeSelection ||
    step === ONBOARDING_STEPS.intensity
  ) {
    return 'archetype';
  }
  if (MANUAL_ONLY_STEPS.has(step)) {
    return 'manual';
  }
  return hasArchetype ? 'archetype' : 'manual';
}

export function getPathProgress(step: number, path: OnboardingPath): number {
  const steps = getPathSteps(path);
  const lastIndex = Math.max(1, steps.length - 1);
  const index = steps.indexOf(step);
  const safeIndex =
    index >= 0
      ? index
      : Math.max(
          0,
          [...steps].reduce((acc, pathStep, pathIndex) => (pathStep <= step ? pathIndex : acc), 0),
        );

  const progress = ENDOWED_PROGRESS + USER_PROGRESS_SPAN * (safeIndex / lastIndex);
  return Math.max(ENDOWED_PROGRESS, Math.min(1, progress));
}

/** Wizard v2: 4 pasos visibles en onboarding inicial (sin edad/etnia). */
export const ONBOARDING_V2_WIZARD_STEPS = 4;

/** Camino v2 sin arquetipos (DP-09); edad/etnia quedan fuera del asistente. */
export const V2_WIZARD_PATH = [
  ONBOARDING_STEPS.gender,
  ONBOARDING_STEPS.persona,
  ONBOARDING_STEPS.visualStyle,
  ONBOARDING_STEPS.intensity,
  ONBOARDING_STEPS.boundaries,
  ONBOARDING_STEPS.interests,
  ONBOARDING_STEPS.name,
] as const;

const V2_WIZARD_GROUPS: readonly (readonly number[])[] = [
  [ONBOARDING_STEPS.gender, ONBOARDING_STEPS.persona, ONBOARDING_STEPS.visualStyle],
  [ONBOARDING_STEPS.intensity, ONBOARDING_STEPS.boundaries],
  [ONBOARDING_STEPS.interests],
  [ONBOARDING_STEPS.name],
];

export function getV2WizardGroupIndex(step: number): number {
  const idx = V2_WIZARD_GROUPS.findIndex((group) => group.includes(step));
  return idx >= 0 ? idx + 1 : 1;
}

export function getV2WizardProgress(step: number): number {
  const groupIndex = getV2WizardGroupIndex(step) - 1;
  const group = V2_WIZARD_GROUPS[groupIndex] ?? V2_WIZARD_GROUPS[0];
  const innerIndex = Math.max(0, group.indexOf(step));
  const innerFraction =
    group.length <= 1 ? 1 : innerIndex / Math.max(1, group.length - 1);
  const groupWeight = 1 / ONBOARDING_V2_WIZARD_STEPS;
  const overall = groupIndex * groupWeight + innerFraction * groupWeight;
  return Math.max(
    ENDOWED_PROGRESS,
    Math.min(1, ENDOWED_PROGRESS + USER_PROGRESS_SPAN * overall),
  );
}

export function getV2NextStep(
  current: number,
  _hasArchetype: boolean,
): number | null {
  const idx = V2_WIZARD_PATH.indexOf(current as (typeof V2_WIZARD_PATH)[number]);
  if (idx < 0 || idx >= V2_WIZARD_PATH.length - 1) return null;
  return V2_WIZARD_PATH[idx + 1];
}

export function getV2PreviousStep(
  current: number,
  _hasArchetype: boolean,
): number | null {
  const idx = V2_WIZARD_PATH.indexOf(current as (typeof V2_WIZARD_PATH)[number]);
  if (idx <= 0) return null;
  return V2_WIZARD_PATH[idx - 1];
}

export function hasOnboardingDraft(data: {
  gender?: string;
  visualStyle?: string;
  persona?: string;
  interests?: string[];
  companionName?: string;
}): boolean {
  return Boolean(
    data.gender ||
      data.visualStyle ||
      data.persona ||
      (data.interests && data.interests.length > 0) ||
      data.companionName,
  );
}
