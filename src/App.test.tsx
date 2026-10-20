import { render, screen } from '@testing-library/react';
import { Suspense } from 'react';
import { createMemoryRouter, RouterProvider } from 'react-router';
import { describe, expect, it } from 'vitest';

import { routeConfig } from './routes';
import { applyCssVars } from '~/theme/cssVars';

describe('App shell', () => {
  it('renderiza DesktopShell en /crear/quien', async () => {
    applyCssVars();
    const router = createMemoryRouter(routeConfig, { initialEntries: ['/crear/quien'] });
    render(
      <Suspense fallback={null}>
        <RouterProvider router={router} />
      </Suspense>,
    );
    expect(await screen.findByTestId('shell-header')).toBeTruthy();
    expect(screen.getByTestId('shell-preview')).toBeTruthy();
    expect(screen.getByTestId('shell-footer')).toBeTruthy();
  });
});
