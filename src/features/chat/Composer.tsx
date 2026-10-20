import { useState, type FormEvent, type KeyboardEvent } from 'react';
import { useTranslation } from 'react-i18next';

import { MESSAGE_MAX_LENGTH } from '@/features/chat/constants';

export type ComposerProps = {
  disabled?: boolean;
  onSend: (text: string) => void | Promise<void>;
  hint?: string;
};

export function Composer({ disabled, onSend, hint }: ComposerProps) {
  const { t } = useTranslation('web');
  const [text, setText] = useState('');

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    const trimmed = text.trim();
    if (!trimmed || disabled) return;
    await onSend(trimmed);
    setText('');
  };

  const onTextKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key !== 'Enter' || event.shiftKey || event.nativeEvent.isComposing) return;
    event.preventDefault();
    void submit(event);
  };

  return (
    <form className="chat-composer" onSubmit={(e) => void submit(e)} data-testid="chat-composer">
      {hint ? <p className="chat-composer__hint">{hint}</p> : null}
      <div className="chat-composer__row">
        <textarea
          className="chat-composer__input"
          value={text}
          maxLength={MESSAGE_MAX_LENGTH}
          disabled={disabled}
          rows={2}
          aria-label={t('chat.can_write')}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={onTextKeyDown}
        />
        <button type="submit" className="chat-composer__send" disabled={disabled || !text.trim()}>
          Enviar
        </button>
      </div>
    </form>
  );
}
