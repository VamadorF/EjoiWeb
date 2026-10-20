import { describe, expect, it, vi, beforeEach } from 'vitest';

import type { OnboardingData } from '@/features/onboarding/types';
import { PERSONALITY_OPTIONS } from '@/features/onboarding/data/personalityOptions';
import { BASIC_BOUNDARIES } from '@/features/onboarding/data/boundaryOptions';

import * as draftApi from './onboardingDraft.api';
import {
  buildCreateCompanionPayload,
  buildGreetingPreviewBody,
  startCreation,
} from './startCreation';
import { httpClient } from '~/platform/http';

vi.mock('~/platform/http', () => ({
  httpClient: {
    post: vi.fn(),
    request: vi.fn(),
  },
}));

function sampleData(overrides: Partial<OnboardingData> = {}): OnboardingData {
  return {
    visualStyle: 'realista',
    gender: 'femenino',
    persona: PERSONALITY_OPTIONS[0],
    tone: '',
    interactionStyle: '',
    conversationDepth: '',
    interests: ['Arte y cultura', 'Música', 'Viajes'],
    boundaries: [...BASIC_BOUNDARIES, 'Evitar temas políticos'],
    companionName: 'Luna',
    intensity: 'intense',
    age: 28,
    ...overrides,
  };
}

describe('buildGreetingPreviewBody', () => {
  it('refleja persona, presencia, intereses y límites del estado', () => {
    const data = sampleData();
    const body = buildGreetingPreviewBody(data, 'Luna');
    expect(body).toEqual({
      name: 'Luna',
      persona: PERSONALITY_OPTIONS[0],
      intensity: 'intense',
      interests: data.interests,
      boundaries: data.boundaries,
    });
  });
});

describe('buildCreateCompanionPayload', () => {
  it('incluye intensidad para el backend', () => {
    const payload = buildCreateCompanionPayload(sampleData());
    expect(payload.intensity).toBe('intense');
    expect(payload.name).toBe('Luna');
    expect(payload.persona).toBe(PERSONALITY_OPTIONS[0]);
  });
});

describe('startCreation', () => {
  beforeEach(() => {
    vi.mocked(httpClient.post).mockResolvedValue({ data: {}, status: 200, statusText: 'OK' });
    vi.mocked(httpClient.request).mockResolvedValue({ data: {}, status: 200, statusText: 'OK' });
    vi.spyOn(draftApi, 'putOnboardingDraft').mockResolvedValue({
      schemaVersion: 1,
      step: 14,
      data: { webView: 'chat' },
      updatedAt: new Date().toISOString(),
    });
  });

  it('ordena draft chat, consentimiento, creación sin bloquear y navegación', async () => {
    const order: string[] = [];
    vi.mocked(draftApi.putOnboardingDraft).mockImplementation(async () => {
      order.push('draft');
      return {
        schemaVersion: 1,
        step: 14,
        data: { webView: 'chat' },
        updatedAt: new Date().toISOString(),
      };
    });
    vi.mocked(httpClient.request).mockImplementation(async () => {
      order.push('consent');
      return { data: {}, status: 200, statusText: 'OK' };
    });
    vi.mocked(httpClient.post).mockImplementation(async () => {
      order.push('create');
      return { data: {}, status: 200, statusText: 'OK' };
    });

    const data = sampleData();
    const navigate = vi.fn();

    await startCreation({ data, step: 14, webView: 'como' }, navigate);

    expect(order).toEqual(['draft', 'consent', 'create']);
    expect(httpClient.request).toHaveBeenCalledWith('/users/me/consents', expect.objectContaining({ method: 'POST' }));
    expect(httpClient.post).toHaveBeenCalledWith('/companion/me', expect.objectContaining({ name: 'Luna' }));
    expect(navigate).toHaveBeenCalledWith('/chat');
  });
});
