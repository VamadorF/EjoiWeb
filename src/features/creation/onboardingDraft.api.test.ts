import { afterEach, describe, expect, it, vi } from 'vitest';

import { emptyOnboardingData, toOnboardingDraftData } from './onboardingDraft.api';

vi.mock('~/platform/env', async (importOriginal) => {
  const actual = await importOriginal<typeof import('~/platform/env')>();
  return {
    ...actual,
    ENABLE_ETHNICITY: false,
    ENABLE_AGE: false,
  };
});

describe('toOnboardingDraftData flags', () => {
  afterEach(() => {
    vi.resetModules();
  });

  it('no incluye etnia ni edad cuando los flags están en false', () => {
    const data = {
      ...emptyOnboardingData(),
      gender: 'femenino' as const,
      visualStyle: 'realista' as const,
      ethnicity: 'Latina',
      age: 28,
    };
    const payload = toOnboardingDraftData(data, 'quien');
    expect(payload.ethnicity).toBeUndefined();
    expect(payload.age).toBeUndefined();
    expect(payload.gender).toBe('femenino');
  });
});
