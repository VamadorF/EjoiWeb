import { render, screen } from '@testing-library/react';
import { Suspense } from 'react';
import { createMemoryRouter, RouterProvider } from 'react-router';
import { describe, expect, it, vi } from 'vitest';

import { WebSessionProvider } from '~/features/auth/useWebSession';
import { routeConfig } from './routes';
import { applyCssVars } from '~/theme/cssVars';

describe('App shell', () => {
  it('renderiza DesktopShell en /crear/paso-1', async () => {
    applyCssVars();
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('no session')));
    const router = createMemoryRouter(routeConfig, { initialEntries: ['/crear/paso-1'] });
    render(
      <WebSessionProvider>
        <Suspense fallback={null}>
          <RouterProvider router={router} />
        </Suspense>
      </WebSessionProvider>,
    );
    expect(await screen.findByTestId('shell-header')).toBeTruthy();
    expect(screen.getByTestId('shell-preview')).toBeTruthy();
    expect(screen.getByTestId('shell-footer')).toBeTruthy();
    vi.unstubAllGlobals();
  });
});
