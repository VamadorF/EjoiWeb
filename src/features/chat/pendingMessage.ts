import {
  fromSendMessageResponse,
  type RawSendMessageResponse,
  type SendMessageResult,
  toSendMessageDto,
} from '@/features/chat/adapters/chat.adapter';
import { getChatMessages } from '@/features/chat/api/chat.api';
import { CHAT_MESSAGE_TIMEOUT_MS } from '@/features/chat/constants';

import { decodeJwtPayload } from '~/features/auth/decodeJwtPayload';
import { ApiError, httpClient } from '~/platform/http';
import * as session from '~/platform/session';
import { kvGetJSON, kvRemoveItem, kvSetJSON } from '~/platform/keyValue';

export type PendingMessage = {
  clientMessageId: string;
  text: string;
  createdAt: string;
};

export function pendingStorageKey(userId: string): string {
  return `ejoi.pending.${userId}`;
}

export function resolveUserIdFromSession(): string | null {
  const token = session.getAccessToken();
  if (!token) return null;
  const payload = decodeJwtPayload(token);
  const raw = payload?.userId ?? payload?.sub;
  return typeof raw === 'string' && raw.length > 0 ? raw : null;
}

export async function loadPending(userId: string): Promise<PendingMessage | null> {
  return kvGetJSON<PendingMessage>(pendingStorageKey(userId));
}

export async function savePending(userId: string, message: PendingMessage): Promise<void> {
  await kvSetJSON(pendingStorageKey(userId), message);
}

export async function clearPending(userId: string): Promise<void> {
  await kvRemoveItem(pendingStorageKey(userId));
}

export function apiErrorCode(error: unknown): string | undefined {
  if (!(error instanceof ApiError) || !error.data || typeof error.data !== 'object') {
    return undefined;
  }
  const record = error.data as Record<string, unknown>;
  if (typeof record.code === 'string') return record.code;
  const nested = record.response;
  if (nested && typeof nested === 'object' && typeof (nested as Record<string, unknown>).code === 'string') {
    return (nested as Record<string, string>).code;
  }
  return undefined;
}

export async function sendMessageWithClientId(input: {
  message: string;
  clientMessageId: string;
  companionId?: string;
}): Promise<SendMessageResult> {
  const dto = {
    ...toSendMessageDto({ message: input.message, companionId: input.companionId }),
    clientMessageId: input.clientMessageId,
  };
  const response = await httpClient.request<RawSendMessageResponse>('/chat/message', {
    method: 'POST',
    body: dto,
    timeoutMs: CHAT_MESSAGE_TIMEOUT_MS,
    suppressFatalBoundary: true,
  });
  return fromSendMessageResponse(response.data, input.companionId ?? 'default');
}

export type DispatchPendingResult =
  | { outcome: 'sent' }
  | { outcome: 'duplicate' }
  | { outcome: 'not_ready' }
  | { outcome: 'failed'; error: unknown };

export async function dispatchPendingMessage(
  pending: PendingMessage,
  companionId?: string,
): Promise<DispatchPendingResult> {
  try {
    await sendMessageWithClientId({
      message: pending.text,
      clientMessageId: pending.clientMessageId,
      companionId,
    });
    return { outcome: 'sent' };
  } catch (error) {
    const code = apiErrorCode(error);
    if (code === 'DUPLICATE_MESSAGE') {
      await getChatMessages({ companionId, limit: 50 }).catch(() => undefined);
      return { outcome: 'duplicate' };
    }
    if (code === 'COMPANION_NOT_READY') {
      return { outcome: 'not_ready' };
    }
    return { outcome: 'failed', error };
  }
}
