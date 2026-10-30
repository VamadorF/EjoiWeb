import { cleanup, render, screen } from '@testing-library/react';
import { Suspense } from 'react';
import { createMemoryRouter, RouterProvider } from 'react-router';
import { afterEach, describe, expect, it, vi } from 'vitest';

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

function renderEditRoute() {
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
}

describe('EditCompanionPage', () => {
  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
  });

  it('expone ruta propia /chat/editar sin onboarding', async () => {
    renderEditRoute();

    // La ruta es lazy: con la suite en paralelo cargarla tarda más que el 1 s por defecto.
    expect(await screen.findByTestId('edit-companion-page', {}, { timeout: 5000 })).toBeTruthy();
    expect(screen.getByRole('heading', { name: 'Editar eJoi' })).toBeTruthy();
    expect(screen.queryByText(/Paso 2 de 3/)).toBeNull();
  }, 10_000);

  it('no muestra un enlace "Editar eJoi" que apunte a la propia pantalla', async () => {
    renderEditRoute();

    expect(await screen.findByTestId('edit-companion-page', {}, { timeout: 5000 })).toBeTruthy();
    expect(await screen.findByRole('heading', { level: 2, name: 'Luna' })).toBeTruthy();
    expect(screen.queryByRole('link', { name: 'Editar eJoi' })).toBeNull();
  }, 10_000);
});
