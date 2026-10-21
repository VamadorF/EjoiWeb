import { useCallback, useEffect, useState, type FormEvent, type KeyboardEvent } from 'react';
import { useTranslation } from 'react-i18next';

import { MESSAGE_MAX_LENGTH } from '@/features/chat/constants';

import { AppIcon } from '~/components/AppIcon';
import { isSpeechRecognitionSupported } from '~/platform/speech';

const COUNTER_FROM = 760;
const MAX_INPUT_ROWS = 5;

export type ComposerProps = {
  disabled?: boolean;
  onSend: (text: string) => void | Promise<void>;
  hint?: string;
  onDraftChange?: (text: string) => void;
  listening?: boolean;
};

export function Composer({ disabled, onSend, hint, onDraftChange, listening }: ComposerProps) {
  const { t } = useTranslation();
  const { t: tWeb } = useTranslation('web');
  const [text, setText] = useState('');
  const speechSupported = isSpeechRecognitionSupported();

  useEffect(() => {
    onDraftChange?.(text);
  }, [onDraftChange, text]);

  const resizeInput = useCallback((element: HTMLTextAreaElement) => {
    element.rows = 1;
    const style = window.getComputedStyle(element);
    const lineHeight = Number.parseFloat(style.lineHeight) || 24;
    const padding =
      Number.parseFloat(style.paddingTop) + Number.parseFloat(style.paddingBottom);
    const rows = Math.ceil((element.scrollHeight - padding) / lineHeight);
    element.rows = Math.min(MAX_INPUT_ROWS, Math.max(1, rows));
  }, []);

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

  const placeholder = listening
    ? t('chat.composer.placeholder_listening')
    : hint
      ? tWeb('chat.placeholder')
      : tWeb('chat.placeholder');

  return (
    <form className="chat-composer" onSubmit={(e) => void submit(e)} data-testid="chat-composer">
      {hint ? <p className="chat-composer__hint">{hint}</p> : null}
      <div className="chat-composer__row">
        {speechSupported ? (
          <button
            type="button"
            className="btn btn--icon chat-composer__mic"
            disabled={disabled}
            aria-label={t('chat.voice.start')}
            data-testid="chat-speech-btn"
          >
            <AppIcon name="mic-outline" />
          </button>
        ) : null}
        <textarea
          className="chat-composer__input"
          value={text}
          maxLength={MESSAGE_MAX_LENGTH}
          disabled={disabled}
          rows={1}
          placeholder={placeholder}
          aria-label={tWeb('chat.placeholder')}
          onChange={(e) => {
            setText(e.target.value);
            resizeInput(e.target);
          }}
          onKeyDown={onTextKeyDown}
        />
        {text.length >= COUNTER_FROM ? (
          <span className="chat-composer__counter" aria-live="polite">
            {text.length}/{MESSAGE_MAX_LENGTH}
          </span>
        ) : null}
        <button
          type="submit"
          className={`btn btn--icon chat-composer__send${
            text.trim() ? ' chat-composer__send--ready' : ' chat-composer__send--empty'
          }`}
          disabled={disabled || !text.trim()}
          aria-label={tWeb('chat.send_label')}
        >
          <AppIcon name="send" />
        </button>
      </div>
    </form>
  );
}
