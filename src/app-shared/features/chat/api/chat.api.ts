// AUTO-SINCRONIZADO desde ejoiFE 9234854dc9f9992b39b7f61dfb0e02b768be467d@9234854dc9f9992b39b7f61dfb0e02b768be467d:src/features/chat/api/chat.api.ts. No editar: npm run sync:app
/**
 * Servicio de API para Chat
 * Funciones puras para llamadas al backend NestJS
 *
 * Contrato adjuntos: `src/features/chat/BACKEND_CHAT_MEDIA_CONTRACT.ts`
 * Contrato prefs de proactividad: `src/features/chat/BACKEND_PROACTIVITY_PREFS_CONTRACT.ts`
 */

import { ApiError, httpClient } from '@/shared/services/http/client';
import { CHAT_MESSAGE_MAX_ATTEMPTS, CHAT_MESSAGE_TIMEOUT_MS } from '../constants';
import {
  ChatHistoryPage,
  ChatHistoryParams,
  ChatRoom,
  SendMessageRequest,
  SpontaneousImageCaptionRequest,
  SpontaneousImageCaptionResult,
} from '../types';
import {
  fromRawHistoryPageResponse,
  fromSendMessageResponse,
  RawHistoryPageResponse,
  RawSendMessageResponse,
  SendMessageResult,
  toChatHistoryQueryParams,
  toSendMessageDto,
} from '../adapters/chat.adapter';

/**
 * Obtiene la lista de salas de chat del usuario
 *
 * Endpoint: GET ${API_URL}/chat/rooms
 * Response: ChatRoom[]
 *
 * Nota: El backend no expone este endpoint aún. Retorna [] hasta que esté disponible.
 */
export const getChatRooms = async (): Promise<ChatRoom[]> => {
  return [];
};

/**
 * Obtiene historial de chat de un companion.
 *
 * Endpoint: GET /chat/history?companionId=...&limit=...
 * Response: Message[]
 */
export const getChatMessages = async ({
  companionId,
  limit,
  cursor,
  offset,
  beforeMessageId,
}: ChatHistoryParams): Promise<ChatHistoryPage> => {
  const fallbackCompanionId = companionId ?? 'default';
  const pageLimit = limit ?? 50;
  const emptyHistoryPage: ChatHistoryPage = {
    messages: [],
    hasMore: false,
    nextCursor: null,
  };
  const params = toChatHistoryQueryParams({
    companionId,
    limit: pageLimit,
    cursor,
    offset,
    beforeMessageId,
  });
  const query = params.toString();
  const endpoint = query ? `/chat/history?${query}` : '/chat/history';
  if (__DEV__) {
    console.debug(
      `[chat.api] getChatMessages start companionId=${companionId ?? 'default'} limit=${pageLimit} before=${beforeMessageId ?? '∅'}`
    );
  }
  const startedAt = __DEV__ ? Date.now() : 0;
  try {
    const response = await httpClient.get<RawHistoryPageResponse>(
      endpoint,
      undefined,
      {
        suppressFatalBoundary:
          Boolean(beforeMessageId) || (typeof offset === 'number' && !cursor),
      }
    );
    const page = fromRawHistoryPageResponse(response.data, fallbackCompanionId, pageLimit);
    if (__DEV__) {
      console.debug(
        `[chat.api] getChatMessages ok companionId=${fallbackCompanionId} messages=${page.messages.length} hasMore=${page.hasMore} (${Date.now() - startedAt}ms)`
      );
    }
    return page;
  } catch (error) {
    if (__DEV__) {
      const status = error instanceof ApiError ? error.status : 'n/a';
      const message = error instanceof Error ? error.message : String(error);
      console.warn(
        `[chat.api] getChatMessages error companionId=${fallbackCompanionId} status=${status} (${Date.now() - startedAt}ms): ${message}`
      );
    }
    if (error instanceof ApiError && error.status >= 500 && typeof offset === 'number' && !cursor && !beforeMessageId) {
      const fallbackParams = toChatHistoryQueryParams({ companionId, limit: pageLimit });
      const fallbackQuery = fallbackParams.toString();
      const fallbackEndpoint = fallbackQuery ? `/chat/history?${fallbackQuery}` : '/chat/history';
      try {
        const fallbackResponse = await httpClient.get<RawHistoryPageResponse>(
          fallbackEndpoint,
          undefined,
          { suppressFatalBoundary: true }
        );
        return fromRawHistoryPageResponse(fallbackResponse.data, fallbackCompanionId, pageLimit);
      } catch (fallbackError) {
        if (
          fallbackError instanceof ApiError &&
          (fallbackError.status >= 500 || fallbackError.status === 404 || fallbackError.status === 0)
        ) {
          return emptyHistoryPage;
        }
        throw fallbackError;
      }
    }
    if (
      error instanceof ApiError &&
      (error.status >= 500 || error.status === 404 || error.status === 0)
    ) {
      if (beforeMessageId) {
        throw error;
      }
      if (__DEV__) {
        console.warn(
          `[chat.api] getChatMessages devolviendo página vacía por error status=${error.status}`
        );
      }
      return emptyHistoryPage;
    }
    throw error;
  }
};

const CHAT_SEND_RETRYABLE_STATUSES = new Set([0, 408, 429, 502, 503, 504]);

const sleep = (ms: number): Promise<void> => new Promise((resolve) => setTimeout(resolve, ms));

export const isRetryableChatSendError = (error: unknown): boolean => {
  if (!(error instanceof ApiError)) return true;
  return CHAT_SEND_RETRYABLE_STATUSES.has(error.status);
};

const postChatMessage = async (
  body: SendMessageRequest | FormData,
  companionId: string
): Promise<SendMessageResult> => {
  const response = await httpClient.request<RawSendMessageResponse>('/chat/message', {
    method: 'POST',
    body,
    timeoutMs: CHAT_MESSAGE_TIMEOUT_MS,
    suppressFatalBoundary: true,
  });
  return fromSendMessageResponse(response.data, companionId);
};

/**
 * Envía mensaje de texto y opcionalmente una imagen (multipart si hay `imageUri`).
 * Reintenta errores transitorios (cold-start Render, 502/503, timeout).
 *
 * Endpoint: POST /chat/message
 */
export async function sendChatMessage(
  data: SendMessageRequest & { imageUri?: string }
): Promise<SendMessageResult> {
  const dto = toSendMessageDto(data);
  const companionId = dto.companionId ?? 'default';
  const payload = data.imageUri
    ? (() => {
        const formData = new FormData();
        if (dto.companionId) {
          formData.append('companionId', dto.companionId);
        }
        formData.append('message', dto.message ?? '');
        if (dto.useLongTermMemory !== undefined) {
          formData.append('useLongTermMemory', String(dto.useLongTermMemory));
        }
        if (dto.clientContext) {
          formData.append('clientContext', JSON.stringify(dto.clientContext));
        }
        const uri = data.imageUri!;
        const lower = uri.toLowerCase();
        const mime = lower.includes('png') ? 'image/png' : 'image/jpeg';
        const name = mime === 'image/png' ? 'photo.png' : 'photo.jpg';
        formData.append('image', { uri, name, type: mime } as unknown as Blob);
        return formData;
      })()
    : dto;

  let lastError: unknown;
  for (let attempt = 0; attempt < CHAT_MESSAGE_MAX_ATTEMPTS; attempt++) {
    try {
      return await postChatMessage(payload, companionId);
    } catch (error) {
      lastError = error;
      if (!isRetryableChatSendError(error) || attempt >= CHAT_MESSAGE_MAX_ATTEMPTS - 1) {
        throw error;
      }
      await sleep(700 * (attempt + 1));
    }
  }
  throw lastError;
}

/** Alias texto-only; las rutas con imagen deben usar `sendChatMessage`. */
export const sendMessage = async (data: SendMessageRequest): Promise<SendMessageResult> =>
  sendChatMessage(data);

/**
 * Genera la caption de una foto espontánea del companion y persiste la imagen.
 *
 * Endpoint: POST /chat/spontaneous-image-caption
 * Request: { companionId, message, imageStoragePath?, imageUrl? }
 * Response: { caption, messageId, imageStoragePath, imageUrl, persistence }
 */
export async function generateSpontaneousImageCaption(
  data: SpontaneousImageCaptionRequest
): Promise<SpontaneousImageCaptionResult> {
  const body: Record<string, string> = {
    companionId: data.companionId,
    message: data.message,
  };
  // Preferimos el object path estable; imageUrl va como fallback.
  if (data.imageStoragePath) body.imageStoragePath = data.imageStoragePath;
  if (data.imageUrl) body.imageUrl = data.imageUrl;

  const response = await httpClient.post<Partial<SpontaneousImageCaptionResult>>(
    '/chat/spontaneous-image-caption',
    body
  );
  const raw = response.data ?? {};
  return {
    caption: (raw.caption ?? '').trim(),
    messageId: raw.messageId ?? '',
    imageStoragePath: raw.imageStoragePath ?? '',
    imageUrl: raw.imageUrl ?? '',
    persistence: raw.persistence ?? '',
  };
}
