import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { Suspense } from 'react';
import { createMemoryRouter, Outlet, RouterProvider, type InitialEntry } from 'react-router';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { ONBOARDING_STEPS } from '@/features/onboarding/constants/onboardingSteps';
import { INTEREST_OPTIONS } from '@/features/onboarding/data/interestOptions';
import { PERSONALITY_OPTIONS } from '@/features/onboarding/data/personalityOptions';

import { SessionRouting, WebSessionProvider } from '~/features/auth/useWebSession';
import { addAvatarVariant, clearAvatarSession } from '~/features/creation/avatarSession';
import '~/i18n';
import * as session from '~/platform/session';
import { routeConfig } from '~/routes';

vi.mock('~/platform/env', async (importOriginal) => ({
  ...(await importOriginal<typeof import('~/platform/env')>()),
  MOCK_API: false,
}));

vi.mock('~/features/creation/reviewAvatar', () => ({
  generateReviewAvatar: vi.fn(async () => addAvatarVariant({ url: 'https://x/p.png' })),
}));

function jsonResponse(status: number, body: unknown = {}) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json' },
  });
}

/** Mismas vistas que acepta eJoi-BE develop (`ONBOARDING_DRAFT_WEB_VIEWS`). */
const BE_WEB_VIEWS = ['quien', 'como', 'chat'];

type DraftBody = { data: { webView?: string } };

/** Simula eJoi-BE: PUT del borrador → 400 si `webView` no está en la lista. */
function stubBackend(webView: string, { putFails = false, creationNone = false } = {}) {
  const puts: DraftBody[] = [];
  const companionPosts: unknown[] = [];
  let draft: unknown = {
    schemaVersion: 1,
    step: ONBOARDING_STEPS.name,
    data: {
      gender: 'femenino',
      persona: PERSONALITY_OPTIONS[0],
      visualStyle: 'realista',
      intensity: 'balanced',
      interests: INTEREST_OPTIONS.slice(0, 3),
      companionName: 'Luna',
      webView,
    },
  };
  vi.stubGlobal(
    'fetch',
    vi.fn(async (url: string, init: RequestInit = {}) => {
      const path = String(url);
      const method = init.method ?? 'GET';
      if (path.endsWith('/auth/refresh')) {
        return jsonResponse(200, { accessToken: 'at', refreshToken: 'rt-1' });
      }
      if (path.endsWith('/users/me/onboarding-draft')) {
        if (method === 'GET') return jsonResponse(200, { draft });
        const body = JSON.parse(String(init.body)) as DraftBody;
        puts.push(body);
        if (putFails) return jsonResponse(503);
        if (body.data.webView && !BE_WEB_VIEWS.includes(body.data.webView)) {
          return jsonResponse(400, { message: ['data.webView must be one of the following values'] });
        }
        draft = body;
        return jsonResponse(200, { draft: body });
      }
      if (path.endsWith('/companion/me') && method === 'POST') {
        companionPosts.push(JSON.parse(String(init.body)));
        return jsonResponse(200);
      }
      if (path.endsWith('/companion/me/creation')) {
        // eJoi-BE responde `none` hasta que el POST toma el lock de creación.
        return creationNone ? jsonResponse(200, { state: 'none', steps: {} }) : jsonResponse(404);
      }
      return jsonResponse(200);
    }),
  );
  return { puts, companionPosts };
}

async function renderReview(entry: InitialEntry) {
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
    { initialEntries: [entry] },
  );
  render(
    <WebSessionProvider>
      <Suspense fallback={null}>
        <RouterProvider router={router} />
      </Suspense>
    </WebSessionProvider>,
  );
  await screen.findByTestId('create-review-page', {}, { timeout: 5000 });
  await waitFor(() => expect(session.getAccessToken()).toBe('at'));
  await act(async () => {});
  return router;
}

/** Con la casilla +18 la revisión muestra 2 checkboxes; sin ella, solo la legal. */
function consentCheckboxCount() {
  return screen.getByTestId('review-consent').querySelectorAll('input[type="checkbox"]').length;
}

describe('CreateReviewPage — confirmación +18', () => {
  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
    localStorage.clear();
    clearAvatarSession();
  });

  function setup(webView: string) {
    localStorage.setItem('ejoi_refresh_token', 'rt-1');
    stubBackend(webView);
  }

  it('con state adultConfirmed no muestra la casilla +18 aunque el borrador diga "como"', async () => {
    setup('como');
    await renderReview({ pathname: '/crear/revision', state: { adultConfirmed: true } });
    expect(consentCheckboxCount()).toBe(1);
  }, 10_000);

  it('recarga sin state y borrador "como" pide la casilla +18', async () => {
    setup('como');
    await renderReview('/crear/revision');
    expect(consentCheckboxCount()).toBe(2);
  }, 10_000);

  it('recarga sin state y borrador "revision" no pide la casilla +18', async () => {
    setup('revision');
    await renderReview('/crear/revision');
    expect(consentCheckboxCount()).toBe(1);
  }, 10_000);
});

describe('CreateReviewPage — crear', () => {
  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
    localStorage.clear();
    clearAvatarSession();
  });

  function setup(options?: Parameters<typeof stubBackend>[1]) {
    localStorage.setItem('ejoi_refresh_token', 'rt-1');
    return stubBackend('revision', options);
  }

  async function acceptAndGetCta() {
    fireEvent.click(screen.getByRole('checkbox'));
    const cta = screen.getByTestId('review-create-cta');
    await waitFor(() => expect(cta.hasAttribute('disabled')).toBe(false));
    return cta;
  }

  it('Crear compañera navega a /crear/creando y guarda el borrador como "chat"', async () => {
    const { puts, companionPosts } = setup();
    const router = await renderReview('/crear/revision');
    fireEvent.click(await acceptAndGetCta());

    await waitFor(() => expect(router.state.location.pathname).toBe('/crear/creando'));
    expect(puts.at(-1)?.data.webView).toBe('chat');
    await waitFor(() => expect(companionPosts).toHaveLength(1));
  }, 10_000);

  it('se queda en creando aunque el BE aún responda "none" justo tras el POST', async () => {
    setup({ creationNone: true });
    const router = await renderReview('/crear/revision');
    fireEvent.click(await acceptAndGetCta());

    await screen.findByTestId('create-creating-page', {}, { timeout: 5000 });
    await act(async () => {
      await new Promise((r) => setTimeout(r, 300));
    });
    expect(router.state.location.pathname).toBe('/crear/creando');
  }, 10_000);

  it('si el guardado falla muestra error y deja reintentar', async () => {
    setup({ putFails: true });
    const router = await renderReview('/crear/revision');
    fireEvent.click(await acceptAndGetCta());

    expect((await screen.findByRole('alert')).textContent).toContain('No pudimos crear');
    expect(router.state.location.pathname).toBe('/crear/revision');
    expect(screen.getByTestId('review-create-cta').hasAttribute('disabled')).toBe(false);
  }, 10_000);

  it('doble clic hace un solo POST /companion/me', async () => {
    const { companionPosts } = setup();
    const router = await renderReview('/crear/revision');
    const cta = await acceptAndGetCta();
    fireEvent.click(cta);
    fireEvent.click(cta);

    await waitFor(() => expect(router.state.location.pathname).toBe('/crear/creando'));
    await waitFor(() => expect(companionPosts).toHaveLength(1));
  }, 10_000);
});
