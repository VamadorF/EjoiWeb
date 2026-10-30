type SpeechTranscriptResult = {
  0?: { transcript?: string };
};

type SpeechResultEvent = {
  results: ArrayLike<SpeechTranscriptResult>;
};

type SpeechErrorEvent = {
  error?: string;
};

type SpeechRecognitionInstance = {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  start: () => void;
  stop: () => void;
  abort: () => void;
  onresult: ((event: SpeechResultEvent) => void) | null;
  onerror: ((event: SpeechErrorEvent) => void) | null;
  onend: (() => void) | null;
};

export type SpeechRecognitionCtor = new () => SpeechRecognitionInstance;

export type DictationHandlers = {
  onTranscript: (sessionTranscript: string) => void;
  onError: (code: string) => void;
  onEnd?: () => void;
};

export type DictationSession = {
  stop: () => void;
};

const IGNORED_SPEECH_ERRORS = new Set(['aborted', 'no-speech']);

export function getSpeechRecognitionCtor(): SpeechRecognitionCtor | undefined {
  if (typeof window === 'undefined') return undefined;
  const w = window as Window & {
    SpeechRecognition?: SpeechRecognitionCtor;
    webkitSpeechRecognition?: SpeechRecognitionCtor;
  };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition;
}

export function isSpeechRecognitionSupported(): boolean {
  return Boolean(getSpeechRecognitionCtor());
}

function joinRecognitionResults(results: ArrayLike<SpeechTranscriptResult>): string {
  let text = '';
  for (let i = 0; i < results.length; i += 1) {
    text += results[i]?.[0]?.transcript ?? '';
  }
  return text;
}

/** Suma el dictado de la sesión al borrador que había al pulsar el micrófono. */
export function applySpeechTranscript(prefix: string, sessionTranscript: string, maxLength: number): string {
  const spoken = sessionTranscript.trim();
  if (!spoken) return prefix.slice(0, maxLength);
  const base = prefix.trimEnd();
  const combined = base ? `${base} ${spoken}` : spoken;
  return combined.slice(0, maxLength);
}

export function startDictation(handlers: DictationHandlers): DictationSession | undefined {
  const Ctor = getSpeechRecognitionCtor();
  if (!Ctor) {
    handlers.onError('unsupported');
    return undefined;
  }

  const recognition = new Ctor();
  recognition.lang = 'es-ES';
  recognition.interimResults = true;
  recognition.continuous = true;

  let ended = false;
  let reported = false;
  const fail = (code: string) => {
    if (reported || ended) return;
    reported = true;
    try {
      recognition.abort();
    } catch {
      // El motor ya estaba parado.
    }
    handlers.onError(code);
  };

  recognition.onresult = (event) => {
    if (ended) return;
    handlers.onTranscript(joinRecognitionResults(event.results));
  };
  recognition.onerror = (event) => {
    const code = event.error || 'error';
    if (IGNORED_SPEECH_ERRORS.has(code)) return;
    fail(code);
  };
  recognition.onend = () => {
    ended = true;
    handlers.onEnd?.();
  };

  try {
    recognition.start();
  } catch {
    // ponytail: start justo después de stop puede lanzar hasta el onend; se avisa y el siguiente clic reintenta.
    fail('start-failed');
    return undefined;
  }
  if (reported) return undefined;

  return {
    stop() {
      if (ended) return;
      try {
        recognition.stop();
      } catch {
        try {
          recognition.abort();
        } catch {
          ended = true;
          handlers.onEnd?.();
        }
      }
    },
  };
}
