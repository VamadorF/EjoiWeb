import { describe, expect, it } from 'vitest';

import { computeFirstMeetingAnniversary } from './useFirstMeetingAnniversary';

describe('computeFirstMeetingAnniversary', () => {
  it('detecta aniversario cuando hoy coincide y pasó al menos un año', () => {
    const now = new Date();
    const happenedAt = new Date(now.getFullYear() - 2, now.getMonth(), now.getDate()).toISOString();

    const result = computeFirstMeetingAnniversary([
      {
        id: 'fm1',
        userId: 'u1',
        companionId: 'c1',
        conversationId: null,
        type: 'FIRST_MEETING',
        happenedAt,
        title: 'Primer chat',
        description: 'Test',
        importance: 5,
        sourceMessageId: null,
        createdAt: happenedAt,
      },
    ]);

    expect(result.isAnniversary).toBe(true);
    expect(result.yearsTogether).toBe(2);
  });

  it('no marca aniversario si no hay FIRST_MEETING', () => {
    expect(computeFirstMeetingAnniversary([]).isAnniversary).toBe(false);
  });
});
