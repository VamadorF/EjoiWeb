import { beforeEach, describe, expect, it, vi } from 'vitest';

import {
  apiErrorCode,
  clearPending,
  dispatchPendingMessage,
  loadPending,
  pendingStorageKey,
  savePending,
} from './pendingMessage';
import { ApiError } from '~/platform/http';
import * as session from '~/platform/session';

vi.mock('~/platform/http', async (importOriginal) => {
  const actual = await importOriginal<typeof import('~/platform/http')>();
  return {
    ...actual,
    httpClient: {
      request: vi.fn(),
      get: vi.fn(),
    },
  };
});

vi.mock('@/features/chat/api/chat.api', () => ({
  getChatMessages: vi.fn().mockResolvedValue({ messages: [], hasMore: false }),
}));

const memoryStore = new Map<string, string>();

describe('pendingMessage', () => {
  beforeEach(() => {
    memoryStore.clear();
    vi.stubGlobal('localStorage', {
      getItem: (key: string) => memoryStore.get(key) ?? null,
      setItem: (key: string, value: string) => {
        memoryStore.set(key, value);
      },
      removeItem: (key: string) => {
        memoryStore.delete(key);
      },
      clear: () => memoryStore.clear(),
    });
    session.setSession('header.payload.sig', JSON.stringify({ userId: 'user-1' }));
  });

  it('persiste y recupera el pendiente por usuario', async () => {
    const msg = {
      clientMessageId: 'abc',
      text: 'Hola',
      createdAt: new Date().toISOString(),
    };
    await savePending('user-1', msg);
    expect(memoryStore.get(pendingStorageKey('user-1'))).toContain('Hola');
    expect(await loadPending('user-1')).toEqual(msg);
    await clearPending('user-1');
    expect(await loadPending('user-1')).toBeNull();
  });

  it('interpreta códigos de error del backend', () => {
    const err = new ApiError(409, 'Conflict', { code: 'DUPLICATE_MESSAGE' });
    expect(apiErrorCode(err)).toBe('DUPLICATE_MESSAGE');
  });

  it('dispatch DUPLICATE_MESSAGE limpia como enviado', async () => {
    const { httpClient } = await import('~/platform/http');
    vi.mocked(httpClient.request).mockRejectedValue(
      new ApiError(409, 'Conflict', { code: 'DUPLICATE_MESSAGE' }),
    );
    const result = await dispatchPendingMessage(
      { clientMessageId: 'id-1', text: 'Hola', createdAt: '' },
      'comp-1',
    );
    expect(result.outcome).toBe('duplicate');
  });
});
