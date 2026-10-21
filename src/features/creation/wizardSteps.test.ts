import { ONBOARDING_STEPS } from '@/features/onboarding/constants/onboardingSteps';
import { describe, expect, it } from 'vitest';

import {
  resolveAccessibleWizardIndex,
  wizardIndexFromDraftStep,
  wizardPath,
} from './wizardSteps';

describe('wizardSteps', () => {
  it('mapea draft.step a paso del asistente (§3.3)', () => {
    expect(wizardIndexFromDraftStep(ONBOARDING_STEPS.gender)).toBe(0);
    expect(wizardIndexFromDraftStep(ONBOARDING_STEPS.age)).toBe(0);
    expect(wizardIndexFromDraftStep(ONBOARDING_STEPS.intensity)).toBe(1);
    expect(wizardIndexFromDraftStep(ONBOARDING_STEPS.interests)).toBe(2);
    expect(wizardIndexFromDraftStep(ONBOARDING_STEPS.name)).toBe(3);
  });

  it('bloquea paso 3 sin intereses mínimos', () => {
    const data = {
      gender: 'femenino' as const,
      visualStyle: 'realista' as const,
      persona: 'Cálida',
      interests: [] as string[],
    };
    expect(resolveAccessibleWizardIndex(data, 2)).toBe(2);
    expect(resolveAccessibleWizardIndex(data, 3)).toBe(2);
  });

  it('genera rutas paso-N', () => {
    expect(wizardPath(0)).toBe('/crear/paso-1');
    expect(wizardPath(3)).toBe('/crear/paso-4');
  });
});
