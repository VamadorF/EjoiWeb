import { cleanup, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { afterEach, describe, expect, it } from 'vitest';

import '~/i18n';

import { ProfilePanel } from './ProfilePanel';

describe('ProfilePanel', () => {
  afterEach(() => {
    cleanup();
  });

  it('muestra rasgos del perfil sin cupo en el panel', () => {
    render(
      <MemoryRouter>
        <ProfilePanel
          profile={{
            id: 'c1',
            name: 'Luna',
            persona: 'Amigable y empática',
            intensity: 'balanced',
            interests: ['Música'],
            boundaries: ['Política'],
            visualStyle: 'realista',
            gender: 'femenino',
          }}
          showOnline
        />
      </MemoryRouter>,
    );

    expect(screen.getByText('Luna')).toBeTruthy();
    expect(screen.getByText('Amigable y empática')).toBeTruthy();
    expect(screen.getByText('Equilibrada')).toBeTruthy();
    expect(screen.queryByTestId('chat-quota')).toBeNull();
    expect(screen.getByRole('link', { name: 'Editar eJoi' }).getAttribute('href')).toBe('/chat/editar');
  });
});
