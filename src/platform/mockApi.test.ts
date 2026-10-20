import { describe, expect, it } from 'vitest';

import {
  handleMockApiRequest,
  MOCK_DEMO_SESSION_KEY,
  normalizeApiPath,
  setMockDemoLoggedIn,
} from './mockApi';

describe('mockApi', () => {
  it('normaliza rutas con prefijo /api', () => {
    expect(normalizeApiPath('http://localhost:5173/api/auth/refresh')).toBe('/auth/refresh');
  });

  it('refresh devuelve 401 hasta login demo', () => {
    sessionStorage.removeItem(MOCK_DEMO_SESSION_KEY);
    const denied = handleMockApiRequest('/api/auth/refresh', { method: 'POST' });
    expect(denied?.status).toBe(401);
    setMockDemoLoggedIn();
    const allowed = handleMockApiRequest('/api/auth/refresh', { method: 'POST' });
    expect(allowed?.status).toBe(200);
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
