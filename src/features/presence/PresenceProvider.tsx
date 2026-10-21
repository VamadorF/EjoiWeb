import type { ReactNode } from 'react';

import { usePresenceController } from './usePresenceController';

export function PresenceProvider({ children }: { children: ReactNode }) {
  usePresenceController();
  return children;
}
