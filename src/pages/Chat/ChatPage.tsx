import { QueryClient, QueryClientProvider, useInfiniteQuery } from '@tanstack/react-query';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useNavigate } from 'react-router';

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
import { AppIcon } from '~/components/AppIcon';
import { ChatShell } from '~/layout/ChatShell';
import { httpClient } from '~/platform/http';

import './ChatPage.css';

const QUOTA_LOW_THRESHOLD = 10;

const CREATION_STEP_KEYS = [
  ['personality', 'chat.step_personality'],
  ['interests', 'chat.step_interests'],
  ['greeting', 'chat.step_greeting'],
  ['portrait', 'chat.step_portrait'],
] as const;

const READY_MOMENT_MS = 2000;

const INTENSITY_LABEL_KEYS: Record<
  string,
  'create.presence_soft' | 'create.presence_balanced' | 'create.presence_intense'
> = {
  soft: 'create.presence_soft',
  balanced: 'create.presence_balanced',
  intense: 'create.presence_intense',
};

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
  const [readyMoment, setReadyMoment] = useState(false);
  const prevCreationStateRef = useRef<string>('none');
  const { state, steps, profile, firstMessage, isCreating } = useCreationStatus(retryKey);
  const [draftData, setDraftData] = useState<OnboardingData | null>(null);
  const [pending, setPending] = useState<Awaited<ReturnType<typeof loadPending>>>(null);
  const [pendingFailed, setPendingFailed] = useState(false);
  const [dispatching, setDispatching] = useState(false);

  const isReady = state === 'ready';
  const isError = state === 'error';
  const showConversation = isReady && !readyMoment;

  useEffect(() => {
    const prev = prevCreationStateRef.current;
    prevCreationStateRef.current = state;
    if (prev === 'creating' && state === 'ready') {
      setReadyMoment(true);
      const timer = window.setTimeout(() => setReadyMoment(false), READY_MOMENT_MS);
      return () => window.clearTimeout(timer);
    }
    if (state !== 'ready') {
      setReadyMoment(false);
    }
  }, [state]);
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
        basedOnInterests: firstMessage.meta?.basedOnInterests,
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
  const messagesRemaining = subscription?.messagesRemaining;
  const showQuotaLow =
    isReady &&
    !quotaOut &&
    messagesRemaining != null &&
    messagesRemaining <= QUOTA_LOW_THRESHOLD;
  const samplePortrait = draftData ? stylePortraitSrc(draftData.visualStyle, draftData.gender) : null;
  const portraitUrl = portrait.avatarUrl ?? profileData?.avatarUrl ?? profile?.avatarUrl ?? samplePortrait;
  const headerPortrait = portraitUrl ?? samplePortrait;
  const showPortrait = Boolean(portraitUrl);
  const blurPortrait = !steps.portrait && !portrait.avatarUrl && !profileData?.avatarUrl;

  const composerDisabled = dispatching || (isReady && quotaOut);
  const composerHint = quotaOut
    ? t('chat.quota_out')
    : isCreating
      ? t('chat.can_write')
      : undefined;

  const summaryPersona = profileData?.persona?.trim() || draftData?.persona?.trim() || '';
  const summaryIntensity = profileData?.intensity ?? draftData?.intensity;
  const summaryPresenceKey = summaryIntensity ? INTENSITY_LABEL_KEYS[summaryIntensity] : undefined;
  const summaryPresence = summaryPresenceKey ? t(summaryPresenceKey) : '';
  const summaryInterests = (profileData?.interests?.length ? profileData.interests : draftData?.interests ?? [])
    .slice(0, 3)
    .join(', ');

  return (
    <ChatShell menu={<SideMenu />} profile={
      <ProfilePanel
        profile={profileData ?? null}
        draft={draftData}
        profileLoading={profileQueryEnabled && profileLoading}
        profileError={profileQueryEnabled && profileLoadError}
        onRetryProfile={() => void refetchProfile()}
        portraitUrl={showPortrait ? portraitUrl : null}
        portraitBlur={blurPortrait}
        portraitPendingLabel={blurPortrait ? t('chat.portrait_on_way') : null}
        onRetryPortrait={portrait.state === 'error' ? portrait.retry : undefined}
        showOnline={showConversation}
      />
    }>
      <div className="chat-shell__read-inner">
        {showConversation ? (
          <header className="chat-conv-header" data-testid="chat-conv-header">
            <div className="chat-conv-header__peer">
              {headerPortrait ? (
                <div className="chat-conv-header__avatar-wrap">
                  <img src={headerPortrait} alt="" className="avatar avatar--44 chat-conv-header__avatar" />
                  <span className="chat-conv-header__status" aria-hidden="true" />
                </div>
              ) : null}
              <div>
                <p className="chat-conv-header__name">{companionName}</p>
                <p className="chat-conv-header__online">{t('chat.online')}</p>
              </div>
            </div>
            {!quotaLoading && messagesRemaining != null ? (
              <p className="chat-conv-header__quota" data-testid="chat-quota">
                {t('chat.quota_remaining', { count: messagesRemaining })}
              </p>
            ) : null}
          </header>
        ) : null}

        {showConversation && summaryInterests ? (
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

        {showConversation && showQuotaLow ? (
          <p className="banner--warn chat-conv-banner" role="status" data-testid="chat-quota-low">
            {t('chat.quota_low', { count: messagesRemaining })}
          </p>
        ) : null}

        {showConversation && quotaOut ? (
          <p className="banner--warn chat-conv-banner" role="status">
            {t('chat.quota_out')}
          </p>
        ) : null}

        {isError ? (
          <div className="banner--error chat-page__banner" role="alert" data-testid="chat-error-banner">
            <p>{t('chat.error_banner', { name: companionName })}</p>
            <div className="chat-page__banner-actions">
              <button type="button" className="btn btn--primary btn--m" onClick={() => void retryCreation()}>
                {t('chat.error_retry')}
              </button>
              <button type="button" className="btn btn--text btn--m" onClick={() => navigate('/crear/como')}>
                {t('chat.error_review')}
              </button>
            </div>
          </div>
        ) : null}

        {isCreating ? (
          <section className="card chat-page__creating" data-testid="chat-creating-panel">
            {headerPortrait ? (
              <img
                src={headerPortrait}
                alt=""
                className="avatar avatar--168 avatar--blur chat-page__creating-portrait"
              />
            ) : null}
            <h2 className="chat-page__creating-title">{t('chat.creating_title', { name: companionName })}</h2>
            <ul className="chat-page__creating-pills">
              {choiceTags.map((tag) => (
                <li key={tag.id}>
                  <span className="pill">{tag.label}</span>
                </li>
              ))}
            </ul>
            <ul className="chat-page__steps">
              {CREATION_STEP_KEYS.map(([key, labelKey]) => (
                <li
                  key={key}
                  className={steps[key] ? 'chat-page__step chat-page__step--done' : 'chat-page__step'}
                >
                  {steps[key] ? (
                    <AppIcon name="checkmark-circle" className="chat-page__step-icon chat-page__step-icon--done" />
                  ) : (
                    <span className="spinner chat-page__step-spinner" aria-hidden="true" />
                  )}
                  {t(labelKey)}
                </li>
              ))}
            </ul>
            <p className="chat-page__creating-hint">{t('chat.can_write')}</p>
          </section>
        ) : null}

        {readyMoment ? (
          <section className="card chat-page__ready-moment" data-testid="chat-ready-moment">
            {headerPortrait ? (
              <img
                src={headerPortrait}
                alt=""
                className="avatar avatar--168 chat-page__ready-portrait"
              />
            ) : null}
            <AppIcon name="checkmark-circle" className="chat-page__ready-check" aria-hidden="true" />
            <p className="chat-page__ready-text">{t('chat.ready_moment', { name: companionName })}</p>
          </section>
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
            messages={readyMoment ? [] : bubbles}
            loading={!isReady && !isCreating && !isError && state === 'none'}
            showFirstMessageNote={showConversation && basedOn.length > 0}
          />
        </div>

        {showConversation && !quotaOut ? (
          <QuickReplies replies={quickReplies} onSelect={(text) => void handleSend(text)} />
        ) : null}

        <Composer hint={composerHint} disabled={composerDisabled} onSend={handleSend} />
      </div>
    </ChatShell>
  );
}
