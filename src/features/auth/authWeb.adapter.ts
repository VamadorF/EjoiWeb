import type { AuthProviderRequest, User } from '@/features/auth/types';

export type RawAuthResponse = {
  code?: number;
  access_token?: string;
  accessToken?: string;
  token?: string;
  refresh_token?: string;
  refreshToken?: string;
  expires_in?: number;
  expiresIn?: number;
  user?: Partial<User> & { userId?: string; avatarUrl?: string };
  data?: RawAuthResponse;
};

const trimOptional = (value?: string): string | undefined => {
  const normalized = value?.trim();
  return normalized ? normalized : undefined;
};

export function normalizeAuthUser(
  raw: (Partial<User> & { userId?: string; avatarUrl?: string }) | null | undefined,
): User {
  const id = trimOptional(raw?.id) ?? trimOptional(raw?.userId);
  if (!id) {
    throw new Error('El backend no devolvió un id de usuario válido');
  }
  return {
    id,
    email: raw?.email?.trim() ?? '',
    name: raw?.name?.trim() ?? '',
    picture: raw?.picture ?? raw?.avatarUrl,
    provider: raw?.provider,
    timezone: raw?.timezone ?? null,
  };
}

export function toProviderAuthDto(payload: AuthProviderRequest): AuthProviderRequest {
  return {
    provider: payload.provider,
    providerUserId: payload.providerUserId.trim().slice(0, 191),
    email: trimOptional(payload.email),
    name: trimOptional(payload.name),
    avatarUrl: trimOptional(payload.avatarUrl),
    idToken: trimOptional(payload.idToken),
    identityToken: trimOptional(payload.identityToken),
  };
}

/** Respuesta web (C1): access token en cuerpo; refresh en cookie HttpOnly. */
export function fromWebAuthResponse(data: RawAuthResponse): { accessToken: string; user: User } {
  const payload = data.data ?? data;
  const accessToken = payload.accessToken ?? payload.access_token ?? payload.token;
  if (!accessToken) {
    throw new Error('El backend no devolvió un access token válido');
  }
  if (!payload.user) {
    throw new Error('El backend no devolvió información del usuario');
  }
  return { accessToken, user: normalizeAuthUser(payload.user) };
}
