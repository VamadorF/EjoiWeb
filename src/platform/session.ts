import { API_URL, MOCK_API } from './env';
import { handleMockApiRequest } from './mockApi';

let accessToken: string | null = null;
let userDataJson: string | null = null;
let refreshGeneration = 0;
let lastRefreshAt = 0;

const authChannel =
  typeof BroadcastChannel !== 'undefined' ? new BroadcastChannel('ejoi-auth') : null;

authChannel?.addEventListener('message', (ev: MessageEvent) => {
  if (ev.data?.type === 'refreshed') {
    lastRefreshAt = ev.data.at as number;
    refreshGeneration = ev.data.generation as number;
    if (ev.data.accessToken) {
      accessToken = ev.data.accessToken as string;
    }
  }
});

export function getAccessToken(): string | null {
  return accessToken;
}

export function setSession(token: string, userJson?: string | null): void {
  accessToken = token;
  if (userJson !== undefined) userDataJson = userJson;
}

export function clearSession(): void {
  accessToken = null;
  userDataJson = null;
}

/**
 * Refresh token en localStorage (compartido entre pestañas). Se lee siempre del
 * storage, nunca de memoria: el backend lo rota en cada refresh y revoca la
 * sesión si recibe uno ya usado.
 */
const REFRESH_TOKEN_KEY = 'ejoi_refresh_token';

export function getRefreshToken(): string | null {
  try {
    return localStorage.getItem(REFRESH_TOKEN_KEY);
  } catch {
    return null;
  }
}

export function setRefreshToken(token: string): void {
  try {
    localStorage.setItem(REFRESH_TOKEN_KEY, token);
  } catch {
    /* quota / private mode */
  }
}

export function clearRefreshToken(): void {
  try {
    localStorage.removeItem(REFRESH_TOKEN_KEY);
  } catch {
    /* noop */
  }
}

export function getUserDataJson(): string | null {
  return userDataJson;
}

export function setUserDataJson(json: string | null): void {
  userDataJson = json;
}

type RefreshResponse = {
  access_token?: string;
  accessToken?: string;
  refresh_token?: string;
  refreshToken?: string;
};

let inFlightRefresh: Promise<string> | null = null;
let inFlightStartedAt = 0;

export async function refresh(): Promise<string> {
  const startedGeneration = refreshGeneration;
  const startedLastRefresh = lastRefreshAt;

  if (inFlightRefresh) {
    return inFlightRefresh;
  }

  const run = async (): Promise<string> => {
    if (typeof navigator !== 'undefined' && navigator.locks?.request) {
      return navigator.locks.request('ejoi-auth-refresh', async () => {
        if (lastRefreshAt > startedLastRefresh && accessToken) {
          return accessToken;
        }
        return doRefresh(startedGeneration);
      });
    }
    return doRefresh(startedGeneration);
  };

  inFlightRefresh = run().finally(() => {
    inFlightRefresh = null;
    inFlightStartedAt = 0;
  });
  inFlightStartedAt = Date.now();
  return inFlightRefresh;
}

async function doRefresh(startedGeneration: number): Promise<string> {
  if (MOCK_API) {
    const mocked = handleMockApiRequest<{ accessToken?: string; access_token?: string }>(
      `${API_URL}/auth/refresh`,
      { method: 'POST' },
    );
    const token = mocked?.data.accessToken ?? mocked?.data.access_token;
    if (token) {
      accessToken = token;
      refreshGeneration = startedGeneration + 1;
      lastRefreshAt = Date.now();
      authChannel?.postMessage({
        type: 'refreshed',
        at: lastRefreshAt,
        generation: refreshGeneration,
        accessToken: token,
      });
      return token;
    }
  }

  const storedRefreshToken = getRefreshToken();
  const response = await fetch(`${API_URL}/auth/refresh`, {
    method: 'POST',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      'X-Client': 'web',
      'X-Requested-With': 'ejoi-web',
    },
    body: storedRefreshToken ? JSON.stringify({ refreshToken: storedRefreshToken }) : undefined,
  });

  if (!response.ok) {
    clearSession();
    clearRefreshToken();
    throw new Error(`Refresh failed: ${response.status}`);
  }

  const data = (await response.json()) as RefreshResponse;
  const token = data.accessToken ?? data.access_token;
  if (!token) {
    clearSession();
    throw new Error('Refresh response missing access token');
  }

  const rotatedRefreshToken = data.refreshToken ?? data.refresh_token;
  if (rotatedRefreshToken) setRefreshToken(rotatedRefreshToken);

  accessToken = token;
  refreshGeneration = startedGeneration + 1;
  lastRefreshAt = Date.now();
  authChannel?.postMessage({
    type: 'refreshed',
    at: lastRefreshAt,
    generation: refreshGeneration,
    accessToken: token,
  });
  return token;
}

export function getRefreshDebugState() {
  return { inFlightRefresh: Boolean(inFlightRefresh), inFlightStartedAt };
}
