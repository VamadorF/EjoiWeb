import { render, screen } from '@testing-library/react';
import { Suspense } from 'react';
import { createMemoryRouter, RouterProvider } from 'react-router';
import { describe, expect, it, vi } from 'vitest';

import '~/i18n';
import { routeConfig } from '~/routes';

vi.mock('~/features/chat/useProfile', () => ({
  fetchCompanionProfile: vi.fn().mockResolvedValue({
    id: 'c1',
    name: 'Luna',
    visualStyle: 'realista',
    gender: 'femenino',
    persona: 'Cálida',
    intensity: 'balanced',
    interests: ['Música'],
    boundaries: [],
    voiceKey: 'NORAH',
  }),
  invalidateCompanionProfile: vi.fn(),
  companionProfileQueryKey: ['companion', 'me', 'profile'],
  useProfile: vi.fn(),
}));

describe('EditCompanionPage', () => {
  it('expone ruta propia /chat/editar sin onboarding', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockImplementation((url: string) => {
        if (url.includes('/companion/me/profile')) {
          return Promise.resolve({
            ok: true,
            json: async () => ({
              id: 'c1',
              name: 'Luna',
              visualStyle: 'realista',
              gender: 'femenino',
              persona: 'Cálida',
              intensity: 'balanced',
              interests: ['Música'],
              boundaries: [],
            }),
          });
        }
        return Promise.reject(new Error('unexpected'));
      }),
    );

    const router = createMemoryRouter(routeConfig, { initialEntries: ['/chat/editar'] });
    render(
      <Suspense fallback={null}>
        <RouterProvider router={router} />
      </Suspense>,
    );

    expect(await screen.findByTestId('edit-companion-page')).toBeTruthy();
    expect(screen.getByRole('heading', { name: 'Editar eJoi' })).toBeTruthy();
    expect(screen.queryByText(/Paso 2 de 3/)).toBeNull();

    vi.unstubAllGlobals();
  });
});
