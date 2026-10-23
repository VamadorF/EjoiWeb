import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { MemoryRouter } from 'react-router';

import '~/i18n';
import ChatPage from '~/pages/Chat/ChatPage';
import { ChatSessionProvider } from '~/features/chat/ChatSessionProvider';
import * as pendingModule from '~/features/chat/pendingMessage';
import * as creationStatus from '~/features/chat/useCreationStatus';
import { queryKeys } from '@/shared/lib/queryKeys';

const invalidateQueries = vi.fn();
let historyPage: { messages: unknown[]; hasMore: boolean } = { messages: [], hasMore: false };

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

vi.mock('~/features/chat/useQuota', async (importOriginal) => ({
  ...(await importOriginal<typeof import('~/features/chat/useQuota')>()),
  useQuota: () => ({ data: { messagesRemaining: 10 }, isLoading: false }),
}));

vi.mock('@tanstack/react-query', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@tanstack/react-query')>();
  return {
    ...actual,
    useInfiniteQuery: () => ({
      data: { pages: [historyPage] },
      hasNextPage: false,
      isFetchingNextPage: false,
      fetchNextPage: vi.fn(),
      refetch: vi.fn(),
    }),
    useQueryClient: () => ({ invalidateQueries }),
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
  afterEach(cleanup);

  beforeEach(() => {
    memoryStore.clear();
    invalidateQueries.mockClear();
    historyPage = { messages: [], hasMore: false };
    vi.spyOn(pendingModule, 'clearPending').mockResolvedValue();
    vi.spyOn(pendingModule, 'savePending').mockResolvedValue();
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

  it('mantiene el intro al inicio con historial existente', () => {
    const msg = (id: string, role: string, message: string, createdAt: string) => ({
      id,
      companionId: 'c1',
      role,
      message,
      createdAt,
    });
    historyPage = {
      messages: [
        msg('fm1', 'assistant', 'Hola desde Luna', '2026-10-23T10:00:00.000Z'),
        msg('u1', 'user', 'Hola Luna', '2026-10-23T10:05:00.000Z'),
        msg('a1', 'assistant', 'Cuéntame más', '2026-10-23T10:06:00.000Z'),
      ],
      hasMore: false,
    };

    renderChat();

    const list = screen.getByTestId('chat-messages');
    const texts = [...list.querySelectorAll('.bubble--ai p, .bubble--user p')].map((p) => p.textContent);
    expect(texts).toEqual(['Hola desde Luna', 'Hola Luna', 'Cuéntame más']);
    expect(within(list).getAllByText('Hola desde Luna')).toHaveLength(1);
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

  async function sendText(text: string) {
    renderChat();
    const composer = screen.getByTestId('chat-composer');
    fireEvent.change(within(composer).getByRole('textbox'), { target: { value: text } });
    fireEvent.submit(composer);
  }

  it('refresca el cupo tras enviar un mensaje', async () => {
    const send = vi.spyOn(pendingModule, 'sendMessageWithClientId').mockResolvedValue({} as never);

    await sendText('Hola Luna');

    await waitFor(() => expect(send).toHaveBeenCalled());

    await waitFor(() =>
      expect(invalidateQueries).toHaveBeenCalledWith({ queryKey: queryKeys.subscription.me }),
    );
  });

  it('refresca el cupo si el envío falla (p. ej. cupo agotado en el BE)', async () => {
    vi.spyOn(pendingModule, 'sendMessageWithClientId').mockRejectedValue(new Error('402'));

    await sendText('Hola Luna');

    await waitFor(() =>
      expect(invalidateQueries).toHaveBeenCalledWith({ queryKey: queryKeys.subscription.me }),
    );
  });
});
