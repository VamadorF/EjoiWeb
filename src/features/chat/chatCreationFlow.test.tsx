import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { MemoryRouter } from 'react-router';

import '~/i18n';
import ChatPage from '~/pages/Chat/ChatPage';
import * as pendingModule from '~/features/chat/pendingMessage';
import * as creationStatus from '~/features/chat/useCreationStatus';

vi.mock('~/features/chat/usePortraitGeneration', () => ({
  usePortraitGeneration: () => ({
    state: 'idle',
    avatarUrl: null,
    portraitPending: true,
    retry: vi.fn(),
  }),
}));

vi.mock('~/features/creation/onboardingDraft.api', () => ({
  emptyOnboardingData: () => ({
    visualStyle: 'realista',
    gender: 'femenino',
    persona: '',
    tone: '',
    interactionStyle: '',
    conversationDepth: '',
    interests: ['Música', 'Arte y cultura', 'Viajes'],
    boundaries: [],
    companionName: 'Luna',
  }),
  getOnboardingDraftRecord: vi.fn().mockResolvedValue({
    schemaVersion: 1,
    step: 14,
    data: {
      webView: 'chat',
      visualStyle: 'realista',
      gender: 'femenino',
      interests: ['Música', 'Arte y cultura', 'Viajes'],
      companionName: 'Luna',
    },
    updatedAt: new Date().toISOString(),
  }),
  mergeDraftIntoData: (base: unknown, patch: Record<string, unknown>) => ({ ...(base as object), ...patch }),
}));

const memoryStore = new Map<string, string>();

describe('chat creation flow', () => {
  beforeEach(() => {
    memoryStore.clear();
    vi.stubGlobal('localStorage', {
      getItem: (key: string) => memoryStore.get(key) ?? null,
      setItem: (key: string, value: string) => {
        memoryStore.set(key, value);
      },
      removeItem: (key: string) => memoryStore.delete(key),
      clear: () => memoryStore.clear(),
    });
    vi.spyOn(pendingModule, 'resolveUserIdFromSession').mockReturnValue('user-1');
    vi.spyOn(pendingModule, 'loadPending').mockResolvedValue(null);
    vi.spyOn(pendingModule, 'savePending').mockImplementation(async (_uid, msg) => {
      memoryStore.set('ejoi.pending.user-1', JSON.stringify(msg));
    });
  });

  it('permite escribir antes de que la creación esté lista', async () => {
    vi.spyOn(creationStatus, 'useCreationStatus').mockReturnValue({
      status: { state: 'creating', steps: { personality: true } },
      state: 'creating',
      steps: { personality: true },
      profile: { name: 'Luna' },
      firstMessage: undefined,
      isCreating: true,
      pollError: null,
    });

    render(
      <MemoryRouter>
        <ChatPage />
      </MemoryRouter>,
    );

    expect(screen.getByTestId('chat-creating-panel')).toBeTruthy();
    const user = userEvent.setup();
    await user.type(screen.getByRole('textbox'), 'Hola Luna');
    await user.click(screen.getByRole('button', { name: 'Enviar' }));

    await waitFor(() => {
      expect(screen.getByText('Hola Luna')).toBeTruthy();
      expect(screen.getByText('Pendiente')).toBeTruthy();
    });
  });

  it('conserva el pendiente al pasar de error a creando y listo', async () => {
    const pending = {
      clientMessageId: 'client-1',
      text: 'Sigo aquí',
      createdAt: new Date().toISOString(),
    };
    memoryStore.set('ejoi.pending.user-1', JSON.stringify(pending));
    vi.spyOn(pendingModule, 'loadPending').mockResolvedValue(pending);

    let phase: 'error' | 'creating' | 'ready' = 'error';
    vi.spyOn(creationStatus, 'useCreationStatus').mockImplementation(() => {
      if (phase === 'error') {
        return {
          status: { state: 'error', error: { code: 'FAIL' }, steps: {} },
          state: 'error',
          steps: {},
          profile: { name: 'Luna' },
          firstMessage: undefined,
          isCreating: false,
          pollError: null,
        };
      }
      if (phase === 'creating') {
        return {
          status: { state: 'creating', steps: { personality: true } },
          state: 'creating',
          steps: { personality: true },
          profile: { name: 'Luna' },
          firstMessage: undefined,
          isCreating: true,
          pollError: null,
        };
      }
      return {
        status: {
          state: 'ready',
          steps: { personality: true, greeting: true, portrait: true },
          firstMessage: { id: 'm1', content: 'Hola, soy Luna' },
        },
        state: 'ready',
        steps: { personality: true, greeting: true, portrait: true },
        profile: { name: 'Luna' },
        firstMessage: { id: 'm1', content: 'Hola, soy Luna' },
        isCreating: false,
        pollError: null,
      };
    });

    const { rerender } = render(
      <MemoryRouter>
        <ChatPage />
      </MemoryRouter>,
    );

    await waitFor(() => expect(screen.getByText('Sigo aquí')).toBeTruthy());
    expect(screen.getByTestId('chat-error-banner')).toBeTruthy();

    phase = 'creating';
    rerender(
      <MemoryRouter>
        <ChatPage />
      </MemoryRouter>,
    );
    expect(screen.getByText('Sigo aquí')).toBeTruthy();

    phase = 'ready';
    rerender(
      <MemoryRouter>
        <ChatPage />
      </MemoryRouter>,
    );
    expect(screen.getByText('Sigo aquí')).toBeTruthy();
    expect(screen.getByText('Hola, soy Luna')).toBeTruthy();
  });
});
