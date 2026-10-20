import type { OnboardingData } from '@/features/onboarding/types';
import { ONBOARDING_STEPS } from '@/features/onboarding/constants/onboardingSteps';

import { API_URL, ENABLE_AGE, ENABLE_ETHNICITY } from '~/platform/env';
import { httpClient } from '~/platform/http';
import * as session from '~/platform/session';

export const ONBOARDING_DRAFT_SCHEMA_VERSION = 1;

export type WebView = 'quien' | 'como' | 'chat';

export type OnboardingDraftRecord = {
  schemaVersion: number;
  step: number;
  data: OnboardingDraftDataPayload;
  updatedAt: string;
};

export type OnboardingDraftDataPayload = {
  visualStyle?: string;
  gender?: string;
  persona?: string;
  tone?: string;
  interactionStyle?: string;
  conversationDepth?: string;
  interests?: string[];
  boundaries?: string[];
  companionName?: string;
  ethnicity?: string;
  archetypeId?: string;
  intensity?: 'soft' | 'balanced' | 'intense';
  age?: number;
  webView?: WebView;
};

export type PutOnboardingDraftBody = {
  schemaVersion: number;
  step: number;
  data: OnboardingDraftDataPayload;
};

export const WEB_DEFAULT_AGE = 28;

export function emptyOnboardingData(): OnboardingData {
  return {
    visualStyle: '',
    gender: '',
    persona: '',
    tone: '',
    interactionStyle: '',
    conversationDepth: '',
    interests: [],
    boundaries: [],
    age: ENABLE_AGE ? WEB_DEFAULT_AGE : undefined,
  };
}

export function mergeDraftIntoData(
  base: OnboardingData,
  patch: OnboardingDraftDataPayload,
): OnboardingData {
  return {
    ...base,
    visualStyle: (patch.visualStyle ?? base.visualStyle) as OnboardingData['visualStyle'],
    gender: (patch.gender ?? base.gender) as OnboardingData['gender'],
    persona: patch.persona ?? base.persona,
    tone: patch.tone ?? base.tone,
    interactionStyle: patch.interactionStyle ?? base.interactionStyle,
    conversationDepth: patch.conversationDepth ?? base.conversationDepth,
    interests: patch.interests ?? base.interests,
    boundaries: patch.boundaries ?? base.boundaries,
    companionName: patch.companionName ?? base.companionName,
    ethnicity: patch.ethnicity ?? base.ethnicity,
    archetypeId: (patch.archetypeId as OnboardingData['archetypeId']) ?? base.archetypeId,
    intensity: patch.intensity ?? base.intensity,
    age: patch.age ?? base.age,
  };
}

export function toOnboardingDraftData(
  data: OnboardingData,
  webView: WebView,
): OnboardingDraftDataPayload {
  const out: OnboardingDraftDataPayload = { webView };
  if (data.visualStyle) out.visualStyle = data.visualStyle;
  if (data.gender) out.gender = data.gender;
  if (data.persona) out.persona = data.persona;
  if (data.tone) out.tone = data.tone;
  if (data.interactionStyle) out.interactionStyle = data.interactionStyle;
  if (data.conversationDepth) out.conversationDepth = data.conversationDepth;
  if (data.interests.length > 0) out.interests = [...data.interests];
  if (data.boundaries.length > 0) out.boundaries = [...data.boundaries];
  const name = data.companionName?.trim();
  if (name) out.companionName = name;
  if (ENABLE_ETHNICITY && data.ethnicity?.trim()) out.ethnicity = data.ethnicity.trim();
  if (data.archetypeId) out.archetypeId = data.archetypeId;
  if (data.intensity) out.intensity = data.intensity;
  if (ENABLE_AGE && typeof data.age === 'number') out.age = data.age;
  return out;
}

export function buildPutBody(
  step: number,
  data: OnboardingData,
  webView: WebView,
): PutOnboardingDraftBody {
  return {
    schemaVersion: ONBOARDING_DRAFT_SCHEMA_VERSION,
    step,
    data: toOnboardingDraftData(data, webView),
  };
}

export function persistSnapshotKey(body: PutOnboardingDraftBody): string {
  return JSON.stringify(body);
}

export const DEFAULT_WHO_STEP = ONBOARDING_STEPS.interests;

export async function getOnboardingDraftRecord(): Promise<OnboardingDraftRecord | null> {
  const response = await httpClient.get<{ draft: OnboardingDraftRecord | null }>(
    '/users/me/onboarding-draft',
    undefined,
    { suppressFatalBoundary: true },
  );
  return response.data.draft;
}

export async function putOnboardingDraft(body: PutOnboardingDraftBody): Promise<OnboardingDraftRecord> {
  const response = await httpClient.put<{ draft: OnboardingDraftRecord }>(
    '/users/me/onboarding-draft',
    body,
  );
  return response.data.draft;
}

export function putOnboardingDraftKeepalive(body: PutOnboardingDraftBody): void {
  const token = session.getAccessToken();
  const url = `${API_URL.replace(/\/$/, '')}/users/me/onboarding-draft`;
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'X-Client': 'web',
    'X-Requested-With': 'ejoi-web',
  };
  if (token) headers.Authorization = `Bearer ${token}`;
  void fetch(url, {
    method: 'PUT',
    headers,
    body: JSON.stringify(body),
    credentials: 'include',
    keepalive: true,
  });
}
