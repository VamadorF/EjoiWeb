import type { Message } from '@/features/chat/types';

import { type ChatBubble, firstMessageToBubble } from './MessageList';
import type { CreationFirstMessage } from './useCreationStatus';

export type BuildChatBubblesInput = {
  history: Message[];
  firstMessage?: CreationFirstMessage;
  /** Timestamp estable (capturado al montar) para el intro cuando no hay otros mensajes. */
  introFallbackAt: string;
  pending?: ChatBubble;
};

const timeOf = (iso?: string) => (iso ? new Date(iso).getTime() : 0);

/**
 * Arma las burbujas en orden cronológico. El intro del historial manda (trae su `createdAt` real);
 * si aún no llegó, se inyecta el de creación justo antes del mensaje más antiguo.
 */
export function buildChatBubbles({ history, firstMessage, introFallbackAt, pending }: BuildChatBubblesInput): ChatBubble[] {
  const byId = new Map<string, ChatBubble>();
  let introInHistory = false;

  for (const msg of history) {
    const bubble = firstMessageToBubble(msg);
    const isIntro = msg.id === firstMessage?.id || msg.meta?.kind === 'first_message';
    if (isIntro) {
      introInHistory = true;
      bubble.basedOnInterests ??= firstMessage?.meta?.basedOnInterests;
    }
    byId.set(msg.id, bubble);
  }

  if (pending) byId.set(pending.id, pending);

  if (firstMessage?.content && !introInHistory) {
    const times = [...byId.values()].map((b) => timeOf(b.createdAt)).filter((t) => t > 0);
    const createdAt = times.length ? new Date(Math.min(...times) - 1).toISOString() : introFallbackAt;
    byId.set(firstMessage.id, {
      id: firstMessage.id,
      role: 'assistant',
      text: firstMessage.content,
      basedOnInterests: firstMessage.meta?.basedOnInterests,
      createdAt,
    });
  }

  return [...byId.values()].sort((a, b) => timeOf(a.createdAt) - timeOf(b.createdAt));
}
