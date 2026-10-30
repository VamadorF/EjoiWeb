import { cleanup, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { afterEach, describe, expect, it } from 'vitest';

import '~/i18n';

import { ThemeSettingsMenu } from './ThemeSettingsMenu';

describe('ThemeSettingsMenu', () => {
  afterEach(() => {
    cleanup();
  });

  it('marca "Editar eJoi" como página actual en /chat/editar', () => {
    render(
      <MemoryRouter initialEntries={['/chat/editar']}>
        <ThemeSettingsMenu />
      </MemoryRouter>,
    );

    const link = screen.getByRole('link', { name: 'Editar eJoi', hidden: true });
    expect(link.getAttribute('aria-current')).toBe('page');
    expect(link.className).toContain('home-side-menu__row--active');
  });

  it('en /chat navega a /chat/editar sin estado activo', () => {
    render(
      <MemoryRouter initialEntries={['/chat']}>
        <ThemeSettingsMenu />
      </MemoryRouter>,
    );

    const link = screen.getByRole('link', { name: 'Editar eJoi', hidden: true });
    expect(link.getAttribute('href')).toBe('/chat/editar');
    expect(link.getAttribute('aria-current')).toBeNull();
    expect(link.className).not.toContain('home-side-menu__row--active');
  });
});
