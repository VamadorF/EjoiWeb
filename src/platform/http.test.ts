import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { httpClient } from './http';
import * as session from './session';

vi.mock('./env', async (importOriginal) => ({
  ...(await importOriginal<typeof import('./env')>()),
  MOCK_API: false,
}));

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

describe('httpClient — refresh fallido tras 401', () => {
  const onExpired = vi.fn();

  beforeEach(() => {
    session.clearSession();
    localStorage.clear();
    session.setSession('at-viejo');
    session.setRefreshToken('rt-1');
    onExpired.mockReset();
    window.addEventListener('ejoi:session-expired', onExpired);
    vi.stubGlobal('fetch', vi.fn());
  });

  afterEach(() => {
    window.removeEventListener('ejoi:session-expired', onExpired);
    vi.unstubAllGlobals();
  });

  it('un error de red al refrescar no cierra la sesión', async () => {
    vi.mocked(fetch).mockImplementation(async (input) => {
      if (String(input).endsWith('/auth/refresh')) throw new TypeError('Failed to fetch');
      return jsonResponse({}, 401);
    });

    await expect(httpClient.get('/companion/me')).rejects.toThrow();

    expect(onExpired).not.toHaveBeenCalled();
    expect(session.getRefreshToken()).toBe('rt-1');
  });

  it('un refresh rechazado por el backend cierra la sesión', async () => {
    vi.mocked(fetch).mockImplementation(async () => jsonResponse({}, 401));

    await expect(httpClient.get('/companion/me')).rejects.toThrow();

    expect(onExpired).toHaveBeenCalledTimes(1);
    expect(session.getAccessToken()).toBeNull();
  });
});
