import { LEGAL_DOCUMENTS_VERSION } from '@/features/auth/assets/legalDocuments';
import { toUpsertCompanionDto } from '@/features/companion/adapters/companion.adapter';
import type { CreateCompanionRequest } from '@/features/companion/types';
import { getIntensityConfig } from '@/features/onboarding/data/companionIntensity';
import type { Gender, OnboardingData, VisualStyle } from '@/features/onboarding/types';
import { ageToDob } from '@/shared/utils/ageToDob';
import { getCompanionAge } from '@/shared/utils/companionAgeAppearance';

import { httpClient } from '~/platform/http';

import { buildPutBody, putOnboardingDraft, type WebView } from './onboardingDraft.api';

export type GreetingPreviewBody = {
  name: string;
  persona: string;
  intensity: string;
  interests: string[];
  boundaries: string[];
};

export type GreetingPreviewResponse = {
  greeting: string;
  basedOnInterests: string[];
  quickReplies: string[];
  source: 'template' | string;
};

export type PostConsentsBody = {
  documentsVersion: string;
  adult: true;
  termsAndPrivacy: true;
  sensitiveChat: true;
  platform: 'web';
};

export function buildGreetingPreviewBody(data: OnboardingData, name: string): GreetingPreviewBody {
  return {
    name: name.trim(),
    persona: data.persona,
    intensity: data.intensity ?? 'balanced',
    interests: [...data.interests],
    boundaries: [...data.boundaries],
  };
}

export function buildCreateCompanionRequest(data: OnboardingData): CreateCompanionRequest {
  const name = data.companionName?.trim() ?? '';
  const age = getCompanionAge(data);

  return {
    name,
    visualStyle: (data.visualStyle || 'realista') as VisualStyle,
    gender: (data.gender || 'femenino') as Gender,
    ethnicity: data.ethnicity,
    dob: ageToDob(age),
    persona: data.persona,
    interests: data.interests,
    boundaries: data.boundaries,
  };
}

export function buildCreateCompanionPayload(data: OnboardingData): Record<string, unknown> {
  const config = getIntensityConfig(data.intensity ?? 'balanced');
  const dto = toUpsertCompanionDto(buildCreateCompanionRequest(data));
  return {
    ...dto,
    intensity: config.id,
    ...(config.psychologicalRule ? { intensityRule: config.psychologicalRule } : {}),
  };
}

export async function postConsentsWeb(): Promise<void> {
  const body: PostConsentsBody = {
    documentsVersion: LEGAL_DOCUMENTS_VERSION,
    adult: true,
    termsAndPrivacy: true,
    sensitiveChat: true,
    platform: 'web',
  };
  await httpClient.request('/users/me/consents', { method: 'POST', body });
}

export async function fetchGreetingPreview(body: GreetingPreviewBody): Promise<GreetingPreviewResponse> {
  const response = await httpClient.request<GreetingPreviewResponse>('/companion/greeting-preview', {
    method: 'POST',
    body,
    suppressFatalBoundary: true,
  });
  return response.data;
}

/**
 * La URL firmada de GCS supera el `@MaxLength(400)` de `avatarUrl` en eJoi-BE (400 silencioso).
 * Sin la firma sigue identificando el objeto; el BE la re-firma desde `avatarStoragePath`.
 */
function withoutQuery(url: string): string {
  return url.split('?')[0];
}

export type StartCreationParams = {
  data: OnboardingData;
  step: number;
  webView: WebView;
  avatarUrl: string;
  avatarStoragePath?: string;
};

/** Orden: draft → consentimiento → creación (sin await) → pantalla creando. */
export async function startCreation(
  params: StartCreationParams,
  onNavigate: (path: string) => void,
): Promise<void> {
  const body = buildPutBody(params.step, params.data, params.webView);
  await putOnboardingDraft(body);
  await postConsentsWeb();

  const payload = {
    ...buildCreateCompanionPayload(params.data),
    avatarUrl: withoutQuery(params.avatarUrl),
    ...(params.avatarStoragePath ? { avatarStoragePath: params.avatarStoragePath } : {}),
  };

  void httpClient.post('/companion/me', payload).catch(() => undefined);

  onNavigate('/crear/creando');
}
