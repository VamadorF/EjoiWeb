import { render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { MemoryRouter } from 'react-router';

import '~/i18n';
import ChatPage from '~/pages/Chat/ChatPage';
import { ChatSessionProvider } from '~/features/chat/ChatSessionProvider';
import * as pendingModule from '~/features/chat/pendingMessage';
import * as creationStatus from '~/features/chat/useCreationStatus';

vi.mock('~/features/chat/useProfile', () => ({
  useProfile: () => ({
    data: {
      id: 'c1',
      name: 'Luna',
      gender: 'femenino',
      interests: ['Música'],
      boundaries: [],
      persona: 'Cálida',
      intensity: 'balanced',
    },
    isLoading: false,
    isError: false,
    refetch: vi.fn(),
  }),
}));

vi.mock('~/features/chat/useQuota', () => ({
  useQuota: () => ({ data: { messagesRemaining: 10 }, isLoading: false }),
  isQuotaExhausted: () => false,
}));

vi.mock('@tanstack/react-query', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@tanstack/react-query')>();
  return {
    ...actual,
    useInfiniteQuery: () => ({
      data: { pages: [{ messages: [], hasMore: false }] },
      hasNextPage: false,
      isFetchingNextPage: false,
      fetchNextPage: vi.fn(),
      refetch: vi.fn(),
    }),
  };
});

const memoryStore = new Map<string, string>();

function renderChat() {
  return render(
    <MemoryRouter>
      <ChatSessionProvider>
        <ChatPage />
      </ChatSessionProvider>
    </MemoryRouter>,
  );
}

describe('chat conversación', () => {
  beforeEach(() => {
    memoryStore.clear();
    vi.spyOn(pendingModule, 'resolveUserIdFromSession').mockReturnValue('user-1');
    vi.spyOn(pendingModule, 'loadPending').mockResolvedValue(null);
    vi.spyOn(creationStatus, 'useCreationStatus').mockReturnValue({
      status: {
        state: 'ready',
        firstMessage: {
          id: 'fm1',
          content: 'Hola desde Luna',
          meta: { basedOnInterests: ['Música'] },
        },
      },
      state: 'ready',
      steps: {},
      profile: { id: 'c1', name: 'Luna' },
      firstMessage: {
        id: 'fm1',
        content: 'Hola desde Luna',
        meta: { basedOnInterests: ['Música'] },
      },
      isCreating: false,
      settled: true,
      pollError: null,
    });
  });

  it('muestra icebreakers cuando aún no hay mensajes del usuario', () => {
    renderChat();
    expect(screen.getByTestId('chat-icebreakers')).toBeTruthy();
  });

  it('muestra reintentar cuando hay pendiente fallido en storage', async () => {
    const pending = {
      clientMessageId: 'client-1',
      text: 'Sigo aquí',
      createdAt: new Date().toISOString(),
    };
    vi.spyOn(pendingModule, 'loadPending').mockResolvedValue(pending);

    renderChat();
    await waitFor(() => expect(screen.getByText('Sigo aquí')).toBeTruthy());
    expect(screen.getByRole('button', { name: /Reintentar/i })).toBeTruthy();
  });
});
