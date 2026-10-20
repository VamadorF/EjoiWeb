import { QueryClient, QueryClientProvider, useInfiniteQuery } from '@tanstack/react-query';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router';

import { getChatMessages, sendChatMessage } from '@/features/chat/api/chat.api';
import { mergeAndSortChatMessages } from '@/features/chat/utils/mergeChatPages';
import { queryKeys } from '@/shared/lib/queryKeys';
import type { OnboardingData } from '@/features/onboarding/types';

import { Composer } from '~/features/chat/Composer';
import { MessageList, type ChatBubble, firstMessageToBubble } from '~/features/chat/MessageList';
import { ProfilePanel } from '~/features/chat/ProfilePanel';
import {
  clearPending,
  dispatchPendingMessage,
  loadPending,
  resolveUserIdFromSession,
  savePending,
  sendMessageWithClientId,
} from '~/features/chat/pendingMessage';
import { QuickReplies } from '~/features/chat/QuickReplies';
import { SideMenu } from '~/features/chat/SideMenu';
import { useCreationStatus } from '~/features/chat/useCreationStatus';
import { usePortraitGeneration } from '~/features/chat/usePortraitGeneration';
import { useProfile } from '~/features/chat/useProfile';
import { isQuotaExhausted, useQuota } from '~/features/chat/useQuota';
import {
  buildCreateCompanionPayload,
} from '~/features/creation/startCreation';
import {
  emptyOnboardingData,
  getOnboardingDraftRecord,
  mergeDraftIntoData,
} from '~/features/creation/onboardingDraft.api';
import { stylePortraitSrc } from '~/features/creation/portraits';
import { buildPreviewTags } from '~/features/creation/whoValidation';
import { ChatShell } from '~/layout/ChatShell';
import { httpClient } from '~/platform/http';

import './ChatPage.css';

const CREATION_STEP_KEYS = [
  ['personality', 'chat.step_personality'],
  ['interests', 'chat.step_interests'],
  ['greeting', 'chat.step_greeting'],
  ['portrait', 'chat.step_portrait'],
] as const;

const chatQueryClient = new QueryClient({
  defaultOptions: { queries: { retry: false } },
});

export default function ChatPage() {
  return (
    <QueryClientProvider client={chatQueryClient}>
      <ChatPageContent />
    </QueryClientProvider>
  );
}

function ChatPageContent() {
  const { t } = useTranslation('web');
  const navigate = useNavigate();
  const [retryKey, setRetryKey] = useState(0);
  const { state, steps, profile, firstMessage, isCreating } = useCreationStatus(retryKey);
  const [draftData, setDraftData] = useState<OnboardingData | null>(null);
  const [pending, setPending] = useState<Awaited<ReturnType<typeof loadPending>>>(null);
  const [pendingFailed, setPendingFailed] = useState(false);
  const [dispatching, setDispatching] = useState(false);

  const isReady = state === 'ready';
  const isError = state === 'error';
  const profileQueryEnabled = isReady;

  const {
    data: profileData,
    isLoading: profileLoading,
    isError: profileLoadError,
    refetch: refetchProfile,
  } = useProfile(profileQueryEnabled);

  const { data: subscription, isLoading: quotaLoading } = useQuota(isReady);
  const quotaOut = isQuotaExhausted(subscription);

  const companionName =
    profileData?.name?.trim() ||
    profile?.name?.trim() ||
    draftData?.companionName?.trim() ||
    'tu eJoi';
  const companionId = profileData?.id ?? profile?.id;

  const portrait = usePortraitGeneration({
    steps,
    onboardingData: draftData,
    canPatchCompanion: isReady || Boolean(steps.personality),
    profileAvatarUrl: profileData?.avatarUrl ?? profile?.avatarUrl,
  });

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

  useEffect(() => {
    void (async () => {
      const draft = await getOnboardingDraftRecord().catch(() => null);
      if (draft?.data) {
        setDraftData(mergeDraftIntoData(emptyOnboardingData(), draft.data));
      }
      const userId = resolveUserIdFromSession();
      if (userId) {
        setPending(await loadPending(userId));
      }
    })();
  }, []);

  const flushPending = useCallback(async () => {
    const userId = resolveUserIdFromSession();
    if (!userId || !pending || dispatching) return;
    setDispatching(true);
    setPendingFailed(false);
    const result = await dispatchPendingMessage(pending, companionId);
    if (result.outcome === 'sent' || result.outcome === 'duplicate') {
      await clearPending(userId);
      setPending(null);
    } else if (result.outcome === 'failed') {
      setPendingFailed(true);
    }
    setDispatching(false);
  }, [companionId, dispatching, pending]);

  useEffect(() => {
    if (isReady && pending) {
      void flushPending();
    }
  }, [isReady, pending, flushPending]);

  const handleSend = useCallback(
    async (text: string) => {
      const userId = resolveUserIdFromSession();
      if (!userId || quotaOut) return;

      if (!isReady) {
        const next = {
          clientMessageId: crypto.randomUUID(),
          text,
          createdAt: new Date().toISOString(),
        };
        await savePending(userId, next);
        setPending(next);
        setPendingFailed(false);
        return;
      }

      try {
        if (pending?.text === text) {
          await sendMessageWithClientId({
            message: text,
            clientMessageId: pending.clientMessageId,
            companionId,
          });
          await clearPending(userId);
          setPending(null);
        } else {
          await sendChatMessage({ message: text, companionId });
        }
        setPendingFailed(false);
        void refetchHistory();
      } catch {
        setPendingFailed(true);
      }
    },
    [companionId, isReady, pending, quotaOut, refetchHistory],
  );

  const retryCreation = useCallback(async () => {
    if (!draftData) return;
    void httpClient
      .post('/companion/me', buildCreateCompanionPayload(draftData))
      .catch(() => undefined);
    setRetryKey((k) => k + 1);
  }, [draftData]);

  const retryPending = useCallback(() => {
    void flushPending();
  }, [flushPending]);

  const choiceTags = useMemo(() => {
    if (!draftData) return [];
    const timeline = [
      'gender',
      'style',
      ...draftData.interests.map((interest) => `interest:${interest}`),
    ];
    return buildPreviewTags(draftData, timeline);
  }, [draftData]);

  const historyMessages = useMemo(() => {
    if (!historyData?.pages.length) return [];
    return mergeAndSortChatMessages(historyData.pages);
  }, [historyData?.pages]);

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
      });
    }

    if (pending) {
      byId.set(pending.clientMessageId, {
        id: pending.clientMessageId,
        role: 'user',
        text: pending.text,
        pending: !isReady || dispatching,
        failed: pendingFailed,
        onRetry: pendingFailed ? retryPending : undefined,
      });
    }

    return [...byId.values()];
  }, [
    dispatching,
    firstMessage,
    historyMessages,
    isReady,
    pending,
    pendingFailed,
    retryPending,
  ]);

  const quickReplies = firstMessage?.meta?.quickReplies ?? [];
  const basedOn = firstMessage?.meta?.basedOnInterests ?? [];
  const samplePortrait = draftData ? stylePortraitSrc(draftData.visualStyle, draftData.gender) : null;
  const portraitUrl = portrait.avatarUrl ?? profileData?.avatarUrl ?? profile?.avatarUrl ?? samplePortrait;
  const showPortrait = Boolean(portraitUrl);
  const blurPortrait = !steps.portrait && !portrait.avatarUrl && !profileData?.avatarUrl;

  const composerDisabled = dispatching || (isReady && quotaOut);
  const composerHint = quotaOut
    ? t('chat.quota_out')
    : isCreating
      ? t('chat.can_write')
      : undefined;

  return (
    <ChatShell menu={<SideMenu />} profile={
      <ProfilePanel
        profile={profileData ?? null}
        draft={draftData}
        subscription={subscription ?? null}
        quotaLoading={quotaLoading}
        profileLoading={profileQueryEnabled && profileLoading}
        profileError={profileQueryEnabled && profileLoadError}
        onRetryProfile={() => void refetchProfile()}
        portraitUrl={showPortrait ? portraitUrl : null}
        portraitBlur={blurPortrait}
        portraitPendingLabel={blurPortrait ? t('chat.portrait_on_way') : null}
        onRetryPortrait={portrait.state === 'error' ? portrait.retry : undefined}
        showOnline={isReady}
      />
    }>
      <div className="chat-shell__read-inner">
        {isError ? (
          <div className="chat-page__banner" role="alert" data-testid="chat-error-banner">
            <p>{t('chat.error_banner', { name: companionName })}</p>
            <div className="chat-page__banner-actions">
              <button type="button" onClick={() => void retryCreation()}>
                {t('chat.retry')}
              </button>
              <button type="button" onClick={() => navigate('/crear/como')}>
                {t('chat.back_to_step3')}
              </button>
            </div>
          </div>
        ) : null}

        {isCreating ? (
          <section className="chat-page__progress" data-testid="chat-creating-panel">
            <h2 className="chat-page__progress-title">
              {t('chat.creating_title', { name: companionName })}
            </h2>
            <ul className="chat-page__choices">
              {choiceTags.map((tag) => (
                <li key={tag.id} className="chat-page__choice">
                  {tag.label}
                </li>
              ))}
            </ul>
            <ul className="chat-page__steps">
              {CREATION_STEP_KEYS.map(([key, labelKey]) => (
                <li
                  key={key}
                  className={steps[key] ? 'chat-page__step chat-page__step--done' : 'chat-page__step'}
                >
                  <span aria-hidden="true">{steps[key] ? '✓' : '○'}</span>
                  {t(labelKey)}
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        {isReady && basedOn.length > 0 ? (
          <p className="chat-page__based-on">{t('chat.based_on')}</p>
        ) : null}

        {hasNextPage ? (
          <button
            type="button"
            className="chat-page__load-history"
            disabled={isFetchingNextPage}
            onClick={() => void fetchNextPage()}
          >
            {t('chat.load_older')}
          </button>
        ) : null}

        <MessageList
          messages={bubbles}
          loading={!isReady && !isCreating && !isError && state === 'none'}
        />

        {isReady && !quotaOut ? (
          <QuickReplies replies={quickReplies} onSelect={(text) => void handleSend(text)} />
        ) : null}

        <Composer hint={composerHint} disabled={composerDisabled} onSend={handleSend} />
      </div>
    </ChatShell>
  );
}
