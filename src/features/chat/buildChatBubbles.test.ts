import { describe, expect, it } from 'vitest';

import type { Message } from '@/features/chat/types';

import { buildChatBubbles } from './buildChatBubbles';
import type { ChatBubble } from './MessageList';

const at = (hhmm: string) => `2026-10-23T${hhmm}:00.000Z`;

function msg(id: string, role: Message['role'], text: string, createdAt: string, meta?: Message['meta']): Message {
  return { id, companionId: 'c1', role, message: text, createdAt, meta };
}

const firstMessage = { id: 'fm1', content: 'Hola desde Luna', meta: { basedOnInterests: ['Música'] } };
const introFallbackAt = at('09:00');

describe('buildChatBubbles', () => {
  it('deja el intro del historial primero aunque haya mensajes nuevos', () => {
    const bubbles = buildChatBubbles({
      history: [
        msg('fm1', 'assistant', 'Hola desde Luna', at('10:00')),
        msg('u1', 'user', 'Hola Luna', at('10:05')),
        msg('a1', 'assistant', 'Cuéntame más', at('10:06')),
      ],
      firstMessage,
      introFallbackAt,
    });
    expect(bubbles.map((b) => b.id)).toEqual(['fm1', 'u1', 'a1']);
    expect(bubbles[0]!.createdAt).toBe(at('10:00'));
  });

  it('no duplica el intro si el historial lo trae con otro id', () => {
    const bubbles = buildChatBubbles({
      history: [
        msg('h-intro', 'assistant', 'Hola desde Luna', at('10:00'), { kind: 'first_message' }),
        msg('u1', 'user', 'Hola Luna', at('10:05')),
      ],
      firstMessage,
      introFallbackAt,
    });
    expect(bubbles.filter((b) => b.text === 'Hola desde Luna')).toHaveLength(1);
    expect(bubbles.map((b) => b.id)).toEqual(['h-intro', 'u1']);
  });

  it('completa basedOnInterests desde la creación', () => {
    const [intro] = buildChatBubbles({
      history: [msg('fm1', 'assistant', 'Hola desde Luna', at('10:00'))],
      firstMessage,
      introFallbackAt,
    });
    expect(intro!.basedOnInterests).toEqual(['Música']);
  });

  it('inyecta el intro antes del pendiente cuando el historial está vacío', () => {
    const pending: ChatBubble = { id: 'p1', role: 'user', text: 'Hola', createdAt: at('10:05') };
    const bubbles = buildChatBubbles({ history: [], firstMessage, introFallbackAt, pending });
    expect(bubbles.map((b) => b.id)).toEqual(['fm1', 'p1']);
    expect(bubbles[0]!.createdAt).toBe('2026-10-23T10:04:59.999Z');
  });

  it('usa introFallbackAt si no hay otros mensajes', () => {
    const [intro] = buildChatBubbles({ history: [], firstMessage, introFallbackAt });
    expect(intro!.createdAt).toBe(introFallbackAt);
  });

  it('es estable entre llamadas', () => {
    const input = { history: [msg('u1', 'user', 'Hola', at('10:05'))], firstMessage, introFallbackAt };
    expect(buildChatBubbles(input)[0]!.createdAt).toBe(buildChatBubbles(input)[0]!.createdAt);
  });
});
