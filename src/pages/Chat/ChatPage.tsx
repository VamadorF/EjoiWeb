import { useInfiniteQuery, useQueryClient } from '@tanstack/react-query';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router';

import { getChatMessages } from '@/features/chat/api/chat.api';
import { mergeAndSortChatMessages } from '@/features/chat/utils/mergeChatPages';
import { inferReaction } from '@/features/chat/utils/inferReaction';
import { generateIcebreakerSuggestions } from '@/shared/utils/companionTextGenerator';
import type { Companion } from '@/features/companion/types';
import { queryKeys } from '@/shared/lib/queryKeys';

import { Composer } from '~/features/chat/Composer';
import { useChatSession } from '~/features/chat/ChatSessionProvider';
import { Icebreakers } from '~/features/chat/Icebreakers';
import { MessageList, type ChatBubble, firstMessageToBubble } from '~/features/chat/MessageList';
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
import { useGenderedTextWith } from '~/features/gender/useGenderedText';
import { presenceActions } from '~/features/presence/presenceStore';
import { usePresenceSignals } from '~/features/presence/usePresenceSignals';
import { POST_ASSISTANT_REACTION_DELAY_MS } from '~/features/reactions/useCompanionReaction';

import './ChatPage.css';

const QUOTA_LOW_THRESHOLD = 10;

const INTENSITY_LABEL_KEYS: Record<
  string,
  'create.presence_soft' | 'create.presence_balanced' | 'create.presence_intense'
> = {
  soft: 'create.presence_soft',
  balanced: 'create.presence_balanced',
  intense: 'create.presence_intense',
};

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

  const { trigger: triggerReaction, notifyActivity } = useChatSession();
  const mePresence = usePresenceSignals('me');
  const companionPresence = usePresenceSignals('companion');

  const [pending, setPending] = useState<Awaited<ReturnType<typeof loadPending>>>(null);
  const [pendingFailed, setPendingFailed] = useState(false);
  const [sending, setSending] = useState(false);
  const lastInstantReactionRef = useRef<string | undefined>(undefined);

  const companionName = profileData?.name?.trim() || 'tu eJoi';
  const companionGender = (profileData?.gender ?? '') as '' | 'femenino' | 'masculino' | 'neutro';
  const gendered = useGenderedTextWith(companionGender);
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
  } = useInfiniteQuery({
    queryKey: queryKeys.chat.messages(companionId ?? 'pending'),
    queryFn: ({ pageParam }: { pageParam: string | undefined }) =>
      getChatMessages({
        companionId,
        limit: 50,
        beforeMessageId: pageParam,
      }),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => {
      if (!lastPage.hasMore) return undefined;
      const oldest = lastPage.messages.at(-1);
      return oldest?.id;
    },
    enabled: isReady && Boolean(companionId),
  });

  const historyMessages = useMemo(() => {
    if (!historyData?.pages.length) return [];
    return mergeAndSortChatMessages(historyData.pages);
  }, [historyData?.pages]);

  const retryPending = useCallback(async () => {
    if (!pending || !companionId) return;
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
        triggerReaction(inferred, { interactionPhase: 'user_message' });
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
              triggerReaction(post, { interactionPhase: 'assistant_message' });
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

  const bubbles = useMemo((): ChatBubble[] => {
    const byId = new Map<string, ChatBubble>();

    for (const msg of historyMessages) {
      byId.set(msg.id, firstMessageToBubble(msg));
    }

    if (firstMessage?.content) {
      byId.set(firstMessage.id, {
        id: firstMessage.id,
        role: 'assistant',
        text: firstMessage.content,
        basedOnInterests: firstMessage.meta?.basedOnInterests,
        createdAt: new Date().toISOString(),
      });
    }

    if (pending) {
      byId.set(pending.clientMessageId, {
        id: pending.clientMessageId,
        role: 'user',
        text: pending.text,
        createdAt: pending.createdAt,
        pending: sending && !pendingFailed,
        failed: pendingFailed,
        onRetry: pendingFailed ? () => void retryPending() : undefined,
      });
    }

    return [...byId.values()].sort((a, b) => {
      const ta = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const tb = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      return ta - tb;
    });
  }, [firstMessage, historyMessages, pending, pendingFailed, retryPending, sending]);

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

  const summaryPersonaRaw = profileData?.persona?.trim() || '';
  const summaryPersona = summaryPersonaRaw ? gendered.trait(summaryPersonaRaw) : '';
  const summaryIntensity = profileData?.intensity;
  const summaryPresenceKey = summaryIntensity ? INTENSITY_LABEL_KEYS[summaryIntensity] : undefined;
  const summaryPresence = summaryPresenceKey ? t(summaryPresenceKey) : '';
  const summaryInterests = (profileData?.interests ?? []).slice(0, 3).join(', ');

  const composerDisabled = !isReady || quotaOut || sending;
  const composerHint = quotaOut ? t('chat.quota_out') : undefined;

  return (
    <div className="home-shell__read-inner">
      {isReady && summaryInterests ? (
        <div className="banner--info chat-page__summary" data-testid="chat-summary-banner">
          <p className="chat-page__summary-text">
            {t('chat.summary', {
              name: companionName,
              persona: summaryPersona,
              presence: summaryPresence,
              interests: summaryInterests,
            })}
          </p>
          <Link to="/chat/editar" className="btn btn--text chat-page__summary-edit">
            {t('chat.summary_edit')}
          </Link>
        </div>
      ) : null}

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

      <div className="chat-thread">
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
          showFirstMessageNote={isReady && basedOn.length > 0}
          companionId={companionId}
          showTyping={sending}
        />
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
