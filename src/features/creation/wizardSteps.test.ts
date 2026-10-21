import {
  ENDOWED_PROGRESS,
  getV2WizardProgress,
  ONBOARDING_STEPS,
  V2_WIZARD_PATH,
} from '@/features/onboarding/constants/onboardingSteps';
import { describe, expect, it } from 'vitest';

import {
  canProceedWizardScreen,
  legacyWizardRedirect,
  onboardingStepFromDraftStep,
  parseWizardRoute,
  resolveAccessibleOnboardingStep,
  wizardPathForStep,
} from './wizardSteps';

describe('wizardSteps v2', () => {
  it('sigue V2_WIZARD_PATH en rutas', () => {
    expect(V2_WIZARD_PATH).toEqual([
      ONBOARDING_STEPS.gender,
      ONBOARDING_STEPS.persona,
      ONBOARDING_STEPS.visualStyle,
      ONBOARDING_STEPS.intensity,
      ONBOARDING_STEPS.boundaries,
      ONBOARDING_STEPS.interests,
      ONBOARDING_STEPS.name,
    ]);
    expect(wizardPathForStep(ONBOARDING_STEPS.gender)).toBe('/crear/paso-1/genero');
    expect(wizardPathForStep(ONBOARDING_STEPS.name)).toBe('/crear/paso-4/nombre');
  });

  it('parsea paso-N/pantalla y redirige paso-N legacy', () => {
    expect(parseWizardRoute('paso-1', 'genero')).toBe(ONBOARDING_STEPS.gender);
    expect(parseWizardRoute('paso-2', 'limites')).toBe(ONBOARDING_STEPS.boundaries);
    expect(parseWizardRoute('paso-1', 'limites')).toBeNull();
    expect(legacyWizardRedirect('paso-3', undefined)).toBe('/crear/paso-3/intereses');
  });

  it('barra arranca en 20 % en género', () => {
    expect(getV2WizardProgress(ONBOARDING_STEPS.gender)).toBe(ENDOWED_PROGRESS);
  });

  it('bloquea nombre sin 3 intereses', () => {
    const data = {
      gender: 'femenino' as const,
      visualStyle: 'realista' as const,
      persona: 'Amigable y empática',
      intensity: 'balanced' as const,
      interests: ['Música', 'Cine y series'] as string[],
    };
    expect(resolveAccessibleOnboardingStep(data, ONBOARDING_STEPS.name)).toBe(
      ONBOARDING_STEPS.interests,
    );
  });

  it('mapea draft.step legacy a pantalla v2', () => {
    expect(onboardingStepFromDraftStep(ONBOARDING_STEPS.age)).toBe(ONBOARDING_STEPS.gender);
    expect(onboardingStepFromDraftStep(ONBOARDING_STEPS.persona)).toBe(ONBOARDING_STEPS.persona);
    expect(onboardingStepFromDraftStep(ONBOARDING_STEPS.interests)).toBe(ONBOARDING_STEPS.interests);
  });

  it('nombre requiere adulto confirmado', () => {
    const data = {
      gender: 'femenino' as const,
      visualStyle: 'realista' as const,
      persona: 'Amigable y empática',
      intensity: 'balanced' as const,
      interests: ['Música', 'Cine y series', 'Viajes'],
      companionName: 'Luna',
    };
    expect(canProceedWizardScreen(ONBOARDING_STEPS.name, data, { adultConfirmed: false })).toBe(
      false,
    );
    expect(canProceedWizardScreen(ONBOARDING_STEPS.name, data, { adultConfirmed: true })).toBe(
      true,
    );
  });
});
