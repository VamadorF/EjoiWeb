import { describe, expect, it } from 'vitest';

import { buildDataRightsMailto } from './dataRightsRequest';

describe('buildDataRightsMailto', () => {
  it('incluye contacto y derecho solicitado', () => {
    const href = buildDataRightsMailto('access', { email: 'a@ejoi.test', userId: 'u1' });
    expect(href.startsWith('mailto:contacto@ejoi.cl?')).toBe(true);
    expect(decodeURIComponent(href)).toContain('a@ejoi.test');
  });
});
