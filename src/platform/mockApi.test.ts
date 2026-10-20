import { describe, expect, it } from 'vitest';

import { handleMockApiRequest, normalizeApiPath } from './mockApi';

describe('mockApi', () => {
  it('normaliza rutas con prefijo /api', () => {
    expect(normalizeApiPath('http://localhost:5173/api/auth/refresh')).toBe('/auth/refresh');
  });

  it('responde login mock', () => {
    const res = handleMockApiRequest('/api/auth/mock-login', { method: 'POST' });
    expect(res?.status).toBe(200);
    const data = res?.data as { accessToken?: string; user?: { id: string } };
    expect(data.accessToken).toBeTruthy();
    expect(data.user?.id).toBeTruthy();
  });

  it('persiste borrador de onboarding', () => {
    const draft = { schemaVersion: 1, step: 2, data: { webView: 'quien' } };
    handleMockApiRequest('/api/users/me/onboarding-draft', {
      method: 'PUT',
      body: draft,
      authToken: 'x.y.mock',
    });
    const read = handleMockApiRequest('/api/users/me/onboarding-draft', { method: 'GET' });
    expect((read?.data as { draft: typeof draft }).draft).toEqual(draft);
  });
});
