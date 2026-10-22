import { act, cleanup, render, screen, waitFor } from '@testing-library/react';
import { Suspense } from 'react';
import { createMemoryRouter, Outlet, RouterProvider, type InitialEntry } from 'react-router';
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

vi.mock('~/features/creation/reviewAvatar', () => ({
  generateReviewAvatar: vi.fn(async () => ({ url: 'https://x/p.png' })),
}));

function jsonResponse(status: number, body: unknown = {}) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json' },
  });
}

function stubBackend(webView: string) {
  const draft = {
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
    vi.fn(async (url: string) => {
      const path = String(url);
      if (path.endsWith('/auth/refresh')) {
        return jsonResponse(200, { accessToken: 'at', refreshToken: 'rt-1' });
      }
      if (path.endsWith('/users/me/onboarding-draft')) return jsonResponse(200, { draft });
      if (path.endsWith('/companion/me/creation')) return jsonResponse(404);
      return jsonResponse(200);
    }),
  );
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
