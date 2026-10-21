import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { buildChatListItems } from '@/features/chat/utils/buildChatListItems';
import type { Message } from '@/features/chat/types';
import { resolveChatMediaUrl } from '@/features/chat/utils/resolveChatMediaUrl';

import { AppIcon } from '~/components/AppIcon';
import { ENABLE_TTS } from '~/platform/env';

import { splitInterestHighlights } from './highlightInterests';
import {
  getMessageReaction,
  REACTION_EMOJIS,
  setMessageReaction,
  type ReactionEmoji,
} from '~/features/reactions/messageReactions';
import { TypingIndicator } from './TypingIndicator';

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
  showTyping?: boolean;
};

export function MessageList({
  messages,
  loading,
  showFirstMessageNote,
  companionId,
  showTyping,
}: MessageListProps) {
  const { t } = useTranslation();
  const { t: tWeb } = useTranslation('web');
  const [reactions, setReactions] = useState<Record<string, ReactionEmoji>>({});
  const [reactionPickerFor, setReactionPickerFor] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  useEffect(() => {
    if (!companionId) return;
    void (async () => {
      const next: Record<string, ReactionEmoji> = {};
      for (const msg of messages) {
        const emoji = await getMessageReaction(companionId, msg.id);
        if (emoji) next[msg.id] = emoji;
      }
      setReactions(next);
    })();
  }, [companionId, messages]);

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
                {body.map((part, index) =>
                  part.highlight ? (
                    <strong key={index} className="bubble__hl">
                      {part.text}
                    </strong>
                  ) : (
                    <span key={index}>{part.text}</span>
                  ),
                )}
              </p>
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
                  onClick={() => void copyText(msg.id, msg.text)}
                >
                  {copiedId === msg.id ? t('chat.bubble.copied') : t('chat.bubble.copy_message')}
                </button>
                {ENABLE_TTS && isAssistant ? (
                  <button type="button" className="btn btn--text chat-messages__tts" disabled>
                    {t('chat.bubble.play_tts')}
                  </button>
                ) : null}
                <button
                  type="button"
                  className="btn btn--text chat-messages__react"
                  aria-expanded={reactionPickerFor === msg.id}
                  onClick={() => setReactionPickerFor((id) => (id === msg.id ? null : msg.id))}
                >
                  {reaction ? reaction : '☺'}
                </button>
              </div>
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
              {reaction ? <span className="chat-messages__reaction-badge">{reaction}</span> : null}
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
