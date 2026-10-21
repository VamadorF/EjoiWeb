import { render, screen } from '@testing-library/react';
import { Suspense } from 'react';
import { createMemoryRouter, RouterProvider } from 'react-router';
import { describe, expect, it, vi } from 'vitest';

import { WebSessionProvider } from '~/features/auth/useWebSession';
import { routeConfig } from './routes';
import { applyCssVars } from '~/theme/cssVars';

describe('App shell', () => {
  it('renderiza DesktopShell en /crear/paso-1/genero', async () => {
    applyCssVars();
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('no session')));
    const router = createMemoryRouter(routeConfig, { initialEntries: ['/crear/paso-1/genero'] });
    render(
      <WebSessionProvider>
        <Suspense fallback={null}>
          <RouterProvider router={router} />
        </Suspense>
      </WebSessionProvider>,
    );
    // La ruta es lazy: con la suite en paralelo cargarla tarda más que el 1 s por defecto.
    expect(await screen.findByTestId('shell-header', {}, { timeout: 5000 })).toBeTruthy();
    expect(screen.getByTestId('shell-footer')).toBeTruthy();
    expect(screen.queryByTestId('shell-preview')).toBeNull();
    vi.unstubAllGlobals();
  }, 10_000);
});
