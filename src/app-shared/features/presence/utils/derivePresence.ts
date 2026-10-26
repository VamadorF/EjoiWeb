// AUTO-SINCRONIZADO desde ejoiFE 9234854dc9f9992b39b7f61dfb0e02b768be467d@9234854dc9f9992b39b7f61dfb0e02b768be467d:src/features/presence/utils/derivePresence.ts. No editar: npm run sync:app
import type { PresenceSliceInput, PresenceSnapshot, PresenceTarget } from '../types';

/**
 * Prioridad: recording > listening > typing > thinking (solo companion) >
 * reconnecting > away > online > offline (solo companion sin hasCompanion)
 */
export function derivePresence(target: PresenceTarget, input: PresenceSliceInput): PresenceSnapshot {
  const { signals, lastActivityAt, appActive, networkOnline, userIdle, hasCompanion } = input;

  const lastSeen =
    lastActivityAt > 0 ? new Date(lastActivityAt).toISOString() : null;

  if (target === 'companion' && hasCompanion === false) {
    return { state: 'offline', lastSeen };
  }

  if (signals.recording) {
    return { state: 'recording', lastSeen: null };
  }
  if (signals.listening) {
    return { state: 'listening', lastSeen: null };
  }
  if (signals.typing) {
    return { state: 'typing', lastSeen: null };
  }
  if (target === 'companion' && signals.sending) {
    return { state: 'thinking', lastSeen: null };
  }

  if (!networkOnline) {
    return { state: 'reconnecting', lastSeen: null };
  }

  if (!appActive || userIdle) {
    return { state: 'away', lastSeen };
  }

  return { state: 'online', lastSeen: null };
}
