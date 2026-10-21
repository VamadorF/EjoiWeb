// AUTO-SINCRONIZADO desde ejoiFE b20f6d62a97a0266796ebfb82e772f0961ed9136@b20f6d62a97a0266796ebfb82e772f0961ed9136:src/features/chat/adapters/chat.adapter.ts. No editar: npm run sync:app
import { fromRawPreferenceChange } from '@/features/proactivity/adapters/proactivity.adapter';
import type { PreferenceChange } from '@/features/proactivity/types';
import { MESSAGE_MAX_LENGTH, SPONTANEOUS_PICTURE_TRIGGER_PREFIX } from '../constants';
import {
  ChatHistoryPage,
  ChatHistoryParams,
  Message,
  MessageAttachment,
  MessageMeta,
  MessageRole,
  SendMessageRequest,
} from '../types';
import { resolveChatMediaUrl } from '../utils/resolveChatMediaUrl';

export type RawMessage = {
  id?: string;
  companionId?: string;
  role?: string;
  message?: string;
  content?: string;
  text?: string;
  createdAt?: string;
  updatedAt?: string;
  imageUrl?: string;
  attachments?: Array<{ type?: string; url?: string }>;
  topic?: string;
  mood?: string;
  preferenceChange?: unknown;
  meta?: unknown;
};

const fromRawMessageMeta = (raw: unknown): MessageMeta | undefined => {
  if (!raw || typeof raw !== 'object') return undefined;
  const record = raw as Record<string, unknown>;
  const kind = record.kind === 'first_message' ? 'first_message' : undefined;
  const basedOnInterests = Array.isArray(record.basedOnInterests)
    ? record.basedOnInterests.filter((v): v is string => typeof v === 'string' && v.trim().length > 0)
    : undefined;
  const basedOnPersona =
    typeof record.basedOnPersona === 'string'
      ? record.basedOnPersona
      : record.basedOnPersona === null
        ? null
        : undefined;
  const quickReplies = Array.isArray(record.quickReplies)
    ? record.quickReplies
        .filter((v): v is string => typeof v === 'string' && v.trim().length > 0)
        .slice(0, 3)
    : undefined;
  const source = record.source === 'llm' || record.source === 'template' ? record.source : undefined;

  if (!kind && !basedOnInterests?.length && basedOnPersona === undefined && !quickReplies?.length && !source) {
    return undefined;
  }

  return {
    ...(kind ? { kind } : {}),
    ...(basedOnInterests?.length ? { basedOnInterests } : {}),
    ...(basedOnPersona !== undefined ? { basedOnPersona } : {}),
    ...(quickReplies?.length ? { quickReplies } : {}),
    ...(source ? { source } : {}),
  };
};

export type RawHistoryResponse = RawMessage[] | { messages?: RawMessage[]; data?: RawMessage[] };
export type RawHistoryPageResponse =
  | RawHistoryResponse
  | {
      messages?: RawMessage[];
      data?: RawMessage[];
      nextCursor?: string | null;
      hasMore?: boolean;
      cursor?: string | null;
    };

const toMessageRole = (role?: string): MessageRole => {
  if (role === 'assistant' || role === 'system') {
    return role;
  }
  return 'user';
};

const clampText = (value: string, max: number): string => value.trim().slice(0, max);

/**
 * Detecta el mensaje trigger interno de fotos espontáneas. El backend puede
 * persistirlo en el historial, pero nunca debe mostrarse al usuario.
 */
const isSpontaneousPictureTrigger = (message: Message): boolean =>
  message.message.trimStart().startsWith(SPONTANEOUS_PICTURE_TRIGGER_PREFIX);

const fallbackMessageId = (companionId: string): string =>
  `${companionId}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

const attachmentsFromRaw = (message: RawMessage): MessageAttachment[] | undefined => {
  const urlsSeen = new Set<string>();
  const out: MessageAttachment[] = [];

  const pushUrl = (rawUrl: string | undefined) => {
    if (!rawUrl?.trim()) return;
    const resolved = resolveChatMediaUrl(rawUrl);
    if (!resolved || urlsSeen.has(resolved)) return;
    urlsSeen.add(resolved);
    out.push({ type: 'image', url: resolved });
  };

  if (Array.isArray(message.attachments)) {
    for (const a of message.attachments) {
      const t = (a?.type ?? 'image').toLowerCase();
      if (t === 'image' && a?.url) pushUrl(a.url);
    }
  }
  pushUrl(message.imageUrl);

  return out.length > 0 ? out : undefined;
};

export const toChatHistoryQueryParams = (params: ChatHistoryParams): URLSearchParams => {
  const queryParams = new URLSearchParams();
  if (params.companionId) {
    queryParams.append('companionId', params.companionId);
  }
  if (typeof params.limit === 'number') {
    queryParams.append('limit', String(params.limit));
  }
  if (params.cursor) {
    queryParams.append('cursor', params.cursor);
  }
  if (typeof params.offset === 'number') {
    queryParams.append('offset', String(params.offset));
  }
  if (params.beforeMessageId) {
    queryParams.append('before', params.beforeMessageId);
  }
  return queryParams;
};

export const toSendMessageDto = (payload: SendMessageRequest): SendMessageRequest => ({
  message: clampText(payload.message, MESSAGE_MAX_LENGTH),
  companionId: payload.companionId,
  useLongTermMemory: payload.useLongTermMemory,
  ...(payload.clientContext ? { clientContext: payload.clientContext } : {}),
});

export const fromRawMessage = (message: RawMessage, fallbackCompanionId: string): Message => ({
  id: message.id ?? fallbackMessageId(fallbackCompanionId),
  companionId: message.companionId ?? fallbackCompanionId,
  role: toMessageRole(message.role),
  message: message.message ?? message.content ?? message.text ?? '',
  createdAt: message.createdAt ?? new Date().toISOString(),
  updatedAt: message.updatedAt,
  attachments: attachmentsFromRaw(message),
  topic: message.topic?.trim() || undefined,
  mood: message.mood?.trim() || undefined,
  preferenceChange: fromRawPreferenceChange(message.preferenceChange),
  meta: fromRawMessageMeta(message.meta),
});

/** Fragmento de mensaje en respuestas POST /chat/message */
export type RawSendMessagePart = {
  id?: string;
  content?: string;
  message?: string;
  createdAt?: string;
  imageUrl?: string;
  attachments?: Array<{ type?: string; url?: string }>;
  preferenceChange?: unknown;
};

/** Respuesta del backend POST /chat/message */
export type RawSendMessageResponse = {
  conversationId?: string;
  userMessage?: RawSendMessagePart;
  assistantMessage?: RawSendMessagePart & {
    topic?: string;
    mood?: string;
  };
  preferenceChange?: unknown;
};

export interface SendMessageResult {
  userMessage: Message;
  assistantMessage: Message;
  preferenceChange?: PreferenceChange;
}

export const resolveSendPreferenceChange = (
  result: Pick<SendMessageResult, 'preferenceChange' | 'assistantMessage' | 'userMessage'>
): PreferenceChange | undefined =>
  result.preferenceChange ??
  result.assistantMessage.preferenceChange ??
  result.userMessage.preferenceChange;

export const fromSendMessageResponse = (
  data: RawSendMessageResponse,
  companionId: string
): SendMessageResult => {
  const userMsg = data.userMessage ?? {};
  const assistantMsg = data.assistantMessage ?? {};
  const topLevelChange = fromRawPreferenceChange(data.preferenceChange);
  const userMessage = fromRawMessage(
    {
      id: userMsg.id,
      role: 'user',
      content: userMsg.content ?? userMsg.message,
      message: userMsg.message,
      createdAt: userMsg.createdAt,
      imageUrl: userMsg.imageUrl,
      attachments: userMsg.attachments,
      preferenceChange: userMsg.preferenceChange,
    },
    companionId
  );
  const assistantMessage = fromRawMessage(
    {
      id: assistantMsg.id,
      role: 'assistant',
      content: assistantMsg.content ?? assistantMsg.message,
      message: assistantMsg.message,
      createdAt: assistantMsg.createdAt,
      imageUrl: assistantMsg.imageUrl,
      attachments: assistantMsg.attachments,
      topic: assistantMsg.topic,
      mood: assistantMsg.mood,
      preferenceChange: assistantMsg.preferenceChange ?? data.preferenceChange,
    },
    companionId
  );
  return {
    userMessage,
    assistantMessage,
    preferenceChange:
      topLevelChange ?? assistantMessage.preferenceChange ?? userMessage.preferenceChange,
  };
};

export const fromRawHistoryResponse = (
  data: RawHistoryResponse,
  fallbackCompanionId: string
): Message[] => {
  const rawMessages = Array.isArray(data)
    ? data
    : Array.isArray(data.messages)
      ? data.messages
      : Array.isArray(data.data)
        ? data.data
        : [];

  return rawMessages
    .map((item) => fromRawMessage(item, fallbackCompanionId))
    .filter((m) => !isSpontaneousPictureTrigger(m));
};

export const fromRawHistoryPageResponse = (
  data: RawHistoryPageResponse,
  fallbackCompanionId: string,
  requestedLimit: number
): ChatHistoryPage => {
  const hasMessageCollection =
    Array.isArray(data) ||
    ('messages' in data && Array.isArray(data.messages)) ||
    ('data' in data && Array.isArray(data.data));
  const messages = hasMessageCollection
    ? fromRawHistoryResponse(data as RawHistoryResponse, fallbackCompanionId)
    : [];
  const payload = data as {
    nextCursor?: string | null;
    hasMore?: boolean;
    cursor?: string | null;
  };
  const nextCursor = payload.nextCursor ?? payload.cursor ?? null;
  const inferredHasMore =
    typeof payload.hasMore === 'boolean'
      ? payload.hasMore
      : messages.length >= requestedLimit;

  return {
    messages,
    nextCursor,
    hasMore: inferredHasMore,
  };
};
