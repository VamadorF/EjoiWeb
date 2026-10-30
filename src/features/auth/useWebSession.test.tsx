import { act, cleanup, render, screen } from '@testing-library/react';
import { createMemoryRouter, Outlet, RouterProvider } from 'react-router';
import { afterEach, describe, expect, it, vi } from 'vitest';

import * as session from '~/platform/session';

import { SessionRouting, useWebSession, WebSessionProvider } from './useWebSession';

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
    session.clearSession();
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

  it('un reload con access token guardado no se considera anónimo', async () => {
    session.clearSession();
    localStorage.setItem('ejoi_access_token', 'at-stored');
    localStorage.setItem('ejoi_user_data', '{"id":"u1","email":"a@b.c","name":"Ana"}');
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => jsonResponse(403, { code: 'CSRF_REJECTED' })),
    );

    function BootProbe() {
      const { boot, isAuthenticated } = useWebSession();
      return <p>{`${boot}:${isAuthenticated ? 'auth' : 'anon'}`}</p>;
    }

    const router = createMemoryRouter(
      [
        {
          element: (
            <>
              <BootProbe />
              <SessionRouting />
              <Outlet />
            </>
          ),
          children: [
            { path: '/', element: <p>bienvenida</p> },
            { path: '/chat', element: <p>chat</p> },
          ],
        },
      ],
      { initialEntries: ['/chat'] },
    );
    render(
      <WebSessionProvider>
        <RouterProvider router={router} />
      </WebSessionProvider>,
    );

    expect(await screen.findByText('ready:auth')).toBeTruthy();
    expect(router.state.location.pathname).toBe('/chat');
    expect(screen.queryByText('bienvenida')).toBeNull();
    expect(session.getAccessToken()).toBe('at-stored');
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
