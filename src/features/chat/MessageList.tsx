import { useTranslation } from 'react-i18next';

import { AppIcon } from '~/components/AppIcon';

import type { Message } from '@/features/chat/types';

export type ChatBubble = {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  pending?: boolean;
  failed?: boolean;
  onRetry?: () => void;
};

export type MessageListProps = {
  messages: ChatBubble[];
  loading?: boolean;
  showFirstMessageNote?: boolean;
};

export function MessageList({ messages, loading, showFirstMessageNote }: MessageListProps) {
  const { t } = useTranslation('web');
  let firstAssistantSeen = false;

  if (loading) {
    return (
      <div className="chat-messages chat-messages--loading" data-testid="chat-messages-loading">
        <div className="chat-messages__skeleton" />
        <div className="chat-messages__skeleton chat-messages__skeleton--short" />
      </div>
    );
  }

  return (
    <ul className="chat-messages" data-testid="chat-messages">
      {messages.map((msg) => {
        const isAssistant = msg.role === 'assistant';
        const showNote = showFirstMessageNote && isAssistant && !firstAssistantSeen;
        if (isAssistant) firstAssistantSeen = true;

        const bubbleClass = isAssistant ? 'bubble--ai' : 'bubble--user';

        return (
          <li key={msg.id} className="chat-messages__item">
            <div
              className={`${bubbleClass}${msg.pending ? ' chat-messages__bubble--pending' : ''}${
                msg.failed ? ' chat-messages__bubble--failed' : ''
              }`}
            >
              <p>{msg.text}</p>
              {msg.pending ? (
                <span className="chat-messages__pending-label">
                  <AppIcon name="time-outline" className="chat-messages__pending-icon" />
                  {t('chat.pending')}
                </span>
              ) : null}
              {msg.failed && msg.onRetry ? (
                <button type="button" className="btn btn--text chat-messages__retry" onClick={msg.onRetry}>
                  {t('chat.retry')}
                </button>
              ) : null}
            </div>
            {showNote ? (
              <p className="chat-messages__based-on">
                <AppIcon name="sparkles-outline" className="chat-messages__based-on-icon" />
                {t('chat.based_on')}
              </p>
            ) : null}
          </li>
        );
      })}
    </ul>
  );
}

export function firstMessageToBubble(message: Message): ChatBubble {
  return {
    id: message.id,
    role: message.role === 'assistant' ? 'assistant' : 'user',
    text: message.message,
  };
}
