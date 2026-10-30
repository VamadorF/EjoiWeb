// AUTO-SINCRONIZADO desde ejoiFE a1e61e3d072b6cc9e8b074adda33480eb1d3a1f2@a1e61e3d072b6cc9e8b074adda33480eb1d3a1f2:src/features/auth/types.ts. No editar: npm run sync:app
/**
 * Tipos TypeScript para autenticación
 */

export type CampaignTier = 'genesis' | 'founder';

export interface User {
  id: string;
  email: string;
  name: string;
  picture?: string;
  provider?: 'google' | 'apple';
  createdAt?: string;
  updatedAt?: string;
  campaignTier?: CampaignTier | null;
  founderNumber?: number | null;
  referralCode?: string | null;
  referredByUserId?: string | null;
  campaignJoinedAt?: string | null;
  /** IANA persistida (nunca un offset). `null` si el backend aún no la tiene. */
  timezone?: string | null;
}

export interface LoginCredentialsRequest {
  username: string;
  password: string;
}

export interface AuthProviderRequest {
  provider: 'google' | 'apple';
  providerUserId: string;
  email?: string;
  name?: string;
  avatarUrl?: string;
  /** Google: id_token para verificación en backend */
  idToken?: string;
  /** Apple: identity_token para verificación en backend */
  identityToken?: string;
}

export type GoogleLoginRequest = AuthProviderRequest;

export type AppleLoginRequest = AuthProviderRequest;

export interface AuthLoginResponse {
  code?: number;
  accessToken: string;
  access_token?: string;
  refreshToken: string;
  refresh_token?: string;
  tokenType: 'Bearer' | string;
  token_type?: 'Bearer' | string;
  expiresIn: number;
  expires_in?: number;
  user: {
    id: string;
    name: string;
    email: string;
    picture?: string;
    timezone?: string | null;
  };
}

export type AuthProviderResponse = AuthLoginResponse;

export interface AuthSessionResponse {
  code?: number;
  status?: string;
  isAuthenticated: boolean;
  user: User | null;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn?: number;
  tokenType?: string;
}

export interface LoginResponse {
  user: User;
  tokens: AuthTokens;
}

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

export interface GoogleAuthResult {
  type: 'success' | 'error';
  accessToken?: string;
  idToken?: string;
  user?: User;
  error?: string;
}

export interface AppleAuthResult {
  type: 'success' | 'error';
  identityToken?: string;
  authorizationCode?: string;
  accessToken?: string;
  user?: User;
  error?: string;
}
