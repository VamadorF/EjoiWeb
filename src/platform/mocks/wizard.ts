import { ONBOARDING_STEPS } from '@/features/onboarding/constants/onboardingSteps';

import { wizardPathForStep } from '~/features/creation/wizardSteps';

/** Rutas del asistente v2 para mocks y e2e. */
export const WIZARD_V2_START = wizardPathForStep(ONBOARDING_STEPS.gender);

export const WIZARD_V2_SCREENS = {
  genero: wizardPathForStep(ONBOARDING_STEPS.gender),
  personalidad: wizardPathForStep(ONBOARDING_STEPS.persona),
  estilo: wizardPathForStep(ONBOARDING_STEPS.visualStyle),
  presencia: wizardPathForStep(ONBOARDING_STEPS.intensity),
  limites: wizardPathForStep(ONBOARDING_STEPS.boundaries),
  intereses: wizardPathForStep(ONBOARDING_STEPS.interests),
  nombre: wizardPathForStep(ONBOARDING_STEPS.name),
} as const;
