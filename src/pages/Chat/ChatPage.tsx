import { useInfiniteQuery, useQueryClient } from '@tanstack/react-query';
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { getChatMessages } from '@/features/chat/api/chat.api';
import { mergeAndSortChatMessages } from '@/features/chat/utils/mergeChatPages';
import { inferReaction } from '@/features/chat/utils/inferReaction';
import { generateIcebreakerSuggestions } from '@/shared/utils/companionTextGenerator';
import type { Companion } from '@/features/companion/types';
import { queryKeys } from '@/shared/lib/queryKeys';

import { AppIcon } from '~/components/AppIcon';
import { Composer } from '~/features/chat/Composer';
import { useChatSession } from '~/features/chat/ChatSessionProvider';
import { Icebreakers } from '~/features/chat/Icebreakers';
import { buildChatBubbles } from '~/features/chat/buildChatBubbles';
import {
  commitChatThreadScroll,
  planThreadScroll,
  readChatThreadScroll,
  showJumpToLatest,
} from '~/features/chat/chatThreadScroll';
import { getOlderHistoryPageParam } from '~/features/chat/historyPagination';
import { MessageList, type ChatBubble } from '~/features/chat/MessageList';
import {
  clearPending,
  loadPending,
  resolveUserIdFromSession,
  savePending,
  sendMessageWithClientId,
} from '~/features/chat/pendingMessage';
import { QuickReplies } from '~/features/chat/QuickReplies';
import { useCreationStatus } from '~/features/chat/useCreationStatus';
import { useProfile } from '~/features/chat/useProfile';
import { isQuotaExhausted, resolveMessagesRemaining, useQuota } from '~/features/chat/useQuota';
import { presenceActions } from '~/features/presence/presenceStore';
import { usePresenceSignals } from '~/features/presence/usePresenceSignals';
import { POST_ASSISTANT_REACTION_DELAY_MS } from '~/features/reactions/useCompanionReaction';

import './ChatPage.css';

const QUOTA_LOW_THRESHOLD = 10;

export default function ChatPage() {
  const { t } = useTranslation('web');
  const { t: tChat } = useTranslation();
  const { state, firstMessage } = useCreationStatus(0);
  const isReady = state === 'ready';
  const { data: profileData } = useProfile(isReady);
  const { data: subscription } = useQuota(isReady);
  const quotaOut = isQuotaExhausted(subscription);
  const queryClient = useQueryClient();
  // El BE descuenta el cupo en cada envío (también rechaza con cupo agotado): refrescar como en móvil.
  const refreshQuota = useCallback(
    () => void queryClient.invalidateQueries({ queryKey: queryKeys.subscription.me }),
    [queryClient],
  );

  const { trigger: triggerReaction, notifyActivity, current: instantReaction } = useChatSession();
  const mePresence = usePresenceSignals('me');
  const companionPresence = usePresenceSignals('companion');

  const [pending, setPending] = useState<Awaited<ReturnType<typeof loadPending>>>(null);
  const [pendingFailed, setPendingFailed] = useState(false);
  const [sending, setSending] = useState(false);
  const lastInstantReactionRef = useRef<string | undefined>(undefined);
  const followSendRef = useRef(false);
  const tailAtSendRef = useRef<string | undefined>(undefined);
  const bubblesRef = useRef<ChatBubble[]>([]);
  const wasAtBottomRef = useRef(false);

  const companionName = profileData?.name?.trim() || 'tu eJoi';
  const companionId = profileData?.id;

  useEffect(() => {
    presenceActions.setCompanionHasCompanion(Boolean(companionId));
  }, [companionId]);

  useEffect(() => {
    const userId = resolveUserIdFromSession();
    if (!userId) return;
    void loadPending(userId).then((loaded) => {
      if (!loaded) return;
      setPending(loaded);
      setPendingFailed(true);
    });
  }, []);

  const {
    data: historyData,
    hasNextPage,
    isFetchingNextPage,
    fetchNextPage,
    refetch: refetchHistory,
    isSuccess: historyReady,
  } = useInfiniteQuery({
    queryKey: queryKeys.chat.messages(companionId ?? 'pending'),
    queryFn: ({ pageParam }: { pageParam: string | undefined }) =>
      getChatMessages({
        companionId,
        limit: 50,
        beforeMessageId: pageParam,
      }),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: getOlderHistoryPageParam,
    enabled: isReady && Boolean(companionId),
  });

  const historyMessages = useMemo(() => {
    if (!historyData?.pages.length) return [];
    return mergeAndSortChatMessages(historyData.pages);
  }, [historyData?.pages]);

  const retryPending = useCallback(async () => {
    if (!pending || !companionId) return;
    followSendRef.current = true;
    const atRetry = bubblesRef.current;
    const retryTail = atRetry[atRetry.length - 1];
    tailAtSendRef.current =
      retryTail?.id === pending.clientMessageId ? atRetry[atRetry.length - 2]?.id : retryTail?.id;
    setSending(true);
    setPendingFailed(false);
    companionPresence.setSending(true);
    try {
      await sendMessageWithClientId({
        message: pending.text,
        clientMessageId: pending.clientMessageId,
        companionId,
      });
      const userId = resolveUserIdFromSession();
      if (userId) await clearPending(userId);
      setPending(null);
      void refetchHistory();
    } catch {
      setPendingFailed(true);
    } finally {
      setSending(false);
      companionPresence.setSending(false);
      refreshQuota();
    }
  }, [companionId, companionPresence, pending, refetchHistory, refreshQuota]);

  const handleSend = useCallback(
    async (text: string) => {
      const userId = resolveUserIdFromSession();
      if (!userId || !isReady || quotaOut || !companionId || sending) return;
      followSendRef.current = true;
      const atSend = bubblesRef.current;
      const sendTail = atSend[atSend.length - 1];
      tailAtSendRef.current =
        sendTail?.id === pending?.clientMessageId ? atSend[atSend.length - 2]?.id : sendTail?.id;
      const beforeSendId = tailAtSendRef.current;

      notifyActivity();
      mePresence.touchActivity();

      const inferred = inferReaction(
        text,
        lastInstantReactionRef.current as Parameters<typeof inferReaction>[1],
        profileData?.interests ?? [],
        null,
        profileData?.boundaries ?? [],
        null,
        'user_message',
      );
      if (inferred) {
        lastInstantReactionRef.current = inferred;
        triggerReaction(inferred, { interactionPhase: 'user_message', anchorMessageId: beforeSendId });
      }

      setSending(true);
      companionPresence.setSending(true);
      setPendingFailed(false);

      const clientMessageId = pending?.text === text ? pending.clientMessageId : crypto.randomUUID();
      const optimistic: typeof pending = {
        clientMessageId,
        text,
        createdAt: new Date().toISOString(),
      };
      setPending(optimistic);

      try {
        const result = await sendMessageWithClientId({
          message: text,
          clientMessageId,
          companionId,
        });
        await clearPending(userId);
        setPending(null);
        void refetchHistory();

        const assistantText = result.assistantMessage?.message;
        if (assistantText) {
          window.setTimeout(() => {
            const post = inferReaction(
              assistantText,
              lastInstantReactionRef.current as Parameters<typeof inferReaction>[1],
              profileData?.interests ?? [],
              result.assistantMessage?.topic ?? null,
              profileData?.boundaries ?? [],
              result.assistantMessage?.mood ?? null,
              'assistant_message',
            );
            if (post) {
              lastInstantReactionRef.current = post;
              triggerReaction(post, {
                interactionPhase: 'assistant_message',
                anchorMessageId: result.assistantMessage?.id,
                beforeSendId,
              });
            }
          }, POST_ASSISTANT_REACTION_DELAY_MS);
        }
      } catch {
        await savePending(userId, optimistic);
        setPendingFailed(true);
      } finally {
        setSending(false);
        companionPresence.setSending(false);
        refreshQuota();
      }
    },
    [
      companionId,
      companionPresence,
      isReady,
      mePresence,
      notifyActivity,
      pending,
      profileData?.boundaries,
      profileData?.interests,
      quotaOut,
      refetchHistory,
      refreshQuota,
      sending,
      triggerReaction,
    ],
  );

  const onDraftChange = useCallback(
    (draft: string) => {
      mePresence.setTyping(draft.trim().length > 0);
      if (draft.trim()) {
        window.setTimeout(() => notifyActivity(), 2200);
      }
    },
    [mePresence, notifyActivity],
  );

  const [introFallbackAt] = useState(() => new Date().toISOString());

  const bubbles = useMemo((): ChatBubble[] => {
    const pendingBubble: ChatBubble | undefined = pending
      ? {
          id: pending.clientMessageId,
          role: 'user',
          text: pending.text,
          createdAt: pending.createdAt,
          pending: sending && !pendingFailed,
          failed: pendingFailed,
          onRetry: pendingFailed ? () => void retryPending() : undefined,
        }
      : undefined;

    return buildChatBubbles({
      history: historyMessages,
      hasMore: hasNextPage,
      firstMessage,
      introFallbackAt,
      pending: pendingBubble,
    });
  }, [firstMessage, hasNextPage, historyMessages, introFallbackAt, pending, pendingFailed, retryPending, sending]);
  bubblesRef.current = bubbles;

  const hasUserMessage = bubbles.some((b) => b.role === 'user');
  const quickReplies = firstMessage?.meta?.quickReplies ?? [];
  const basedOn = firstMessage?.meta?.basedOnInterests ?? [];
  const messagesRemaining = resolveMessagesRemaining(subscription);
  const showQuotaLow =
    isReady && !quotaOut && messagesRemaining != null && messagesRemaining <= QUOTA_LOW_THRESHOLD;

  const icebreakerSuggestions = useMemo(() => {
    if (!profileData?.id) return [];
    const companionForIcebreakers: Companion = {
      id: profileData.id,
      name: profileData.name ?? companionName,
      gender: (profileData.gender ?? 'femenino') as Companion['gender'],
      visualStyle: (profileData.visualStyle ?? 'realista') as Companion['visualStyle'],
      persona: profileData.persona ?? '',
      tone: '',
      interactionStyle: '',
      conversationDepth: '',
      interests: profileData.interests ?? [],
      boundaries: profileData.boundaries ?? [],
    };
    const fromCompanion = generateIcebreakerSuggestions(companionForIcebreakers);
    const fallbacks = [tChat('chat.icebreaker.fallback_1'), tChat('chat.icebreaker.fallback_2')];
    const merged = [...fromCompanion];
    for (const line of fallbacks) {
      if (merged.length >= 3) break;
      if (!merged.includes(line)) merged.push(line);
    }
    return merged.slice(0, 3);
  }, [companionName, profileData, tChat]);

  const showIcebreakers =
    isReady && !quotaOut && !hasUserMessage && !sending && icebreakerSuggestions.length > 0;

  const composerDisabled = !isReady || quotaOut || sending;
  const composerHint = quotaOut ? t('chat.quota_out') : undefined;

  const threadRef = useRef<HTMLDivElement>(null);
  const restoredScrollRef = useRef(false);
  const [showJump, setShowJump] = useState(false);

  const persistThreadScroll = useCallback(() => {
    if (!restoredScrollRef.current) return;
    const el = threadRef.current;
    if (!el?.querySelector('[data-testid="chat-messages"]')) return;
    wasAtBottomRef.current = !showJumpToLatest(el);
    commitChatThreadScroll(el);
    setShowJump(!wasAtBottomRef.current);
  }, []);

  useLayoutEffect(() => {
    if (!isReady) return;
    const el = threadRef.current;
    if (!el) return;
    const plan = planThreadScroll({
      box: el,
      saved: readChatThreadScroll(),
      restorePending: !restoredScrollRef.current,
      followSend: followSendRef.current,
      wasAtBottom: wasAtBottomRef.current,
    });
    if (plan === 'wait') return;
    restoredScrollRef.current = true;
    wasAtBottomRef.current = plan === 'end' || !showJumpToLatest(el);
    if (plan === 'end') commitChatThreadScroll(el);
    setShowJump(!wasAtBottomRef.current);
    // ponytail: el follow se suelta cuando el último mensaje ya no es el de antes del envío.
    // Un stream que sigue creciendo el mismo id se sigue solo si el usuario no se fue del fondo.
    const tail = bubbles[bubbles.length - 1];
    const tailMoved = tail?.id !== tailAtSendRef.current;
    if (followSendRef.current && !sending && (pendingFailed || (!pending && tailMoved))) {
      followSendRef.current = false;
    }
  }, [bubbles, isReady, pending, pendingFailed, sending]);

  useLayoutEffect(() => {
    const el = threadRef.current;
    return () => {
      // El skeleton no scrollea de verdad: no pisar el offset de la visita anterior.
      if (!restoredScrollRef.current) return;
      if (!el?.querySelector('[data-testid="chat-messages"]')) return;
      commitChatThreadScroll(el);
    };
  }, []);

  useEffect(() => {
    const el = threadRef.current;
    if (!el) return;
    el.addEventListener('scroll', persistThreadScroll, { passive: true });
    window.addEventListener('pagehide', persistThreadScroll);
    return () => {
      el.removeEventListener('scroll', persistThreadScroll);
      window.removeEventListener('pagehide', persistThreadScroll);
    };
  }, [persistThreadScroll]);

  const jumpToLatest = useCallback(() => {
    const el = threadRef.current;
    if (!el) return;
    el.scrollTop = el.scrollHeight;
    wasAtBottomRef.current = true;
    commitChatThreadScroll(el);
    setShowJump(false);
  }, []);

  return (
    <div className="home-shell__read-inner">
      {isReady && showQuotaLow ? (
        <p className="banner--warn chat-conv-banner" role="status" data-testid="chat-quota-low">
          {t('chat.quota_low', { count: messagesRemaining })}
        </p>
      ) : null}

      {isReady && quotaOut ? (
        <p className="banner--warn chat-conv-banner" role="status">
          {t('chat.quota_out')}
        </p>
      ) : null}

      <div className="chat-thread" ref={threadRef}>
        {hasNextPage ? (
          <button
            type="button"
            className="btn btn--text chat-page__load-history"
            disabled={isFetchingNextPage}
            onClick={() => void fetchNextPage()}
          >
            {t('chat.load_older')}
          </button>
        ) : null}

        <MessageList
          messages={bubbles}
          loading={!isReady}
          historyReady={historyReady}
          showFirstMessageNote={isReady && basedOn.length > 0}
          companionId={companionId}
          companionName={companionName}
          instantReaction={instantReaction}
          showTyping={sending}
        />
        {showJump ? (
          <button
            type="button"
            className="btn btn--secondary btn--icon chat-thread__jump"
            aria-label="Bajar al último mensaje"
            onClick={jumpToLatest}
          >
            <AppIcon name="chevron-down-outline" />
          </button>
        ) : null}
      </div>

      {showIcebreakers ? (
        <Icebreakers suggestions={icebreakerSuggestions} onSelect={(text) => void handleSend(text)} />
      ) : null}

      {isReady && !quotaOut && quickReplies.length > 0 ? (
        <QuickReplies replies={quickReplies} onSelect={(text) => void handleSend(text)} />
      ) : null}

      <Composer
        hint={composerHint}
        disabled={composerDisabled}
        onSend={handleSend}
        onDraftChange={onDraftChange}
      />
    </div>
  );
}
