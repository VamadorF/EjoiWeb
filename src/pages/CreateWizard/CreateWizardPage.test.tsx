import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { Suspense } from 'react';
import { createMemoryRouter, Outlet, RouterProvider } from 'react-router';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { ONBOARDING_STEPS } from '@/features/onboarding/constants/onboardingSteps';
import { INTEREST_OPTIONS } from '@/features/onboarding/data/interestOptions';
import { PERSONALITY_OPTIONS } from '@/features/onboarding/data/personalityOptions';

import { SessionRouting, WebSessionProvider } from '~/features/auth/useWebSession';
import '~/i18n';
import * as session from '~/platform/session';
import { routeConfig } from '~/routes';

vi.mock('~/platform/env', async (importOriginal) => ({
  ...(await importOriginal<typeof import('~/platform/env')>()),
  MOCK_API: false,
}));

// WebGL (ogl) no existe en jsdom.
vi.mock('./GenderWaves', () => ({ default: () => null }));

function jsonResponse(status: number, body: unknown = {}) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json' },
  });
}

/** Mismas vistas que acepta eJoi-BE develop (`ONBOARDING_DRAFT_WEB_VIEWS`). */
const BE_WEB_VIEWS = ['quien', 'como', 'chat'];

type DraftBody = { data: { webView?: string; companionName?: string } };

/** Simula eJoi-BE: PUT del borrador → 400 si `webView` no está en la lista. */
function stubBackend({ putFails = false } = {}) {
  const puts: DraftBody[] = [];
  let draft: unknown = {
    schemaVersion: 1,
    step: ONBOARDING_STEPS.name,
    data: {
      gender: 'femenino',
      persona: PERSONALITY_OPTIONS[0],
      visualStyle: 'realista',
      intensity: 'balanced',
      interests: INTEREST_OPTIONS.slice(0, 3),
      boundaries: [],
      webView: 'como',
    },
  };
  vi.stubGlobal(
    'fetch',
    vi.fn(async (url: string, init: RequestInit = {}) => {
      const path = String(url);
      if (path.endsWith('/auth/refresh')) {
        return jsonResponse(200, { accessToken: 'at', refreshToken: 'rt-1' });
      }
      if (path.endsWith('/users/me/onboarding-draft')) {
        if ((init.method ?? 'GET') === 'GET') return jsonResponse(200, { draft });
        const body = JSON.parse(String(init.body)) as DraftBody;
        puts.push(body);
        if (putFails) return jsonResponse(503);
        if (body.data.webView && !BE_WEB_VIEWS.includes(body.data.webView)) {
          return jsonResponse(400, { message: ['data.webView must be one of the following values'] });
        }
        draft = body;
        return jsonResponse(200, { draft: body });
      }
      if (path.endsWith('/companion/me/creation')) return jsonResponse(404);
      return jsonResponse(200);
    }),
  );
  return { puts };
}

async function renderWizard(path: string) {
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
    { initialEntries: [path] },
  );
  render(
    <WebSessionProvider>
      <Suspense fallback={null}>
        <RouterProvider router={router} />
      </Suspense>
    </WebSessionProvider>,
  );
  await screen.findByTestId('create-wizard', {}, { timeout: 5000 });
  await waitFor(() => expect(session.getAccessToken()).toBe('at'));
  await act(async () => {});
  return router;
}

async function fillNameStep() {
  const input = await screen.findByRole('textbox');
  fireEvent.change(input, { target: { value: 'Luna' } });
  fireEvent.click(screen.getByRole('checkbox'));
  const cta = screen.getByRole('button', { name: 'Crear' });
  await waitFor(() => expect(cta.hasAttribute('disabled')).toBe(false));
  return cta;
}

describe('CreateWizardPage — último paso', () => {
  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
    localStorage.clear();
  });

  function setup(options?: Parameters<typeof stubBackend>[0]) {
    localStorage.setItem('ejoi_refresh_token', 'rt-1');
    return stubBackend(options);
  }

  it('Crear lleva a revisión aunque el BE rechace webView "revision"', async () => {
    const { puts } = setup();
    const router = await renderWizard('/crear/paso-4/nombre');
    fireEvent.click(await fillNameStep());

    await waitFor(() => expect(router.state.location.pathname).toBe('/crear/revision'));
    expect(router.state.location.state).toEqual({ adultConfirmed: true });
    expect(puts.at(-1)?.data.companionName).toBe('Luna');
  }, 10_000);

  it('si el guardado falla del todo muestra error y deja reintentar', async () => {
    setup({ putFails: true });
    const router = await renderWizard('/crear/paso-4/nombre');
    fireEvent.click(await fillNameStep());

    expect((await screen.findByRole('alert')).textContent).toContain('No pudimos guardar tu progreso');
    expect(screen.getByRole('button', { name: 'Crear' }).hasAttribute('disabled')).toBe(false);
    expect(router.state.location.pathname).toBe('/crear/paso-4/nombre');
  }, 10_000);

  it('el error de guardado desaparece al volver a otro paso', async () => {
    setup({ putFails: true });
    const router = await renderWizard('/crear/paso-4/nombre');
    fireEvent.click(await fillNameStep());
    await screen.findByRole('alert');

    fireEvent.click(screen.getByRole('button', { name: 'Volver' }));

    await waitFor(() => expect(router.state.location.pathname).toBe('/crear/paso-3/intereses'));
    expect(screen.queryByRole('alert')).toBeNull();
  }, 10_000);

  it('doble clic en Crear hace un solo intento de guardado "revision"', async () => {
    const { puts } = setup();
    const router = await renderWizard('/crear/paso-4/nombre');
    const cta = await fillNameStep();
    fireEvent.click(cta);
    fireEvent.click(cta);

    await waitFor(() => expect(router.state.location.pathname).toBe('/crear/revision'));
    expect(puts.filter((p) => p.data.webView === 'revision')).toHaveLength(1);
  }, 10_000);

  it('intereses avanza aunque el PUT falle', async () => {
    setup({ putFails: true });
    const router = await renderWizard('/crear/paso-3/intereses');
    const next = screen.getByRole('button', { name: 'Siguiente' });
    await waitFor(() => expect(next.hasAttribute('disabled')).toBe(false));
    fireEvent.click(next);

    await waitFor(() => expect(router.state.location.pathname).toBe('/crear/paso-4/nombre'));
  }, 10_000);
});
