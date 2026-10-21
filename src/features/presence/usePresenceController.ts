import { useEffect, useRef } from 'react';

import { getLastInteractionAt, presenceActions } from './presenceStore';

const IDLE_MS = 60_000;
const TICK_MS = 1000;

export function usePresenceController(): void {
  const lastIdleRef = useRef(false);

  useEffect(() => {
    const onVisibility = () => {
      presenceActions.setAppActive(document.visibilityState === 'visible');
    };
    onVisibility();
    document.addEventListener('visibilitychange', onVisibility);
    return () => document.removeEventListener('visibilitychange', onVisibility);
  }, []);

  useEffect(() => {
    const sync = () => presenceActions.setNetworkOnline(navigator.onLine);
    sync();
    window.addEventListener('online', sync);
    window.addEventListener('offline', sync);
    return () => {
      window.removeEventListener('online', sync);
      window.removeEventListener('offline', sync);
    };
  }, []);

  useEffect(() => {
    const id = window.setInterval(() => {
      const idle = Date.now() - getLastInteractionAt() >= IDLE_MS;
      if (idle !== lastIdleRef.current) {
        lastIdleRef.current = idle;
        presenceActions.setUserIdle(idle);
      }
    }, TICK_MS);
    return () => window.clearInterval(id);
  }, []);
}
