// AUTO-SINCRONIZADO desde ejoiFE 9234854dc9f9992b39b7f61dfb0e02b768be467d@9234854dc9f9992b39b7f61dfb0e02b768be467d:src/features/chat/utils/mergeChatPages.ts. No editar: npm run sync:app
import type { Message } from '../types';

/** Une páginas del infinite query, deduplica por id y ordena cronológicamente (viejo → nuevo). */
export const mergeAndSortChatMessages = (
  pages: ReadonlyArray<{ messages: Message[] }>
): Message[] => {
  const map = new Map<string, Message>();
  for (const page of pages) {
    for (const m of page.messages) {
      map.set(m.id, m);
    }
  }
  return [...map.values()].sort(
    (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
  );
};
