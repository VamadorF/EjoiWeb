import type { TFunction } from 'i18next';
import { describe, expect, it } from 'vitest';

import { formatPresenceSubtitle, presenceSubtitleKey } from './formatPresenceSubtitle';

describe('formatPresenceSubtitle', () => {
  const t = ((key: string, opts?: Record<string, string>) => {
    if (key === 'chat.header.away_last_seen') return `Ausente · ${opts?.time}`;
    return key;
  }) as TFunction;

  it('usa claves de header por estado', () => {
    expect(presenceSubtitleKey('thinking')).toBe('chat.header.thinking');
    expect(presenceSubtitleKey('reconnecting')).toBe('chat.header.reconnecting');
  });

  it('formatea away con last seen', () => {
    const text = formatPresenceSubtitle(
      { state: 'away', lastSeen: '2026-10-21T12:00:00.000Z' },
      t,
    );
    expect(text).toContain('Ausente ·');
  });
});
