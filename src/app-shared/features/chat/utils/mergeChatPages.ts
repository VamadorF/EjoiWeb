// AUTO-SINCRONIZADO desde ejoiFE b20f6d62a97a0266796ebfb82e772f0961ed9136@b20f6d62a97a0266796ebfb82e772f0961ed9136:src/features/chat/utils/mergeChatPages.ts. No editar: npm run sync:app
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
