import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { resolvePostLoginWizardPath } from '~/features/creation/wizardSteps';
import * as session from '~/platform/session';

import { loginWithGoogle, logoutWeb, resolvePostLoginPath } from './auth.api';

vi.mock('~/platform/env', async (importOriginal) => ({
  ...(await importOriginal<typeof import('~/platform/env')>()),
  MOCK_API: false,
}));

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

function emptyResponse(): Response {
  return new Response(null, { status: 200 });
}

type Routes = Record<string, () => Response>;

function routeFetch(routes: Routes) {
  vi.mocked(fetch).mockImplementation(async (input) => {
    const url = String(input);
    const match = Object.keys(routes).find((path) => url.endsWith(path));
    if (!match) return jsonResponse({ message: 'Not Found' }, 404);
    return routes[match]();
  });
}

function bodyOf(path: string): unknown {
  const call = vi.mocked(fetch).mock.calls.find(([input]) => String(input).endsWith(path));
  const init = call?.[1] as RequestInit | undefined;
  return init?.body ? JSON.parse(init.body as string) : undefined;
}

describe('auth.api', () => {
  beforeEach(() => {
    session.clearSession();
    localStorage.clear();
    vi.stubGlobal('fetch', vi.fn());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('loginWithGoogle guarda el refresh token que devuelve el backend', async () => {
    routeFetch({
      '/auth/google': () =>
        jsonResponse({
          code: 200,
          access_token: 'at-1',
          refresh_token: 'rt-1',
          user: { id: 'u1', email: 'ana@ejoi.cl', name: 'Ana' },
        }),
    });

    await loginWithGoogle({ provider: 'google', providerUserId: 'g-1', idToken: 'id-token' });

    expect(session.getAccessToken()).toBe('at-1');
    expect(session.getRefreshToken()).toBe('rt-1');
  });

  it('logoutWeb envía el refresh token al backend y lo borra del navegador', async () => {
    session.setRefreshToken('rt-1');
    routeFetch({ '/auth/logout': () => jsonResponse({ code: 200, status: 'ok' }) });

    await logoutWeb();

    expect(bodyOf('/auth/logout')).toEqual({ refreshToken: 'rt-1' });
    expect(session.getRefreshToken()).toBeNull();
  });

  it('logoutWeb emite ejoi:session-expired', async () => {
    const onExpired = vi.fn();
    window.addEventListener('ejoi:session-expired', onExpired);
    routeFetch({ '/auth/logout': () => jsonResponse({ code: 200, status: 'ok' }) });

    await logoutWeb();

    expect(onExpired).toHaveBeenCalledTimes(1);
    window.removeEventListener('ejoi:session-expired', onExpired);
  });

  it('logoutWeb emite el evento y limpia tokens aunque /auth/logout falle', async () => {
    const onExpired = vi.fn();
    window.addEventListener('ejoi:session-expired', onExpired);
    session.setRefreshToken('rt-1');
    routeFetch({ '/auth/logout': () => jsonResponse({ message: 'boom' }, 500) });

    await expect(logoutWeb()).rejects.toThrow();

    expect(onExpired).toHaveBeenCalledTimes(1);
    expect(session.getRefreshToken()).toBeNull();
    window.removeEventListener('ejoi:session-expired', onExpired);
  });

  describe('resolvePostLoginPath sin /companion/me/creation en el backend', () => {
    it('va al chat si el usuario ya tiene compañero', async () => {
      routeFetch({ '/companion/me': () => jsonResponse({ id: 'c1', name: 'Luna' }) });

      await expect(resolvePostLoginPath()).resolves.toBe('/chat');
    });

    it('va al asistente de creación si el usuario no tiene compañero', async () => {
      routeFetch({ '/companion/me': emptyResponse });

      const path = await resolvePostLoginPath();

      expect(path).not.toBe('/chat');
      expect(path).toBe(resolvePostLoginWizardPath(null));
    });
  });
});
