import { describe, expect, it } from 'vitest';

import { getPresenceSnapshot, presenceActions } from './presenceStore';

describe('getPresenceSnapshot', () => {
  it('devuelve el mismo objeto mientras el store no cambie (requisito de useSyncExternalStore)', () => {
    expect(getPresenceSnapshot('companion')).toBe(getPresenceSnapshot('companion'));
    expect(getPresenceSnapshot('me')).toBe(getPresenceSnapshot('me'));
  });

  it('devuelve un snapshot nuevo cuando el store cambia', () => {
    presenceActions.setNetworkOnline(true);
    const before = getPresenceSnapshot('me');

    presenceActions.setNetworkOnline(false);
    const after = getPresenceSnapshot('me');

    expect(after).not.toBe(before);
    expect(after.state).toBe('reconnecting');
    presenceActions.setNetworkOnline(true);
  });
});
