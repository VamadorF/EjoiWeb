import { afterEach, describe, expect, it } from 'vitest';

import { applySpeechTranscript, isSpeechRecognitionSupported, startDictation } from './speech';

type FakeResult = { 0?: { transcript?: string } };

class FakeSpeech {
  static latest: FakeSpeech | null = null;
  lang = '';
  interimResults = false;
  continuous = false;
  onresult: ((event: { results: FakeResult[] }) => void) | null = null;
  onerror: ((event: { error?: string }) => void) | null = null;
  onend: (() => void) | null = null;
  started = false;
  stopped = false;
  constructor() {
    FakeSpeech.latest = this;
  }
  start() {
    this.started = true;
  }
  stop() {
    this.stopped = true;
    this.onend?.();
  }
  abort() {
    this.stopped = true;
  }
}

describe('speech', () => {
  afterEach(() => {
    FakeSpeech.latest = null;
    Reflect.deleteProperty(window, 'SpeechRecognition');
    Reflect.deleteProperty(window, 'webkitSpeechRecognition');
  });

  it('sin API no hay soporte de dictado', () => {
    expect(isSpeechRecognitionSupported()).toBe(false);
  });

  it('detecta SpeechRecognition cuando existe', () => {
    Object.defineProperty(window, 'SpeechRecognition', { value: class {}, configurable: true });
    expect(isSpeechRecognitionSupported()).toBe(true);
  });

  it('webkitSpeechRecognition pega el transcript al borrador y not-allowed no se traga', () => {
    Object.defineProperty(window, 'webkitSpeechRecognition', {
      configurable: true,
      value: FakeSpeech,
    });
    expect(isSpeechRecognitionSupported()).toBe(true);

    const drafts: string[] = [];
    const errors: string[] = [];
    const prefix = 'hola';
    const session = startDictation({
      onTranscript: (spoken) => drafts.push(applySpeechTranscript(prefix, spoken, 840)),
      onError: (code) => errors.push(code),
    });

    expect(FakeSpeech.latest?.started).toBe(true);
    expect(FakeSpeech.latest?.continuous).toBe(true);
    FakeSpeech.latest?.onresult?.({ results: [{ 0: { transcript: 'mun' } }] });
    FakeSpeech.latest?.onresult?.({
      results: [{ 0: { transcript: 'mundo' } }, { 0: { transcript: ' cruel' } }],
    });
    expect(drafts).toEqual(['hola mun', 'hola mundo cruel']);
    expect(applySpeechTranscript('hola', 'mundo', 8)).toBe('hola mun');
    expect(applySpeechTranscript('hola ', 'mundo', 40)).toBe('hola mundo');
    expect(applySpeechTranscript('hola ', '   ', 40)).toBe('hola ');

    FakeSpeech.latest?.onerror?.({ error: 'no-speech' });
    expect(errors).toEqual([]);

    session?.stop();
    expect(FakeSpeech.latest?.stopped).toBe(true);

    startDictation({
      onTranscript: () => undefined,
      onError: (code) => errors.push(code),
    });
    FakeSpeech.latest?.onerror?.({ error: 'not-allowed' });
    expect(errors).toEqual(['not-allowed']);
  });

  it('sin API startDictation avisa unsupported', () => {
    const errors: string[] = [];
    const session = startDictation({
      onTranscript: () => undefined,
      onError: (code) => errors.push(code),
    });
    expect(session).toBeUndefined();
    expect(errors).toEqual(['unsupported']);
  });
});
