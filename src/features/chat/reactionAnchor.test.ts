import { describe, expect, it } from 'vitest';

import { reactionAnchorId } from './MessageList';

const atSend = [
  { id: 'intro', role: 'assistant' as const },
  { id: 'u1', role: 'user' as const },
];

const afterReply = [...atSend, { id: 'a2', role: 'assistant' as const }];

describe('reactionAnchorId', () => {
  it('reacción 1 queda en el mensaje anterior, aunque ya llegó la respuesta', () => {
    expect(reactionAnchorId(atSend, 'user_message', { anchorMessageId: 'intro' })).toBe('intro');
    expect(reactionAnchorId(afterReply, 'user_message', { anchorMessageId: 'intro' })).toBe('intro');
    expect(reactionAnchorId(afterReply, 'user_message')).toBeNull();
  });

  it('reacción 2 queda en el mensaje nuevo', () => {
    expect(reactionAnchorId(afterReply, 'assistant_message', { beforeSendId: 'intro', anchorMessageId: 'a2' })).toBe(
      'a2',
    );
    expect(reactionAnchorId(afterReply, 'assistant_message', { beforeSendId: 'intro' })).toBe('a2');
  });

  it('reacción 2 no se ancla a la cola de antes del envío', () => {
    expect(
      reactionAnchorId([{ id: 'intro', role: 'assistant' }], 'assistant_message', { beforeSendId: 'intro' }),
    ).toBeNull();
    expect(reactionAnchorId(atSend, 'assistant_message', { beforeSendId: 'intro' })).toBeNull();
    expect(reactionAnchorId([], 'user_message')).toBeNull();
  });

  it('sin fase usa el último del hilo', () => {
    expect(reactionAnchorId(afterReply, undefined)).toBe('a2');
  });
});
