import { describe, expect, it, vi } from 'vitest';

import {
  CHAT_THREAD_SCROLL_KEY,
  planThreadScroll,
  rememberScrollOffset,
  restoreScrollOffset,
  type ScrollMetrics,
} from './chatThreadScroll';

function box(over: Partial<ScrollMetrics> = {}): ScrollMetrics {
  return { scrollTop: 0, scrollHeight: 2000, clientHeight: 400, ...over };
}

describe('chat thread scroll offset', () => {
  it('no toca el scroll en la primera entrada', () => {
    const el = box({ scrollTop: 12 });
    expect(restoreScrollOffset(el, null)).toBe(false);
    expect(el.scrollTop).toBe(12);
  });

  it('restaura el mismo offset cuando el contenido ya cabe', () => {
    const el = box();
    expect(restoreScrollOffset(el, 640)).toBe(true);
    expect(el.scrollTop).toBe(640);
  });

  it('espera si el hilo todavía es más corto que el offset', () => {
    const el = box({ scrollHeight: 500, clientHeight: 400 });
    expect(restoreScrollOffset(el, 640)).toBe(false);
    expect(el.scrollTop).toBe(0);
  });

  it('no pisa el offset guardado mientras el panel no hace scroll', () => {
    const el = box({ scrollTop: 0, scrollHeight: 100, clientHeight: 400 });
    expect(rememberScrollOffset(el, 640)).toBe(640);
  });

  it('guarda la posición actual, también el inicio, si hay scroll', () => {
    expect(rememberScrollOffset(box({ scrollTop: 0 }), null)).toBe(0);
    expect(rememberScrollOffset(box({ scrollTop: 320 }), 0)).toBe(320);
  });

  it('recupera el offset tras recargar y el botón solo lejos del fondo', async () => {
    sessionStorage.removeItem(CHAT_THREAD_SCROLL_KEY);
    vi.resetModules();
    const first = await import('./chatThreadScroll');
    first.commitChatThreadScroll(box({ scrollTop: 480 }));
    expect(first.readStoredScrollOffset()).toBe(480);

    vi.resetModules();
    const reloaded = await import('./chatThreadScroll');
    const el = box();
    expect(reloaded.applyChatThreadScroll(el)).toBe(true);
    expect(el.scrollTop).toBe(480);
    expect(reloaded.showJumpToLatest(el)).toBe(true);
    expect(reloaded.showJumpToLatest(box({ scrollTop: 1520 }))).toBe(false);
    expect(reloaded.showJumpToLatest(box({ scrollTop: 1519 }))).toBe(true);
    sessionStorage.removeItem(CHAT_THREAD_SCROLL_KEY);
  });

  it('al enviar baja y no reaplica el offset; leyendo arriba se queda', () => {
    const sending = box({ scrollTop: 400 });
    expect(
      planThreadScroll({
        box: sending,
        saved: 400,
        restorePending: true,
        followSend: true,
        wasAtBottom: false,
      }),
    ).toBe('end');
    expect(sending.scrollTop).toBe(1600);

    const reading = box({ scrollTop: 400 });
    expect(
      planThreadScroll({
        box: reading,
        saved: 400,
        restorePending: false,
        followSend: false,
        wasAtBottom: false,
      }),
    ).toBe('keep');
    expect(reading.scrollTop).toBe(400);

    const parked = box({ scrollTop: 1600 });
    expect(
      planThreadScroll({
        box: parked,
        saved: 1600,
        restorePending: false,
        followSend: false,
        wasAtBottom: true,
      }),
    ).toBe('end');
    expect(parked.scrollTop).toBe(1600);

    const cold = box({ scrollTop: 0 });
    expect(
      planThreadScroll({
        box: cold,
        saved: 640,
        restorePending: true,
        followSend: false,
        wasAtBottom: false,
      }),
    ).toBe('keep');
    expect(cold.scrollTop).toBe(640);

    const short = box({ scrollHeight: 500, clientHeight: 400, scrollTop: 0 });
    expect(
      planThreadScroll({
        box: short,
        saved: 640,
        restorePending: true,
        followSend: false,
        wasAtBottom: false,
      }),
    ).toBe('wait');
    expect(short.scrollTop).toBe(0);

    const shortSend = box({ scrollHeight: 500, clientHeight: 400, scrollTop: 0 });
    expect(
      planThreadScroll({
        box: shortSend,
        saved: 640,
        restorePending: true,
        followSend: true,
        wasAtBottom: false,
      }),
    ).toBe('end');
    expect(shortSend.scrollTop).toBe(100);
  });
});
