// AUTO-SINCRONIZADO desde ejoiFE 9234854dc9f9992b39b7f61dfb0e02b768be467d@9234854dc9f9992b39b7f61dfb0e02b768be467d:src/features/presence/types.ts. No editar: npm run sync:app
/**
 * Tipos para presencia en vivo (client-side).
 */

export type PresenceState =
  | 'online'
  | 'typing'
  | 'listening'
  | 'thinking'
  | 'recording'
  | 'away'
  | 'offline'
  | 'reconnecting';

export type PresenceTarget = 'me' | 'companion';

export type PresenceSignalKey = 'typing' | 'listening' | 'recording' | 'sending';

export interface PresenceSignals {
  typing: boolean;
  listening: boolean;
  recording: boolean;
  sending: boolean;
}

export interface PresenceTargetSlice {
  signals: PresenceSignals;
  /** Última actividad relevante (ms epoch); para lastSeen */
  lastActivityAt: number;
}

export interface CompanionPresenceSlice extends PresenceTargetSlice {
  hasCompanion: boolean;
}

export interface PresenceSliceInput {
  signals: PresenceSignals;
  lastActivityAt: number;
  appActive: boolean;
  networkOnline: boolean;
  userIdle: boolean;
  hasCompanion?: boolean;
}

export interface PresenceSnapshot {
  state: PresenceState;
  /** ISO string cuando aplica (away/offline) */
  lastSeen: string | null;
}
