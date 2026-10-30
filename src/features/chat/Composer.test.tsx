import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';

import '~/i18n';

import { Composer } from './Composer';

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

describe('Composer dictado', () => {
  afterEach(() => {
    cleanup();
    FakeSpeech.latest = null;
    Reflect.deleteProperty(window, 'SpeechRecognition');
    Reflect.deleteProperty(window, 'webkitSpeechRecognition');
  });

  it('el micrófono suma el transcript al borrador y el segundo clic para', () => {
    Object.defineProperty(window, 'webkitSpeechRecognition', { configurable: true, value: FakeSpeech });
    render(<Composer onSend={() => undefined} />);
    const input = screen.getByRole('textbox', { name: 'Escribe un mensaje…' }) as HTMLTextAreaElement;
    fireEvent.change(input, { target: { value: 'hola' } });
    const mic = screen.getByTestId('chat-speech-btn');

    fireEvent.click(mic);
    expect(FakeSpeech.latest?.started).toBe(true);
    expect(mic.getAttribute('aria-pressed')).toBe('true');

    act(() => {
      FakeSpeech.latest?.onresult?.({ results: [{ 0: { transcript: 'mun' } }] });
    });
    expect(input.value).toBe('hola mun');
    act(() => {
      FakeSpeech.latest?.onresult?.({ results: [{ 0: { transcript: 'mundo' } }] });
    });
    expect(input.value).toBe('hola mundo');

    fireEvent.click(mic);
    expect(FakeSpeech.latest?.stopped).toBe(true);
    expect(mic.getAttribute('aria-pressed')).toBe('false');
    act(() => {
      FakeSpeech.latest?.onresult?.({ results: [{ 0: { transcript: 'otro' } }] });
    });
    expect(input.value).toBe('hola mundo');
  });

  it('not-allowed y la falta de API muestran un error', () => {
    const { unmount } = render(<Composer onSend={() => undefined} />);
    fireEvent.click(screen.getByTestId('chat-speech-btn'));
    expect(screen.getByTestId('chat-speech-error').textContent).toBe('Este navegador no puede dictar.');
    unmount();

    Object.defineProperty(window, 'webkitSpeechRecognition', { configurable: true, value: FakeSpeech });
    render(<Composer onSend={() => undefined} />);
    fireEvent.click(screen.getByTestId('chat-speech-btn'));
    act(() => {
      FakeSpeech.latest?.onerror?.({ error: 'not-allowed' });
    });
    expect(screen.getByTestId('chat-speech-error').textContent).toBe('Permite el micrófono para dictar.');
  });
});
