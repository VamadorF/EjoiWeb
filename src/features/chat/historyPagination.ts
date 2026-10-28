import type { ChatHistoryPage } from '@/features/chat/types';

/**
 * Cursor `before` para la página anterior del historial. eJoi-BE entrega cada página
 * viejo → nuevo, así que el cursor es el mensaje más antiguo, no el último del array.
 * Corta si la página viene vacía o repite la anterior (backend que ignora `before`).
 */
export function getOlderHistoryPageParam(
  lastPage: ChatHistoryPage,
  allPages: ChatHistoryPage[],
): string | undefined {
  const { messages } = lastPage;
  if (!lastPage.hasMore || messages.length === 0) return undefined;

  const prev = allPages.at(-2);
  if (prev) {
    const prevIds = new Set(prev.messages.map((m) => m.id));
    if (messages.every((m) => prevIds.has(m.id))) return undefined;
  }

  let oldest = messages[0];
  let oldestTime = Number.POSITIVE_INFINITY;
  for (const m of messages) {
    const time = Date.parse(m.createdAt);
    if (Number.isFinite(time) && time < oldestTime) {
      oldest = m;
      oldestTime = time;
    }
  }
  return oldest.id;
}
