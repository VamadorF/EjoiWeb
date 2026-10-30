import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';

import { buildChatListItems } from '@/features/chat/utils/buildChatListItems';
import type { InstantReaction, Message } from '@/features/chat/types';
import { resolveChatMediaUrl } from '@/features/chat/utils/resolveChatMediaUrl';

import { AppIcon } from '~/components/AppIcon';
import { readSessionUser, resolveUserInitials } from '~/features/account/useCurrentUser';
import { stylePortraitSrc } from '~/features/creation/portraits';
import { ENABLE_TTS } from '~/platform/env';
import { useThemePreference } from '~/theme/theme';

import { AparicionText } from './AparicionText';
import { emptyAparicion, noteAparicion } from './aparicion';
import { splitInterestHighlights } from './highlightInterests';
import { useProfile } from './useProfile';
import { CompanionReactionBubble } from '~/features/reactions/CompanionReactionBubble';
import {
  getMessageReaction,
  REACTION_EMOJIS,
  setMessageReaction,
  type ReactionEmoji,
} from '~/features/reactions/messageReactions';
import type { ShownReaction } from '~/features/reactions/useCompanionReaction';
import { TypingIndicator } from './TypingIndicator';

export type ReactionAnchorOpts = {
  /** Reacción 1: el mensaje anterior. Reacción 2: el id de la respuesta, si ya está en el hilo. */
  anchorMessageId?: string;
  /** Cola justo antes de enviar. La reacción 2 no se ancla ahí. */
  beforeSendId?: string;
};

/**
 * Reacción 1 (`user_message`): el mensaje anterior al nuevo.
 * Reacción 2 (`assistant_message`): el mensaje nuevo (la respuesta).
 * Sin fase (espontánea): el último del hilo.
 */
export function reactionAnchorId(
  messages: readonly { id: string; role: 'user' | 'assistant' }[],
  phase: InstantReaction['interactionPhase'],
  opts?: ReactionAnchorOpts,
): string | null {
  if (phase === 'user_message') return opts?.anchorMessageId ?? null;
  if (phase === 'assistant_message') {
    const pinned = opts?.anchorMessageId;
    if (pinned && messages.some((m) => m.id === pinned)) return pinned;
    const last = messages[messages.length - 1];
    if (!last || last.role !== 'assistant') return null;
    if (opts?.beforeSendId && last.id === opts.beforeSendId) return null;
    return last.id;
  }
  if (messages.length === 0) return null;
  return messages[messages.length - 1]!.id;
}

const isPhasedReaction = (reaction: ShownReaction | null | undefined): reaction is ShownReaction =>
  reaction?.interactionPhase === 'user_message' || reaction?.interactionPhase === 'assistant_message';

function BubbleFace({
  src,
  initials,
  reaction,
  instant,
}: {
  src?: string;
  initials: string;
  reaction?: string;
  instant?: ReactNode;
}) {
  const [broken, setBroken] = useState(false);
  useEffect(() => setBroken(false), [src]);
  return (
    <span className="chat-messages__who">
      {src && !broken ? (
        <img src={src} alt="" className="chat-messages__who-photo" onError={() => setBroken(true)} />
      ) : (
        <span className="chat-messages__who-photo chat-messages__who-photo--initials" aria-hidden="true">
          {initials}
        </span>
      )}
      {reaction ? (
        <span className="chat-messages__reaction-badge" data-testid="chat-message-reaction">
          {reaction}
        </span>
      ) : null}
      {instant}
    </span>
  );
}

export type ChatBubble = {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  createdAt?: string;
  basedOnInterests?: string[];
  pending?: boolean;
  failed?: boolean;
  onRetry?: () => void;
  attachments?: Message['attachments'];
};

export type MessageListProps = {
  messages: ChatBubble[];
  loading?: boolean;
  showFirstMessageNote?: boolean;
  companionId?: string;
  companionName?: string;
  instantReaction?: ShownReaction | null;
  showTyping?: boolean;
  /** Historial ya cargado: lo que haya en ese momento no se anima. */
  historyReady?: boolean;
};

export function MessageList({
  messages,
  loading,
  showFirstMessageNote,
  companionId,
  companionName = '',
  instantReaction = null,
  showTyping,
  historyReady = false,
}: MessageListProps) {
  const { t } = useTranslation();
  const { t: tWeb } = useTranslation('web');
  const { preference } = useThemePreference();
  const watchRef = useRef(emptyAparicion());
  const replayBlockRef = useRef(new Set<string>());
  const watchCompanion = useRef(companionId);
  const [reactions, setReactions] = useState<Record<string, string>>({});
  const pendingPlaceRef = useRef<ShownReaction | null>(null);
  const bubblePinRef = useRef<{ reaction: ShownReaction; id: string } | null>(null);
  const [reactionPickerFor, setReactionPickerFor] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const { data: profile } = useProfile(Boolean(companionId));
  const sessionUser = readSessionUser();
  const companionSrc =
    profile?.avatarUrl ||
    stylePortraitSrc(
      (profile?.visualStyle ?? '') as Parameters<typeof stylePortraitSrc>[0],
      (profile?.gender ?? '') as Parameters<typeof stylePortraitSrc>[1],
    ) ||
    undefined;
  const userSrc = sessionUser?.picture || undefined;
  const companionInitials = resolveUserInitials(companionName);
  const userInitials = resolveUserInitials(sessionUser?.name, sessionUser?.email);

  useEffect(() => {
    if (!companionId) return;
    let cancel = false;
    void (async () => {
      const stored: Record<string, string> = {};
      for (const msg of messages) {
        const emoji = await getMessageReaction(companionId, msg.id);
        if (emoji) stored[msg.id] = emoji;
      }
      if (cancel) return;
      setReactions((prev) => {
        const next: Record<string, string> = {};
        for (const msg of messages) {
          const emoji = stored[msg.id] ?? prev[msg.id];
          if (emoji) next[msg.id] = emoji;
        }
        return next;
      });
    })();
    return () => {
      cancel = true;
    };
  }, [companionId, messages]);

  useEffect(() => {
    if (!isPhasedReaction(instantReaction)) return;
    if (pendingPlaceRef.current !== instantReaction) pendingPlaceRef.current = instantReaction;
  }, [instantReaction]);

  useEffect(() => {
    const waiting = pendingPlaceRef.current;
    if (!companionId || !waiting?.glyph) return;
    const id = reactionAnchorId(messages, waiting.interactionPhase, {
      anchorMessageId: waiting.anchorMessageId,
      beforeSendId: waiting.beforeSendId,
    });
    if (!id) return;
    pendingPlaceRef.current = null;
    const glyph = waiting.glyph;
    void setMessageReaction(companionId, id, glyph);
    setReactions((prev) => ({ ...prev, [id]: glyph }));
  }, [companionId, instantReaction, messages]);

  const copyText = useCallback(async (id: string, text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(id);
      window.setTimeout(() => setCopiedId(null), 1500);
    } catch {
      /* ponytail: sin fallback de copia */
    }
  }, []);

  const pickReaction = useCallback(
    async (messageId: string, emoji: ReactionEmoji) => {
      if (!companionId) return;
      await setMessageReaction(companionId, messageId, emoji);
      setReactions((prev) => ({ ...prev, [messageId]: emoji }));
      setReactionPickerFor(null);
    },
    [companionId],
  );

  if (watchCompanion.current !== companionId) {
    watchCompanion.current = companionId;
    watchRef.current = emptyAparicion();
    replayBlockRef.current = new Set();
  }
  if (!loading && historyReady) {
    watchRef.current = noteAparicion(watchRef.current, messages, preference === 'aparicion');
  }
  if (preference !== 'aparicion') {
    for (const id of watchRef.current.play) replayBlockRef.current.add(id);
  }

  if (loading) {
    return (
      <div className="chat-messages chat-messages--loading" data-testid="chat-messages-loading">
        <div className="chat-messages__skeleton" />
        <div className="chat-messages__skeleton chat-messages__skeleton--short" />
      </div>
    );
  }

  const asMessages: Message[] = messages.map((msg) => ({
    id: msg.id,
    companionId: companionId ?? 'pending',
    role: msg.role,
    message: msg.text,
    createdAt: msg.createdAt ?? new Date().toISOString(),
    attachments: msg.attachments,
    meta: msg.basedOnInterests?.length ? { basedOnInterests: msg.basedOnInterests } : undefined,
  }));

  const items = buildChatListItems(asMessages);
  let firstAssistantSeen = false;
  let bubbleId: string | null = null;
  if (instantReaction) {
    if (bubblePinRef.current?.reaction === instantReaction) {
      bubbleId = bubblePinRef.current.id;
    } else {
      bubbleId = reactionAnchorId(messages, instantReaction.interactionPhase, {
        anchorMessageId: instantReaction.anchorMessageId,
        beforeSendId: instantReaction.beforeSendId,
      });
      if (bubbleId) bubblePinRef.current = { reaction: instantReaction, id: bubbleId };
    }
  }
  const hideStoredForInstant = isPhasedReaction(instantReaction);

  return (
    <ul className="chat-messages" data-testid="chat-messages">
      {items.map((item) => {
        if (item.type === 'date') {
          return (
            <li key={item.id} className="chat-messages__date">
              {item.label}
            </li>
          );
        }
        if (item.type !== 'message') return null;

        const msg = messages.find((m) => m.id === item.message.id);
        if (!msg) return null;

        const isAssistant = msg.role === 'assistant';
        const showNote = showFirstMessageNote && isAssistant && !firstAssistantSeen;
        if (isAssistant) firstAssistantSeen = true;

        const bubbleClass = isAssistant ? 'bubble--ai' : 'bubble--user';
        const body =
          showNote && msg.basedOnInterests?.length
            ? splitInterestHighlights(msg.text, msg.basedOnInterests)
            : [{ text: msg.text }];

        const reaction = reactions[msg.id];
        const animate =
          isAssistant &&
          preference === 'aparicion' &&
          watchRef.current.play.has(msg.id) &&
          !replayBlockRef.current.has(msg.id);

        return (
          <li
            key={item.id}
            className={`chat-messages__item${item.compactTop ? ' chat-messages__item--compact' : ''}`}
          >
            <div
              className={`${bubbleClass}${msg.pending ? ' chat-messages__bubble--pending' : ''}${
                msg.failed ? ' chat-messages__bubble--failed' : ''
              }`}
            >
              {msg.attachments?.map((att, index) =>
                att.type === 'image' ? (
                  <img
                    key={`${msg.id}-img-${index}`}
                    src={resolveChatMediaUrl(att.url)}
                    alt={t('chat.bubble.image_a11y')}
                    className="chat-messages__image"
                  />
                ) : null,
              )}
              <p>
                {animate ? (
                  <AparicionText text={msg.text} />
                ) : (
                  body.map((part, index) =>
                    part.highlight ? (
                      <strong key={index} className="bubble__hl">
                        {part.text}
                      </strong>
                    ) : (
                      <span key={index}>{part.text}</span>
                    ),
                  )
                )}
              </p>
              <div className={`chat-messages__foot${isAssistant ? '' : ' chat-messages__foot--mine'}`}>
                <BubbleFace
                  src={isAssistant ? companionSrc : userSrc}
                  initials={isAssistant ? companionInitials : userInitials}
                  reaction={bubbleId === msg.id && hideStoredForInstant ? undefined : reaction}
                  instant={
                    bubbleId === msg.id && instantReaction ? (
                      <CompanionReactionBubble
                        reaction={instantReaction}
                        companionName={companionName}
                        glyph={instantReaction.glyph}
                      />
                    ) : null
                  }
                />
                <div className="chat-messages__meta">
                {msg.pending ? (
                  <span className="chat-messages__pending-label">
                    <AppIcon name="time-outline" className="chat-messages__pending-icon" />
                    {t('chat.bubble.sending')}
                  </span>
                ) : null}
                <button
                  type="button"
                  className="btn btn--text chat-messages__copy"
                  aria-label={copiedId === msg.id ? t('chat.bubble.copied') : t('chat.bubble.copy_message')}
                  onClick={() => void copyText(msg.id, msg.text)}
                >
                  <AppIcon name={copiedId === msg.id ? 'checkmark' : 'copy-outline'} />
                </button>
                {ENABLE_TTS && isAssistant ? (
                  <button type="button" className="btn btn--text chat-messages__tts" disabled>
                    {t('chat.bubble.play_tts')}
                  </button>
                ) : null}
                <span className="chat-messages__react-anchor">
                  <button
                    type="button"
                    className="btn btn--text chat-messages__react"
                    aria-expanded={reactionPickerFor === msg.id}
                    aria-label={t('chat.reactions.title')}
                    onClick={() => setReactionPickerFor((id) => (id === msg.id ? null : msg.id))}
                  >
                    <AppIcon name="happy-outline" />
                  </button>
                  {reactionPickerFor === msg.id ? (
                    <div className="chat-messages__reaction-picker" role="group" aria-label={t('chat.reactions.title')}>
                      {REACTION_EMOJIS.map((emoji) => (
                        <button
                          key={emoji}
                          type="button"
                          className="chat-messages__reaction-btn"
                          onClick={() => void pickReaction(msg.id, emoji)}
                        >
                          {emoji}
                        </button>
                      ))}
                    </div>
                  ) : null}
                </span>
                </div>
              </div>
              {msg.failed && msg.onRetry ? (
                <button type="button" className="btn btn--text chat-messages__retry" onClick={msg.onRetry}>
                  {t('chat.bubble.retry')}
                </button>
              ) : null}
            </div>
            {showNote ? (
              <p className="chat-messages__based-on">
                <AppIcon name="sparkles-outline" className="chat-messages__based-on-icon" />
                {tWeb('chat.based_on')}
              </p>
            ) : null}
          </li>
        );
      })}
      {showTyping ? <TypingIndicator /> : null}
    </ul>
  );
}

export function firstMessageToBubble(message: Message): ChatBubble {
  return {
    id: message.id,
    role: message.role === 'assistant' ? 'assistant' : 'user',
    text: message.message,
    createdAt: message.createdAt,
    basedOnInterests: message.meta?.basedOnInterests,
    attachments: message.attachments,
  };
}
