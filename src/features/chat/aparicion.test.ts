import { describe, expect, it } from 'vitest';

import { emptyAparicion, noteAparicion, segmentGraphemes, type AparicionBubble } from './aparicion';

const history: AparicionBubble[] = [
  { id: 'a0', role: 'assistant', createdAt: '2020-01-01T00:00:00.000Z' },
  { id: 'u0', role: 'user', createdAt: '2020-01-01T00:00:01.000Z' },
];

describe('aparicion', () => {
  it('segmenta grafemas en español', () => {
    expect(segmentGraphemes('niño')).toEqual(['n', 'i', 'ñ', 'o']);
    expect(segmentGraphemes('a\u0301')).toEqual(['a\u0301']);
    expect(segmentGraphemes('👩‍❤️‍👨')).toEqual(['👩‍❤️‍👨']);
  });

  it('anima solo la respuesta nueva con el tema activo', () => {
    let state = noteAparicion(emptyAparicion(), history, true);
    expect([...state.play]).toEqual([]);

    state = noteAparicion(
      state,
      [...history, { id: 'intro', role: 'assistant', createdAt: '2020-01-02T00:00:00.000Z' }],
      true,
    );
    expect(state.play.has('intro')).toBe(false);

    const sent = [
      ...history,
      { id: 'u1', role: 'user', createdAt: '2020-01-03T00:00:00.000Z' },
      { id: 'a1', role: 'assistant', createdAt: '2020-01-03T00:00:01.000Z' },
    ];
    state = noteAparicion(state, sent, true);
    expect(state.play.has('a1')).toBe(true);
    expect(state.play.has('u1')).toBe(false);

    const again = noteAparicion(state, sent, true);
    expect(again).toBe(state);

    const older = noteAparicion(
      state,
      [...sent, { id: 'old', role: 'assistant', createdAt: '2019-01-01T00:00:00.000Z' }],
      true,
    );
    expect(older.play.has('old')).toBe(false);

    const off = noteAparicion(
      state,
      [
        ...sent,
        { id: 'u2', role: 'user', createdAt: '2020-01-04T00:00:00.000Z' },
        { id: 'a2', role: 'assistant', createdAt: '2020-01-04T00:00:01.000Z' },
      ],
      false,
    );
    expect(off.play.has('a2')).toBe(false);
  });
});
