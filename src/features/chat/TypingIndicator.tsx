import { useTranslation } from 'react-i18next';

export function TypingIndicator() {
  const { t } = useTranslation();
  return (
    <li className="chat-messages__item" data-testid="chat-typing-indicator">
      <div className="bubble--ai chat-typing" aria-label={t('chat.header.typing')}>
        <span className="chat-typing__dot" />
        <span className="chat-typing__dot" />
        <span className="chat-typing__dot" />
      </div>
    </li>
  );
}
