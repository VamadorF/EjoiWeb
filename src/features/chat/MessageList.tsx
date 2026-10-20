import { useTranslation } from 'react-i18next';

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
};

export function MessageList({ messages, loading }: MessageListProps) {
  const { t } = useTranslation('web');

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
      {messages.map((msg) => (
        <li
          key={msg.id}
          className={`chat-messages__bubble chat-messages__bubble--${msg.role}${
            msg.pending ? ' chat-messages__bubble--pending' : ''
          }${msg.failed ? ' chat-messages__bubble--failed' : ''}`}
        >
          <p>{msg.text}</p>
          {msg.pending ? (
            <span className="chat-messages__pending-label">{t('chat.pending')}</span>
          ) : null}
          {msg.failed && msg.onRetry ? (
            <button type="button" className="chat-messages__retry" onClick={msg.onRetry}>
              {t('chat.retry')}
            </button>
          ) : null}
        </li>
      ))}
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
