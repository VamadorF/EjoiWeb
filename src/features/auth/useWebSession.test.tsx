import { act, cleanup, render, screen } from '@testing-library/react';
import { createMemoryRouter, Outlet, RouterProvider } from 'react-router';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { SessionRouting, WebSessionProvider } from './useWebSession';

function jsonResponse(status: number, body: unknown) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json' },
  });
}

function renderAtPrivateRoute() {
  vi.stubGlobal(
    'fetch',
    vi.fn(async (url: string) =>
      String(url).endsWith('/auth/refresh')
        ? jsonResponse(200, { accessToken: 'at', refreshToken: 'rt-1' })
        : jsonResponse(404, {}),
    ),
  );
  const router = createMemoryRouter(
    [
      {
        element: (
          <>
            <SessionRouting />
            <Outlet />
          </>
        ),
        children: [
          { path: '/', element: <p>bienvenida</p> },
          { path: '/privada', element: <p>privada</p> },
        ],
      },
    ],
    { initialEntries: ['/privada'] },
  );
  render(
    <WebSessionProvider>
      <RouterProvider router={router} />
    </WebSessionProvider>,
  );
  return router;
}

describe('WebSessionProvider + SessionRouting', () => {
  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
    localStorage.clear();
  });

  it('redirige a / al recibir ejoi:session-expired', async () => {
    const router = renderAtPrivateRoute();
    expect(await screen.findByText('privada')).toBeTruthy();

    act(() => {
      window.dispatchEvent(new CustomEvent('ejoi:session-expired'));
    });

    expect(await screen.findByText('bienvenida')).toBeTruthy();
    expect(router.state.location.pathname).toBe('/');
  });

  it('con la sesión cerrada, / no resuelve la ruta post-login', async () => {
    renderAtPrivateRoute();
    expect(await screen.findByText('privada')).toBeTruthy();

    act(() => {
      window.dispatchEvent(new CustomEvent('ejoi:session-expired'));
    });
    expect(await screen.findByText('bienvenida')).toBeTruthy();

    const calls = vi.mocked(fetch).mock.calls.map(([url]) => String(url));
    expect(calls.some((u) => u.includes('/companion/me'))).toBe(false);
  });
});
