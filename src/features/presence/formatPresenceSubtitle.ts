import type { TFunction } from 'i18next';

import { formatPresenceLastSeen } from '@/features/presence/utils/formatLastSeen';
import type { PresenceSnapshot, PresenceState } from '@/features/presence/types';

export function presenceSubtitleKey(state: PresenceState): string {
  switch (state) {
    case 'typing':
      return 'chat.header.typing';
    case 'listening':
      return 'chat.header.listening';
    case 'thinking':
      return 'chat.header.thinking';
    case 'recording':
      return 'chat.header.recording';
    case 'reconnecting':
      return 'chat.header.reconnecting';
    case 'away':
      return 'chat.header.away';
    case 'offline':
      return 'chat.header.offline';
    default:
      return 'chat.header.online';
  }
}

export function formatPresenceSubtitle(snapshot: PresenceSnapshot, t: TFunction): string {
  const time = formatPresenceLastSeen(snapshot.lastSeen);
  if (snapshot.state === 'away' && time) {
    return t('chat.header.away_last_seen', { time });
  }
  if (snapshot.state === 'offline' && time) {
    return t('chat.header.offline_last_seen', { time });
  }
  return t(presenceSubtitleKey(snapshot.state));
}

export function presenceDotModifier(state: PresenceState): string {
  switch (state) {
    case 'online':
      return 'chat-header__presence--online';
    case 'typing':
      return 'chat-header__presence--typing';
    case 'listening':
      return 'chat-header__presence--listening';
    case 'thinking':
      return 'chat-header__presence--thinking';
    case 'recording':
      return 'chat-header__presence--recording';
    case 'away':
      return 'chat-header__presence--away';
    case 'offline':
      return 'chat-header__presence--offline';
    case 'reconnecting':
      return 'chat-header__presence--reconnecting';
    default:
      return 'chat-header__presence--online';
  }
}
