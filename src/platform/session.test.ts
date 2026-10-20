import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import * as session from './session';

describe('session.refresh', () => {
  beforeEach(() => {
    session.clearSession();
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
});
