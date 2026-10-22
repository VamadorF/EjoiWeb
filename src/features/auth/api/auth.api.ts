import type { AppleLoginRequest, GoogleLoginRequest, User } from '@/features/auth/types';
import { ApiError, httpClient } from '~/platform/http';
import * as session from '~/platform/session';
import { notifySessionExpired } from '~/platform/sessionEvents';

import {
  fromWebAuthResponse,
  RawAuthResponse,
  toProviderAuthDto,
} from '../authWeb.adapter';
import { resolvePostLoginWizardPath } from '~/features/creation/wizardSteps';

import { clearPendingReferralCode, getPendingReferralCode } from '../referralCode';

export type FounderCountResponse = { claimed: number; max: number };

export type ReferralPreviewResponse = {
  valid: boolean;
  inviterName: string | null;
};

export type CreationState = 'none' | 'creating' | 'ready' | 'error';

export type CompanionCreationResponse = {
  state: CreationState;
  error?: { code?: string };
  steps?: Record<string, boolean>;
};

export type OnboardingDraftResponse = {
  data?: { webView?: 'quien' | 'como' | 'chat' };
};

function persistWebLogin(data: RawAuthResponse): User {
  const { accessToken, refreshToken, user } = fromWebAuthResponse(data);
  session.setSession(accessToken, JSON.stringify(user));
  if (refreshToken) session.setRefreshToken(refreshToken);
  return user;
}

export async function loginWithGoogle(data: GoogleLoginRequest): Promise<User> {
  const response = await httpClient.post<RawAuthResponse>(
    '/auth/google',
    toProviderAuthDto(data),
  );
  return persistWebLogin(response.data);
}

export async function loginWithApple(data: AppleLoginRequest): Promise<User> {
  const response = await httpClient.post<RawAuthResponse>(
    '/auth/apple',
    toProviderAuthDto(data),
  );
  return persistWebLogin(response.data);
}

export async function logoutWeb(): Promise<void> {
  const refreshToken = session.getRefreshToken();
  try {
    await httpClient.post('/auth/logout', refreshToken ? { refreshToken } : undefined, undefined);
  } finally {
    session.clearSession();
    session.clearRefreshToken();
    notifySessionExpired();
  }
}

export async function getFounderCount(): Promise<FounderCountResponse> {
  const response = await httpClient.get<FounderCountResponse>('/campaign/founder-count');
  return response.data;
}

export async function previewReferralCode(code: string): Promise<ReferralPreviewResponse> {
  const encoded = encodeURIComponent(code.trim());
  const response = await httpClient.get<ReferralPreviewResponse>(
    `/campaign/referral/preview?code=${encoded}`,
  );
  return response.data;
}

export async function applyReferralCode(code: string): Promise<void> {
  await httpClient.post('/campaign/referral/apply', { code: code.trim() });
}

export async function getCompanionCreation(): Promise<CompanionCreationResponse> {
  const response = await httpClient.get<CompanionCreationResponse>('/companion/me/creation');
  return response.data;
}

export async function getOnboardingDraft(): Promise<OnboardingDraftResponse | null> {
  try {
    const response = await httpClient.get<OnboardingDraftResponse>('/users/me/onboarding-draft');
    return response.data;
  } catch {
    return null;
  }
}

/**
 * eJoi-BE aún no expone /companion/me/creation (solo existe en los mocks): ante
 * un 404 se decide con GET /companion/me, que responde vacío si no hay compañero.
 */
async function getCreationState(): Promise<{ state: CreationState }> {
  try {
    return await getCompanionCreation();
  } catch (err) {
    if (!(err instanceof ApiError) || err.status !== 404) throw err;
  }
  const response = await httpClient.get<{ id?: string } | null>('/companion/me');
  return { state: response.data?.id ? 'ready' : 'none' };
}

export async function resolvePostLoginPath(): Promise<string> {
  const creation = await getCreationState();
  if (creation.state === 'creating' || creation.state === 'error') {
    return '/crear/creando';
  }
  if (creation.state === 'ready') {
    return '/chat';
  }
  const draft = await getOnboardingDraft();
  return resolvePostLoginWizardPath(draft);
}

export async function finishLoginAfterProvider(): Promise<string> {
  const code = getPendingReferralCode();
  if (code) {
    try {
      await applyReferralCode(code);
    } catch {
      /* el registro sigue aunque falle el código */
    }
    clearPendingReferralCode();
  }
  return resolvePostLoginPath();
}
