import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
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

function sentBody(call: unknown[]): unknown {
  const init = call[1] as RequestInit | undefined;
  return init?.body ? JSON.parse(init.body as string) : undefined;
}

describe('session.refresh', () => {
  beforeEach(() => {
    session.clearSession();
    localStorage.clear();
    vi.stubGlobal('fetch', vi.fn());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('serializa dos refresh simultáneos en una sola llamada de red', async () => {
    const fetchMock = vi.mocked(fetch);
    fetchMock.mockImplementation(
      () =>
        new Promise((resolve) => {
          setTimeout(
            () =>
              resolve(
                new Response(JSON.stringify({ access_token: 'tok-1' }), { status: 200 }),
              ),
            20,
          );
        }),
    );

    const [a, b] = await Promise.all([session.refresh(), session.refresh()]);
    expect(a).toBe('tok-1');
    expect(b).toBe('tok-1');
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('envía el refresh token guardado y guarda el rotado que devuelve el backend', async () => {
    session.setRefreshToken('rt-old');
    const fetchMock = vi.mocked(fetch);
    fetchMock.mockResolvedValue(jsonResponse({ access_token: 'at-new', refresh_token: 'rt-new' }));

    await expect(session.refresh()).resolves.toBe('at-new');

    expect(sentBody(fetchMock.mock.calls[0])).toEqual({ refreshToken: 'rt-old' });
    expect(session.getRefreshToken()).toBe('rt-new');
  });

  it('usa el refresh token más reciente aunque otra pestaña lo haya rotado', async () => {
    session.setRefreshToken('rt-tab-a');
    localStorage.setItem('ejoi_refresh_token', 'rt-rotated-by-tab-b');
    const fetchMock = vi.mocked(fetch);
    fetchMock.mockResolvedValue(jsonResponse({ access_token: 'at-new', refresh_token: 'rt-next' }));

    await session.refresh();

    expect(sentBody(fetchMock.mock.calls[0])).toEqual({ refreshToken: 'rt-rotated-by-tab-b' });
  });

  it('borra el refresh token cuando el backend lo rechaza', async () => {
    session.setRefreshToken('rt-revoked');
    vi.mocked(fetch).mockResolvedValue(jsonResponse({ message: 'Invalid refresh token' }, 401));

    await expect(session.refresh()).rejects.toThrow();

    expect(session.getRefreshToken()).toBeNull();
  });

  it('conserva el refresh token si falla la red', async () => {
    session.setRefreshToken('rt-keep');
    vi.mocked(fetch).mockRejectedValue(new TypeError('Failed to fetch'));

    await expect(session.refresh()).rejects.toThrow();

    expect(session.getRefreshToken()).toBe('rt-keep');
  });
});
