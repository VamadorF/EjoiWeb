import { afterEach, describe, expect, it } from 'vitest';

import { isSpeechRecognitionSupported } from './speech';

describe('speech', () => {
  afterEach(() => {
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
});
