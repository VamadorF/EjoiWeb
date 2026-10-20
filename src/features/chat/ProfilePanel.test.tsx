import { cleanup, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { afterEach, describe, expect, it } from 'vitest';

import '~/i18n';

import { ProfilePanel } from './ProfilePanel';

describe('ProfilePanel', () => {
  afterEach(() => {
    cleanup();
  });

  it('muestra rasgos del perfil y cupo restante', () => {
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
          subscription={{ messagesRemaining: 12 }}
          showOnline
        />
      </MemoryRouter>,
    );

    expect(screen.getByText('Luna')).toBeTruthy();
    expect(screen.getByText('Amigable y empática')).toBeTruthy();
    expect(screen.getByText('Equilibrada')).toBeTruthy();
    expect(screen.getByText('Te quedan 12 mensajes')).toBeTruthy();
    expect(screen.getByRole('link', { name: 'Editar eJoi' }).getAttribute('href')).toBe('/chat/editar');
  });

  it('muestra mensaje de cupo agotado', () => {
    render(
      <MemoryRouter>
        <ProfilePanel profile={{ id: 'c1', name: 'Luna' }} subscription={{ messagesRemaining: 0 }} />
      </MemoryRouter>,
    );

    expect(screen.getByTestId('chat-quota').textContent).toContain('Usaste todos tus mensajes disponibles');
  });
});
