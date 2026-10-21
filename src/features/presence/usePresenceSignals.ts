import { useCallback, useMemo } from 'react';

import type { PresenceSignalKey } from '@/features/presence/types';

import { presenceActions } from './presenceStore';

export type PresenceSignalSetters = {
  setTyping: (value: boolean) => void;
  setListening: (value: boolean) => void;
  setRecording: (value: boolean) => void;
  setSending: (value: boolean) => void;
  touchActivity: () => void;
};

export function usePresenceSignals(target: 'me' | 'companion'): PresenceSignalSetters {
  const set = useCallback(
    (key: PresenceSignalKey, value: boolean) => {
      presenceActions.setSignal(target, key, value);
    },
    [target],
  );

  return useMemo(
    () => ({
      setTyping: (value) => set('typing', value),
      setListening: (value) => set('listening', value),
      setRecording: (value) => set('recording', value),
      setSending: (value) => set('sending', value),
      touchActivity: () => {
        presenceActions.touchActivity(target);
        presenceActions.bumpInteraction();
      },
    }),
    [set, target],
  );
}
