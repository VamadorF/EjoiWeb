import { useSyncExternalStore } from 'react';

import type { PresenceSnapshot, PresenceTarget } from '@/features/presence/types';

import { getPresenceSnapshot, subscribePresence } from './presenceStore';

export function usePresence(target: PresenceTarget): PresenceSnapshot {
  return useSyncExternalStore(
    subscribePresence,
    () => getPresenceSnapshot(target),
    () => getPresenceSnapshot(target),
  );
}
