export type ScrollMetrics = {
  scrollTop: number;
  scrollHeight: number;
  clientHeight: number;
};

/** ponytail: una clave por pestaña; si hay varios hilos, incluir el id de conversación. */
export const CHAT_THREAD_SCROLL_KEY = 'ejoi_chat_thread_scroll';

const JUMP_LATEST_GAP_PX = 80;

function sessionStore(): Storage | null {
  try {
    return typeof sessionStorage === 'undefined' ? null : sessionStorage;
  } catch {
    return null;
  }
}

export function readStoredScrollOffset(): number | null {
  const raw = sessionStore()?.getItem(CHAT_THREAD_SCROLL_KEY);
  if (raw == null) return null;
  const n = Number(raw);
  return Number.isFinite(n) && n >= 0 ? n : null;
}

function writeStoredScrollOffset(offset: number): void {
  try {
    sessionStore()?.setItem(CHAT_THREAD_SCROLL_KEY, String(offset));
  } catch {
    /* modo privado / cuota */
  }
}

/** null = primera entrada a Chat; no forzar scroll. */
let savedChatThreadScroll: number | null = readStoredScrollOffset();

export function readChatThreadScroll(): number | null {
  return savedChatThreadScroll;
}

export function commitChatThreadScroll(box: ScrollMetrics): void {
  const next = rememberScrollOffset(box, savedChatThreadScroll);
  savedChatThreadScroll = next;
  if (next != null) writeStoredScrollOffset(next);
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

/** Visible si el fondo del hilo queda más abajo que un margen corto. */
export function showJumpToLatest(box: ScrollMetrics): boolean {
  return box.scrollHeight - box.clientHeight - box.scrollTop > JUMP_LATEST_GAP_PX;
}

/**
 * wait: el contenido aún no cabe el offset guardado.
 * keep: restaurar (si tocaba) o no mover.
 * end: bajar al final. Un envío no reaplica el offset viejo.
 */
export function planThreadScroll(input: {
  box: ScrollMetrics;
  saved: number | null;
  restorePending: boolean;
  followSend: boolean;
  wasAtBottom: boolean;
}): 'wait' | 'keep' | 'end' {
  const { box, saved, restorePending, followSend, wasAtBottom } = input;
  if (restorePending && !followSend) {
    if (saved == null) return 'keep';
    return restoreScrollOffset(box, saved) ? 'keep' : 'wait';
  }
  if (followSend || wasAtBottom) {
    box.scrollTop = Math.max(0, box.scrollHeight - box.clientHeight);
    return 'end';
  }
  return 'keep';
}
