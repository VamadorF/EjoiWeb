import { derivePresence } from '@/features/presence/utils/derivePresence';
import type {
  CompanionPresenceSlice,
  PresenceSignalKey,
  PresenceSnapshot,
  PresenceTarget,
  PresenceTargetSlice,
} from '@/features/presence/types';

type Listener = () => void;

const defaultSignals = () => ({
  typing: false,
  listening: false,
  recording: false,
  sending: false,
});

type StoreState = {
  me: PresenceTargetSlice;
  companion: CompanionPresenceSlice;
  appActive: boolean;
  networkOnline: boolean;
  userIdle: boolean;
  lastInteractionAt: number;
};

let state: StoreState = {
  me: { signals: defaultSignals(), lastActivityAt: Date.now() },
  companion: { signals: defaultSignals(), lastActivityAt: Date.now(), hasCompanion: false },
  appActive: true,
  networkOnline: true,
  userIdle: false,
  lastInteractionAt: Date.now(),
};

const listeners = new Set<Listener>();

function emit() {
  listeners.forEach((l) => l());
}

function setState(patch: Partial<StoreState> | ((prev: StoreState) => StoreState)) {
  state = typeof patch === 'function' ? patch(state) : { ...state, ...patch };
  emit();
}

export function subscribePresence(listener: Listener): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function getLastInteractionAt(): number {
  return state.lastInteractionAt;
}

export function getPresenceSnapshot(target: PresenceTarget): PresenceSnapshot {
  const slice = target === 'me' ? state.me : state.companion;
  return derivePresence(target, {
    signals: slice.signals,
    lastActivityAt: slice.lastActivityAt,
    appActive: state.appActive,
    networkOnline: state.networkOnline,
    userIdle: state.userIdle,
    hasCompanion: target === 'companion' ? state.companion.hasCompanion : undefined,
  });
}

export const presenceActions = {
  setSignal(target: 'me' | 'companion', key: PresenceSignalKey, value: boolean) {
    setState((prev) => {
      if (target === 'me') {
        return {
          ...prev,
          me: { ...prev.me, signals: { ...prev.me.signals, [key]: value } },
        };
      }
      return {
        ...prev,
        companion: {
          ...prev.companion,
          signals: { ...prev.companion.signals, [key]: value },
        },
      };
    });
  },

  setCompanionHasCompanion(has: boolean) {
    setState((prev) => ({
      ...prev,
      companion: { ...prev.companion, hasCompanion: has },
    }));
  },

  setAppActive(active: boolean) {
    setState({ appActive: active });
    if (active) presenceActions.bumpInteraction();
  },

  setNetworkOnline(online: boolean) {
    setState({ networkOnline: online });
  },

  setUserIdle(idle: boolean) {
    setState({ userIdle: idle });
  },

  bumpInteraction() {
    setState({ lastInteractionAt: Date.now() });
  },

  touchActivity(target: 'me' | 'companion' | 'both' = 'both') {
    const now = Date.now();
    const THROTTLE_MS = 5000;
    setState((prev) => {
      let nextMe = prev.me;
      let nextCo = prev.companion;
      if ((target === 'me' || target === 'both') && now - prev.me.lastActivityAt >= THROTTLE_MS) {
        nextMe = { ...prev.me, lastActivityAt: now };
      }
      if ((target === 'companion' || target === 'both') && now - prev.companion.lastActivityAt >= THROTTLE_MS) {
        nextCo = { ...prev.companion, lastActivityAt: now };
      }
      return { ...prev, me: nextMe, companion: nextCo };
    });
  },
};
