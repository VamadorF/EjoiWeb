import { describe, expect, it } from 'vitest';

import { canCreateCompanion } from './canCreateCompanion';

describe('canCreateCompanion', () => {
  const ready = {
    consentComplete: true,
    isCreating: false,
    imageLoading: false,
    avatarUrl: 'https://example.com/a.webp',
  };

  it('habilita con consentimiento y retrato', () => {
    expect(canCreateCompanion(ready)).toBe(true);
  });

  it('bloquea sin retrato o consentimiento', () => {
    expect(canCreateCompanion({ ...ready, avatarUrl: null })).toBe(false);
    expect(canCreateCompanion({ ...ready, consentComplete: false })).toBe(false);
    expect(canCreateCompanion({ ...ready, imageLoading: true })).toBe(false);
  });
});
