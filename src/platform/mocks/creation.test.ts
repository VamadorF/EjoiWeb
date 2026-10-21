import { describe, expect, it } from 'vitest';

import { CREATION_READY_MS, isCreationBackendReady } from './creation';

describe('creation mock timings', () => {
  it('marca ready del backend tras 4 s', () => {
    expect(isCreationBackendReady(CREATION_READY_MS - 1)).toBe(false);
    expect(isCreationBackendReady(CREATION_READY_MS)).toBe(true);
  });
});
