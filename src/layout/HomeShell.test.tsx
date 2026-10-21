import { render } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { afterEach, describe, expect, it, vi } from 'vitest';

import HomeRouteLayout from './HomeShell';

describe('HomeRouteLayout', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('renderiza sin depender de un QueryClientProvider externo', () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('sin red')));

    expect(() =>
      render(
        <MemoryRouter initialEntries={['/chat']}>
          <HomeRouteLayout />
        </MemoryRouter>,
      ),
    ).not.toThrow();
  });
});
