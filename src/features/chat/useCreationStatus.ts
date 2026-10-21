import { useCallback, useEffect, useRef, useState } from 'react';

import type { MessageMeta } from '@/features/chat/types';

import type { CreationState } from '~/features/auth/api/auth.api';
import { getOnboardingDraftRecord } from '~/features/creation/onboardingDraft.api';
import { httpClient } from '~/platform/http';

export const CREATION_POLL_MS = 1500;
export const CREATION_NONE_CHAT_MAX_MS = 30_000;
export const CREATION_READY_TIMEOUT_MS = 90_000;

export type CreationSteps = {
  personality?: boolean;
  interests?: boolean;
  greeting?: boolean;
  portrait?: boolean;
};

export type CreationFirstMessage = {
  id: string;
  content: string;
  meta?: MessageMeta;
};

export type CompanionCreationStatus = {
  state: CreationState;
  error?: { code?: string };
  steps?: CreationSteps;
  profile?: {
    id?: string;
    name?: string;
    avatarUrl?: string;
    visualStyle?: string;
    gender?: string;
  };
  firstMessage?: CreationFirstMessage;
};

export async function fetchCompanionCreationStatus(): Promise<CompanionCreationStatus> {
  const response = await httpClient.get<CompanionCreationStatus>('/companion/me/creation', undefined, {
    suppressFatalBoundary: true,
  });
  return response.data;
}

export function useCreationStatus(retryKey = 0) {
  const [status, setStatus] = useState<CompanionCreationStatus>({ state: 'none' });
  const [pollError, setPollError] = useState<string | null>(null);
  const [awaitingFromDraft, setAwaitingFromDraft] = useState(false);
  const startedAtRef = useRef(Date.now());
  const noneChatUntilRef = useRef<number | null>(null);

  useEffect(() => {
    startedAtRef.current = Date.now();
    noneChatUntilRef.current = null;
    setPollError(null);
    setAwaitingFromDraft(false);
  }, [retryKey]);

  const pollOnce = useCallback(async (): Promise<'stop' | 'continue'> => {
    const elapsed = Date.now() - startedAtRef.current;
    if (elapsed > CREATION_READY_TIMEOUT_MS) {
      setStatus((prev) => ({
        ...prev,
        state: 'error',
        error: { code: 'TIMEOUT' },
      }));
      return 'stop';
    }

    let next: CompanionCreationStatus;
    try {
      next = await fetchCompanionCreationStatus();
      setPollError(null);
    } catch {
      setPollError('poll');
      return 'continue';
    }

    setStatus(next);

    if (next.state === 'ready' || next.state === 'error') {
      return 'stop';
    }

    if (next.state === 'creating') {
      return 'continue';
    }

    if (next.state === 'none') {
      if (noneChatUntilRef.current === null) {
        const draft = await getOnboardingDraftRecord().catch(() => null);
        if (draft?.data?.webView === 'chat') {
          noneChatUntilRef.current = Date.now() + CREATION_NONE_CHAT_MAX_MS;
          setAwaitingFromDraft(true);
        } else {
          return 'stop';
        }
      }
      if (noneChatUntilRef.current !== null && Date.now() > noneChatUntilRef.current) {
        return 'stop';
      }
    }

    return 'continue';
  }, []);

  useEffect(() => {
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout> | undefined;

    const loop = async () => {
      const action = await pollOnce();
      if (cancelled || action === 'stop') return;
      timer = setTimeout(() => void loop(), CREATION_POLL_MS);
    };

    void loop();

    return () => {
      cancelled = true;
      if (timer) clearTimeout(timer);
    };
  }, [pollOnce, retryKey]);

  return {
    status,
    state: status.state,
    steps: status.steps ?? {},
    profile: status.profile,
    firstMessage: status.firstMessage,
    isCreating: status.state === 'creating' || awaitingFromDraft,
    pollError,
  };
}
