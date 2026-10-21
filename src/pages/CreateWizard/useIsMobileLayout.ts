import { useEffect, useState } from 'react';

import { BREAKPOINTS } from '~/theme/breakpoints';

const MOBILE_QUERY = `(max-width: ${BREAKPOINTS.MEDIUM - 1}px)`;

function readMobile(): boolean {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
    return false;
  }
  return window.matchMedia(MOBILE_QUERY).matches;
}

export function useIsMobileLayout(): boolean {
  const [mobile, setMobile] = useState(readMobile);

  useEffect(() => {
    if (typeof window.matchMedia !== 'function') return undefined;
    const mq = window.matchMedia(MOBILE_QUERY);
    const sync = () => setMobile(mq.matches);
    sync();
    mq.addEventListener('change', sync);
    return () => mq.removeEventListener('change', sync);
  }, []);

  return mobile;
}
