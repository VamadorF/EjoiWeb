import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { Suspense } from 'react';
import { createMemoryRouter, Outlet, RouterProvider } from 'react-router';
import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest';

import { SessionRouting, WebSessionProvider } from '~/features/auth/useWebSession';
import * as session from '~/platform/session';
import { routeConfig } from '~/routes';

vi.mock('~/platform/env', async (importOriginal) => ({
  ...(await importOriginal<typeof import('~/platform/env')>()),
  MOCK_API: false,
}));

function jsonResponse(status: number, body: unknown = {}) {
  return new Response(status === 204 ? null : JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json' },
  });
}

/** Simula eJoi-BE: DELETE /auth/account revoca todos los refresh tokens. */
function stubBackend({ deleteStatus = 204, logoutStatus = 200 } = {}) {
  let deleted = false;
  vi.stubGlobal(
    'fetch',
    vi.fn(async (url: string, init: RequestInit = {}) => {
      const path = String(url);
      const hasAuth = Boolean((init.headers as Record<string, string> | undefined)?.Authorization);
      if (path.endsWith('/auth/refresh')) {
        return deleted ? jsonResponse(401) : jsonResponse(200, { accessToken: 'at', refreshToken: 'rt-1' });
      }
      if (path.endsWith('/auth/account')) {
        if (deleteStatus === 204) deleted = true;
        return jsonResponse(deleteStatus);
      }
      if (path.endsWith('/auth/logout')) return jsonResponse(logoutStatus);
      if (path.endsWith('/companion/me/creation')) return jsonResponse(404);
      return hasAuth ? jsonResponse(200) : jsonResponse(401);
    }),
  );
}

async function renderAndConfirmDelete() {
  const router = createMemoryRouter(
    [
      {
        element: (
          <>
            <SessionRouting />
            <Outlet />
          </>
        ),
        children: routeConfig,
      },
    ],
    { initialEntries: ['/cuenta'] },
  );
  render(
    <WebSessionProvider>
      <Suspense fallback={null}>
        <RouterProvider router={router} />
      </Suspense>
    </WebSessionProvider>,
  );
  await screen.findByTestId('account-page', {}, { timeout: 5000 });
  // Esperar a que el boot de sesión termine (token en memoria) antes de borrar.
  await waitFor(() => expect(session.getAccessToken()).toBe('at'));
  await act(async () => {});
  const confirm = screen.getByTestId('delete-account-dialog').querySelectorAll('button')[1];
  fireEvent.click(confirm);
  return router;
}

describe('AccountPage — eliminar cuenta', () => {
  beforeAll(() => {
    HTMLDialogElement.prototype.showModal ??= function (this: HTMLDialogElement) {
      this.open = true;
    };
    HTMLDialogElement.prototype.close ??= function (this: HTMLDialogElement) {
      this.open = false;
    };
  });

  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
    localStorage.clear();
  });

  function setup(options?: Parameters<typeof stubBackend>[0]) {
    localStorage.setItem('ejoi_refresh_token', 'rt-1');
    stubBackend(options);
    vi.spyOn(window, 'alert').mockImplementation(() => {});
  }

  it('al eliminar la cuenta cierra sesión y vuelve a /', async () => {
    setup();
    const router = await renderAndConfirmDelete();

    await waitFor(() => expect(router.state.location.pathname).toBe('/'));
    expect(localStorage.getItem('ejoi_refresh_token')).toBeNull();
    expect(window.alert).not.toHaveBeenCalled();
  }, 10_000);

  it('si /auth/logout falla tras borrar, igual vuelve a / sin alert', async () => {
    setup({ logoutStatus: 500 });
    const router = await renderAndConfirmDelete();

    await waitFor(() => expect(router.state.location.pathname).toBe('/'));
    expect(window.alert).not.toHaveBeenCalled();
  }, 10_000);

  it('al volver atrás tras borrar no entra a /cuenta', async () => {
    setup();
    const router = await renderAndConfirmDelete();
    // La bienvenida es lazy: el usuario la ve antes de poder volver atrás.
    await screen.findByTestId('page-bienvenida', {}, { timeout: 5000 });

    await act(() => router.navigate('/cuenta'));

    await waitFor(() => expect(router.state.location.pathname).toBe('/'));
  }, 10_000);

  it('si DELETE falla, muestra error y sigue en /cuenta con la sesión', async () => {
    setup({ deleteStatus: 500 });
    const router = await renderAndConfirmDelete();

    await waitFor(() => expect(window.alert).toHaveBeenCalledTimes(1));
    expect(router.state.location.pathname).toBe('/cuenta');
    expect(localStorage.getItem('ejoi_refresh_token')).toBe('rt-1');
  }, 10_000);
});
