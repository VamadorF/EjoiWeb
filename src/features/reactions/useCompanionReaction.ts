import { useCallback, useEffect, useRef, useState } from 'react';

import type { InstantReaction, ReactionKind } from '@/features/chat/types';
import { IDLE_AFK_REACTION_MS, SPONTANEOUS_REACTIONS } from '@/features/chat/utils/inferReaction';

const VISIBLE_DURATION_MS = 2400;
const TRIGGER_DELAY_MS = 150;
const COOLDOWN_MS = 1200;
const AFK_SCHEDULE_JITTER_MS = 45_000;
const SPONTANEOUS_COOLDOWN_MS = 90_000;

type TriggerOptions = {
  fromServer?: boolean;
  interactionPhase?: InstantReaction['interactionPhase'];
};

export type UseCompanionReactionResult = {
  current: InstantReaction | null;
  trigger: (kind: ReactionKind, options?: TriggerOptions) => void;
  notifyActivity: () => void;
  clear: () => void;
};

const pickRandom = <T,>(arr: readonly T[]): T => arr[Math.floor(Math.random() * arr.length)];

export function useCompanionReaction(options: { enabled?: boolean; spontaneousEnabled?: boolean } = {}): UseCompanionReactionResult {
  const { enabled = true, spontaneousEnabled = true } = options;
  const [current, setCurrent] = useState<InstantReaction | null>(null);

  const lastTriggerAtRef = useRef(0);
  const lastSpontaneousAtRef = useRef(0);
  const userInteractionSeenRef = useRef(false);
  const hideTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const showTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const idleTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearAllTimers = useCallback(() => {
    if (hideTimeoutRef.current) clearTimeout(hideTimeoutRef.current);
    if (showTimeoutRef.current) clearTimeout(showTimeoutRef.current);
    if (idleTimeoutRef.current) clearTimeout(idleTimeoutRef.current);
    hideTimeoutRef.current = null;
    showTimeoutRef.current = null;
    idleTimeoutRef.current = null;
  }, []);

  const showReaction = useCallback((reaction: InstantReaction) => {
    if (hideTimeoutRef.current) clearTimeout(hideTimeoutRef.current);
    setCurrent(reaction);
    hideTimeoutRef.current = setTimeout(() => {
      setCurrent(null);
      hideTimeoutRef.current = null;
    }, VISIBLE_DURATION_MS);
  }, []);

  const trigger = useCallback<UseCompanionReactionResult['trigger']>(
    (kind, opts) => {
      if (!enabled) return;
      const now = Date.now();
      if (now - lastTriggerAtRef.current < COOLDOWN_MS) return;
      lastTriggerAtRef.current = now;
      if (showTimeoutRef.current) clearTimeout(showTimeoutRef.current);
      showTimeoutRef.current = setTimeout(() => {
        showReaction({
          kind,
          fromServer: opts?.fromServer,
          interactionPhase: opts?.interactionPhase,
        });
        showTimeoutRef.current = null;
      }, TRIGGER_DELAY_MS);
    },
    [enabled, showReaction],
  );

  const scheduleSpontaneous = useCallback(() => {
    if (!enabled || !spontaneousEnabled || !userInteractionSeenRef.current) return;
    if (idleTimeoutRef.current) clearTimeout(idleTimeoutRef.current);
    const lo = Math.max(IDLE_AFK_REACTION_MS - AFK_SCHEDULE_JITTER_MS, COOLDOWN_MS + 2000);
    const hi = IDLE_AFK_REACTION_MS + AFK_SCHEDULE_JITTER_MS;
    const delay = lo + Math.random() * (hi - lo);
    idleTimeoutRef.current = setTimeout(() => {
      idleTimeoutRef.current = null;
      const now = Date.now();
      if (
        now - lastTriggerAtRef.current >= COOLDOWN_MS &&
        now - lastSpontaneousAtRef.current >= SPONTANEOUS_COOLDOWN_MS
      ) {
        lastSpontaneousAtRef.current = now;
        lastTriggerAtRef.current = now;
        showReaction({ kind: pickRandom(SPONTANEOUS_REACTIONS) });
      }
      scheduleSpontaneous();
    }, delay);
  }, [enabled, spontaneousEnabled, showReaction]);

  const notifyActivity = useCallback(() => {
    userInteractionSeenRef.current = true;
    scheduleSpontaneous();
  }, [scheduleSpontaneous]);

  const clear = useCallback(() => {
    clearAllTimers();
    setCurrent(null);
  }, [clearAllTimers]);

  useEffect(() => {
    if (!enabled || !spontaneousEnabled) userInteractionSeenRef.current = false;
    else if (userInteractionSeenRef.current) scheduleSpontaneous();
    return () => clearAllTimers();
  }, [enabled, spontaneousEnabled, scheduleSpontaneous, clearAllTimers]);

  return { current, trigger, notifyActivity, clear };
}

export const POST_ASSISTANT_REACTION_DELAY_MS = 350;
