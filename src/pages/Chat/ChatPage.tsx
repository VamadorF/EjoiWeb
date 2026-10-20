import { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router';

import { sendChatMessage } from '@/features/chat/api/chat.api';
import type { OnboardingData } from '@/features/onboarding/types';

import { Composer } from '~/features/chat/Composer';
import { MessageList, type ChatBubble } from '~/features/chat/MessageList';
import {
  clearPending,
  dispatchPendingMessage,
  loadPending,
  resolveUserIdFromSession,
  savePending,
  sendMessageWithClientId,
} from '~/features/chat/pendingMessage';
import { QuickReplies } from '~/features/chat/QuickReplies';
import { useCreationStatus } from '~/features/chat/useCreationStatus';
import { usePortraitGeneration } from '~/features/chat/usePortraitGeneration';
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

export default function ChatPage() {
  const { t } = useTranslation('web');
  const navigate = useNavigate();
  const [retryKey, setRetryKey] = useState(0);
  const { state, steps, profile, firstMessage, isCreating } = useCreationStatus(retryKey);
  const [draftData, setDraftData] = useState<OnboardingData | null>(null);
  const [pending, setPending] = useState<Awaited<ReturnType<typeof loadPending>>>(null);
  const [pendingFailed, setPendingFailed] = useState(false);
  const [dispatching, setDispatching] = useState(false);

  const companionName =
    profile?.name?.trim() || draftData?.companionName?.trim() || 'tu eJoi';
  const companionId = profile?.id;
  const isReady = state === 'ready';
  const isError = state === 'error';

  const portrait = usePortraitGeneration({
    steps,
    onboardingData: draftData,
    canPatchCompanion: isReady || Boolean(steps.personality),
    profileAvatarUrl: profile?.avatarUrl,
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
      if (!userId) return;

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
      } catch {
        setPendingFailed(true);
      }
    },
    [companionId, isReady, pending],
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

  const bubbles = useMemo((): ChatBubble[] => {
    const list: ChatBubble[] = [];
    if (firstMessage?.content) {
      list.push({
        id: firstMessage.id,
        role: 'assistant',
        text: firstMessage.content,
      });
    }
    if (pending) {
      list.push({
        id: pending.clientMessageId,
        role: 'user',
        text: pending.text,
        pending: !isReady || dispatching,
        failed: pendingFailed,
        onRetry: pendingFailed ? retryPending : undefined,
      });
    }
    return list;
  }, [
    dispatching,
    firstMessage,
    isReady,
    pending,
    pendingFailed,
    retryPending,
  ]);

  const quickReplies = firstMessage?.meta?.quickReplies ?? [];
  const basedOn = firstMessage?.meta?.basedOnInterests ?? [];
  const samplePortrait = draftData ? stylePortraitSrc(draftData.visualStyle, draftData.gender) : null;
  const showPortrait = portrait.avatarUrl || samplePortrait;
  const blurPortrait = !steps.portrait && !portrait.avatarUrl;

  const profilePanel = (
    <div className="chat-profile-card" data-testid="chat-profile-card">
      {showPortrait ? (
        <div className="chat-profile-card__portrait-wrap">
          <img
            src={portrait.avatarUrl ?? samplePortrait ?? undefined}
            alt=""
            className={`chat-profile-card__portrait${blurPortrait ? ' chat-profile-card__portrait--blur' : ''}`}
          />
          {blurPortrait ? (
            <span className="chat-profile-card__portrait-label">{t('chat.portrait_on_way')}</span>
          ) : null}
        </div>
      ) : null}
      {isReady ? <p className="chat-page__online">{t('chat.online')}</p> : null}
      {portrait.state === 'error' ? (
        <button type="button" className="chat-profile-card__retry" onClick={portrait.retry}>
          {t('chat.portrait_retry')}
        </button>
      ) : null}
    </div>
  );

  return (
    <ChatShell menu={<span>{t('menu.chat')}</span>} profile={profilePanel}>
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

        <MessageList messages={bubbles} loading={!isReady && !isCreating && !isError && state === 'none'} />

        {isReady ? <QuickReplies replies={quickReplies} onSelect={(text) => void handleSend(text)} /> : null}

        <Composer
          hint={isCreating ? t('chat.can_write') : undefined}
          disabled={dispatching}
          onSend={handleSend}
        />
      </div>
    </ChatShell>
  );
}
