import { describe, expect, it } from 'vitest';

import type { ChatHistoryPage, Message } from '@/features/chat/types';

import { getOlderHistoryPageParam } from './historyPagination';

const at = (hhmm: string) => `2026-10-23T${hhmm}:00.000Z`;

function msg(id: string, createdAt: string): Message {
  return { id, companionId: 'c1', role: 'user', message: id, createdAt };
}

function page(messages: Message[], hasMore = true): ChatHistoryPage {
  return { messages, hasMore };
}

describe('getOlderHistoryPageParam', () => {
  it('usa el mensaje más antiguo de una página cronológica (viejo → nuevo)', () => {
    const p = page([msg('m1', at('10:00')), msg('m2', at('10:01')), msg('m3', at('10:02'))]);
    expect(getOlderHistoryPageParam(p, [p])).toBe('m1');
  });

  it('elige el más antiguo aunque la página venga de nuevo a viejo', () => {
    const p = page([msg('m3', at('10:02')), msg('m1', at('10:00')), msg('m2', at('10:01'))]);
    expect(getOlderHistoryPageParam(p, [p])).toBe('m1');
  });

  it('con createdAt empatado gana el primero del array', () => {
    const p = page([msg('a', at('10:00')), msg('b', at('10:00'))]);
    expect(getOlderHistoryPageParam(p, [p])).toBe('a');
  });

  it('ignora createdAt inválidos y cae a messages[0] si ninguno sirve', () => {
    const mixed = page([msg('bad', 'x'), msg('ok', at('10:05')), msg('ok2', at('10:06'))]);
    expect(getOlderHistoryPageParam(mixed, [mixed])).toBe('ok');
    const allBad = page([msg('b1', 'x'), msg('b2', '')]);
    expect(getOlderHistoryPageParam(allBad, [allBad])).toBe('b1');
  });

  it('no pagina si hasMore es false', () => {
    const p = page([msg('m1', at('10:00'))], false);
    expect(getOlderHistoryPageParam(p, [p])).toBeUndefined();
  });

  it('no pagina si la página viene vacía aunque hasMore sea true', () => {
    const p = page([]);
    expect(getOlderHistoryPageParam(p, [p])).toBeUndefined();
  });

  it('corta si el backend repite íntegra la página anterior (ignora before)', () => {
    const first = page([msg('m1', at('10:00')), msg('m2', at('10:01'))]);
    const repeated = page([msg('m1', at('10:00')), msg('m2', at('10:01'))]);
    expect(getOlderHistoryPageParam(repeated, [first, repeated])).toBeUndefined();
  });

  it('sigue paginando si la página nueva solapa solo en parte', () => {
    const first = page([msg('m3', at('10:02')), msg('m4', at('10:03'))]);
    const older = page([msg('m1', at('10:00')), msg('m2', at('10:01')), msg('m3', at('10:02'))]);
    expect(getOlderHistoryPageParam(older, [first, older])).toBe('m1');
  });
});
