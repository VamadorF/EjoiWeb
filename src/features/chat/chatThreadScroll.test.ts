import { describe, expect, it } from 'vitest';

import { rememberScrollOffset, restoreScrollOffset, type ScrollMetrics } from './chatThreadScroll';

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
});
