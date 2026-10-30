export type ScrollMetrics = {
  scrollTop: number;
  scrollHeight: number;
  clientHeight: number;
};

/** null = primera entrada a Chat; no forzar scroll. ponytail: memoria del módulo, se pierde al recargar; sessionStorage si debe sobrevivir al refresh. */
let savedChatThreadScroll: number | null = null;

export function readChatThreadScroll(): number | null {
  return savedChatThreadScroll;
}

export function commitChatThreadScroll(box: ScrollMetrics): void {
  savedChatThreadScroll = rememberScrollOffset(box, savedChatThreadScroll);
}

export function applyChatThreadScroll(box: ScrollMetrics): boolean {
  return restoreScrollOffset(box, savedChatThreadScroll);
}

/** No pisa un offset ya guardado si el panel todavía no scrollea (skeleton). */
export function rememberScrollOffset(box: ScrollMetrics, saved: number | null): number | null {
  if (box.scrollHeight <= box.clientHeight) return saved;
  return box.scrollTop;
}

/**
 * Aplica el offset solo cuando el contenido ya es tan alto como al salir.
 * Si todavía es más corto, devuelve false para reintentar.
 */
export function restoreScrollOffset(box: ScrollMetrics, saved: number | null): boolean {
  if (saved == null) return false;
  const max = box.scrollHeight - box.clientHeight;
  if (max <= 0 || saved > max + 1) return false;
  box.scrollTop = saved;
  return true;
}
