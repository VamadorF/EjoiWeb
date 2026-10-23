import { beforeEach, describe, expect, it, vi } from 'vitest';

import {
  handleMockApiRequest,
  MOCK_DEMO_SESSION_KEY,
  normalizeApiPath,
  resetMockApiStoresForTests,
  setMockDemoLoggedIn,
} from './mockApi';
import { INTEREST_QUICK_REPLIES } from './mockGreeting';

const demoInterests = ['Música', 'Viajes', 'Literatura'];

function tokenFor(userId: string): string {
  const enc = (value: object) =>
    btoa(JSON.stringify(value))
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');
  return `${enc({ alg: 'none' })}.${enc({ userId, sub: userId })}.mock`;
}

describe('mockApi', () => {
  beforeEach(() => {
    resetMockApiStoresForTests();
    sessionStorage.removeItem(MOCK_DEMO_SESSION_KEY);
  });

  it('normaliza rutas con prefijo /api', () => {
    expect(normalizeApiPath('http://localhost:5173/api/auth/refresh')).toBe('/auth/refresh');
  });

  it('refresh devuelve 401 hasta login demo', () => {
    const denied = handleMockApiRequest('/api/auth/refresh', { method: 'POST' });
    expect(denied?.status).toBe(401);
    setMockDemoLoggedIn();
    const allowed = handleMockApiRequest('/api/auth/refresh', { method: 'POST' });
    expect(allowed?.status).toBe(200);
  });

  it('responde login mock', () => {
    const res = handleMockApiRequest('/api/auth/mock-login', { method: 'POST' });
    expect(res?.status).toBe(200);
    const data = res?.data as { accessToken?: string; user?: { id: string } };
    expect(data.accessToken).toBeTruthy();
    expect(data.user?.id).toBeTruthy();
  });

  it('persiste borrador de onboarding', () => {
    const draft = { schemaVersion: 1, step: 2, data: { webView: 'quien' } };
    handleMockApiRequest('/api/users/me/onboarding-draft', {
      method: 'PUT',
      body: draft,
      authToken: 'x.y.mock',
    });
    const read = handleMockApiRequest('/api/users/me/onboarding-draft', { method: 'GET' });
    expect((read?.data as { draft: typeof draft }).draft).toEqual(draft);
  });

  it('greeting-preview y primer mensaje citan música y viajes con Música, Viajes y Literatura', () => {
    const authToken = tokenFor('user-greeting');
    const preview = handleMockApiRequest('/api/companion/greeting-preview', {
      method: 'POST',
      authToken,
      body: { name: 'Sofía', interests: demoInterests },
    });
    const previewData = preview?.data as { greeting: string };
    expect(previewData.greeting).toContain('Vi que te interesan música y viajes');

    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-01-01T12:00:00Z'));
    handleMockApiRequest('/api/companion/me', {
      method: 'POST',
      authToken,
      body: { name: 'Sofía', interests: demoInterests, persona: 'Amigable', intensity: 'balanced' },
    });
    vi.advanceTimersByTime(4100);
    const creation = handleMockApiRequest('/api/companion/me/creation', { method: 'GET', authToken });
    const first = (creation?.data as { firstMessage?: { content: string } }).firstMessage;
    expect(first?.content).toContain('Vi que te interesan música y viajes');

    const history = handleMockApiRequest('/api/chat/history', { method: 'GET', authToken });
    const messages = (history?.data as { messages: { content: string }[] }).messages;
    expect(messages[0]?.content).toContain('Vi que te interesan música y viajes');
    vi.useRealTimers();
  });

  it('respuestas rápidas coinciden con INTEREST_QUICK_REPLIES del catálogo', () => {
    const authToken = tokenFor('user-qr');
    const preview = handleMockApiRequest('/api/companion/greeting-preview', {
      method: 'POST',
      authToken,
      body: { name: 'Sofía', interests: demoInterests },
    });
    const quickReplies = (preview?.data as { quickReplies: string[] }).quickReplies;
    expect(quickReplies).toEqual([
      INTEREST_QUICK_REPLIES.Música[0],
      INTEREST_QUICK_REPLIES.Música[1],
      INTEREST_QUICK_REPLIES.Viajes[0],
    ]);
  });

  it('la edad del perfil refleja creación y PATCH', () => {
    const authToken = tokenFor('user-age');
    handleMockApiRequest('/api/companion/me', {
      method: 'POST',
      authToken,
      body: { name: 'Sofía', age: 26, interests: demoInterests },
    });
    let profile = handleMockApiRequest('/api/companion/me/profile', { method: 'GET', authToken });
    expect((profile?.data as { age?: number }).age).toBe(26);

    handleMockApiRequest('/api/companion/me', {
      method: 'PATCH',
      authToken,
      body: { age: 31 },
    });
    profile = handleMockApiRequest('/api/companion/me/profile', { method: 'GET', authToken });
    expect((profile?.data as { age?: number }).age).toBe(31);
  });

  it('el historial mock conserva createdAt y orden', () => {
    const authToken = tokenFor('user-order');
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-01-01T12:00:00Z'));
    handleMockApiRequest('/api/companion/me', {
      method: 'POST',
      authToken,
      body: { name: 'Sofía', interests: demoInterests, persona: 'Amigable', intensity: 'balanced' },
    });
    vi.advanceTimersByTime(4100);
    handleMockApiRequest('/api/chat/history', { method: 'GET', authToken });
    vi.advanceTimersByTime(1000);
    handleMockApiRequest('/api/chat/message', {
      method: 'POST',
      authToken,
      body: { message: 'Hola', clientMessageId: 'c1' },
    });

    type Row = { createdAt?: string; meta?: { kind?: string } };
    const read = () =>
      (handleMockApiRequest('/api/chat/history', { method: 'GET', authToken })?.data as { messages: Row[] })
        .messages;
    const first = read();
    vi.advanceTimersByTime(1000);
    const second = read();
    vi.useRealTimers();

    expect(first[0]?.meta?.kind).toBe('first_message');
    const times = first.map((m) => new Date(m.createdAt ?? '').getTime());
    expect(times.every((t) => Number.isFinite(t))).toBe(true);
    expect([...times].sort((a, b) => a - b)).toEqual(times);
    expect(new Set(times).size).toBe(times.length);
    expect(second.map((m) => m.createdAt)).toEqual(first.map((m) => m.createdAt));
  });

  it('respuesta demo neutra al enviar un mensaje', () => {
    const authToken = tokenFor('user-chat');
    const reply = handleMockApiRequest('/api/chat/message', {
      method: 'POST',
      authToken,
      body: { message: 'Hola', clientMessageId: 'c1' },
    });
    expect((reply?.data as { content: string }).content).toBe('Cuéntame más sobre eso.');
  });
});
