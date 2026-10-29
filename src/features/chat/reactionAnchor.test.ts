import { describe, expect, it } from 'vitest';

import { reactionAnchorId } from './MessageList';

const msgs = [
  { id: 'a1', role: 'assistant' as const },
  { id: 'u1', role: 'user' as const },
  { id: 'a2', role: 'assistant' as const },
];

describe('reactionAnchorId', () => {
  it('ancla la reacción del usuario al último mensaje suyo', () => {
    expect(reactionAnchorId(msgs, 'user_message')).toBe('u1');
  });

  it('ancla la reacción de la compañera a su último mensaje', () => {
    expect(reactionAnchorId(msgs, 'assistant_message')).toBe('a2');
  });

  it('sin fase usa el último del hilo', () => {
    expect(reactionAnchorId(msgs, undefined)).toBe('a2');
    expect(reactionAnchorId([], 'user_message')).toBeNull();
  });
});
