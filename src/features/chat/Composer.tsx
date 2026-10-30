import { useEffect, useLayoutEffect, useRef, useState, type FormEvent, type KeyboardEvent } from 'react';
import { useTranslation } from 'react-i18next';

import { MESSAGE_MAX_LENGTH } from '@/features/chat/constants';

import { AppIcon } from '~/components/AppIcon';
import { LiquidButton } from '~/components/LiquidButton';
import { applySpeechTranscript, startDictation, type DictationSession } from '~/platform/speech';
import { useThemePreference } from '~/theme/theme';

const COUNTER_FROM = 760;
const MAX_INPUT_ROWS = 5;

export type ComposerProps = {
  disabled?: boolean;
  onSend: (text: string) => void | Promise<void>;
  hint?: string;
  onDraftChange?: (text: string) => void;
};

function speechErrorKey(code: string): 'chat.speech_unsupported' | 'chat.speech_denied' | 'chat.speech_failed' {
  if (code === 'unsupported') return 'chat.speech_unsupported';
  if (code === 'not-allowed' || code === 'service-not-allowed') return 'chat.speech_denied';
  return 'chat.speech_failed';
}

export function Composer({ disabled, onSend, hint, onDraftChange }: ComposerProps) {
  const { t } = useTranslation();
  const { t: tWeb } = useTranslation('web');
  const { preference } = useThemePreference();
  const [text, setText] = useState('');
  const [listening, setListening] = useState(false);
  const [speechError, setSpeechError] = useState<string | null>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const prefixRef = useRef('');
  const sessionRef = useRef<DictationSession | null>(null);
  const epochRef = useRef(0);
  const aliveRef = useRef(true);

  useEffect(() => {
    onDraftChange?.(text);
  }, [onDraftChange, text]);

  useLayoutEffect(() => {
    const element = inputRef.current;
    if (!element) return;
    element.rows = 1;
    const style = window.getComputedStyle(element);
    const lineHeight = Number.parseFloat(style.lineHeight) || 24;
    const padding = Number.parseFloat(style.paddingTop) + Number.parseFloat(style.paddingBottom);
    const rows = Math.ceil((element.scrollHeight - padding) / lineHeight);
    element.rows = Math.min(MAX_INPUT_ROWS, Math.max(1, Number.isFinite(rows) ? rows : 1));
  }, [text]);

  useEffect(() => {
    aliveRef.current = true;
    return () => {
      aliveRef.current = false;
      epochRef.current += 1;
      sessionRef.current?.stop();
      sessionRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (!disabled || !sessionRef.current) return;
    epochRef.current += 1;
    sessionRef.current.stop();
    sessionRef.current = null;
    setListening(false);
  }, [disabled]);

  const stopDictation = () => {
    epochRef.current += 1;
    sessionRef.current?.stop();
    sessionRef.current = null;
    setListening(false);
  };

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    stopDictation();
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

  const onMicClick = () => {
    if (sessionRef.current) {
      stopDictation();
      return;
    }
    setSpeechError(null);
    // ponytail: el prefijo se congela al pulsar; un edit a mitad del dictado lo pisa el siguiente resultado.
    prefixRef.current = text;
    const token = epochRef.current;
    let rejected = false;
    const session = startDictation({
      onTranscript: (spoken) => {
        if (token !== epochRef.current || !aliveRef.current) return;
        setText(applySpeechTranscript(prefixRef.current, spoken, MESSAGE_MAX_LENGTH));
      },
      onError: (code) => {
        if (token !== epochRef.current || !aliveRef.current) return;
        rejected = true;
        epochRef.current += 1;
        sessionRef.current = null;
        setListening(false);
        setSpeechError(tWeb(speechErrorKey(code)));
      },
      onEnd: () => {
        if (token !== epochRef.current || !aliveRef.current) return;
        if (sessionRef.current === session) sessionRef.current = null;
        setListening(false);
      },
    });
    if (!session || rejected) return;
    sessionRef.current = session;
    setListening(true);
  };

  const placeholder = listening
    ? t('chat.composer.placeholder_listening')
    : hint
      ? tWeb('chat.placeholder')
      : tWeb('chat.placeholder');

  return (
    <form className="chat-composer" onSubmit={(e) => void submit(e)} data-testid="chat-composer">
      {hint ? <p className="chat-composer__hint">{hint}</p> : null}
      {speechError ? (
        <p className="chat-composer__hint" role="alert" data-testid="chat-speech-error">
          {speechError}
        </p>
      ) : null}
      <div className="chat-composer__row">
        <button
          type="button"
          className="btn btn--icon chat-composer__mic"
          disabled={disabled}
          aria-pressed={listening}
          aria-label={listening ? t('chat.voice.stop') : t('chat.voice.start')}
          data-testid="chat-speech-btn"
          onClick={onMicClick}
        >
          <AppIcon name={listening ? 'stop' : 'mic-outline'} />
        </button>
        <textarea
          ref={inputRef}
          className="chat-composer__input"
          value={text}
          maxLength={MESSAGE_MAX_LENGTH}
          disabled={disabled}
          rows={1}
          placeholder={placeholder}
          aria-label={tWeb('chat.placeholder')}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={onTextKeyDown}
        />
        {text.length >= COUNTER_FROM ? (
          <span className="chat-composer__counter" aria-live="polite">
            {text.length}/{MESSAGE_MAX_LENGTH}
          </span>
        ) : null}
        {preference === 'liquid' ? (
          <LiquidButton
            type="submit"
            className={`btn btn--icon chat-composer__send${
              text.trim() ? ' chat-composer__send--ready' : ' chat-composer__send--empty'
            }`}
            disabled={disabled || !text.trim()}
            aria-label={tWeb('chat.send_label')}
          >
            <AppIcon name="send" />
          </LiquidButton>
        ) : (
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
        )}
      </div>
    </form>
  );
}
