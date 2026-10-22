import { API_URL, MOCK_API } from './env';
import { handleMockApiRequest } from './mockApi';
import * as session from './session';
import { notifySessionExpired } from './sessionEvents';

export interface RequestConfig {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  headers?: Record<string, string>;
  body?: unknown;
  baseUrl?: string;
  suppressFatalBoundary?: boolean;
  authToken?: string;
  timeoutMs?: number;
  skipAuthRefresh?: boolean;
  suppressAuthLogout?: boolean;
  _retry?: boolean;
}

export interface ApiResponse<T = unknown> {
  data: T;
  status: number;
  statusText: string;
}

export class ApiError extends Error {
  constructor(
    public status: number,
    public statusText: string,
    public data?: unknown,
    message?: string,
  ) {
    super(message ?? `API Error: ${status} ${statusText}`);
    this.name = 'ApiError';
  }
}

const DEFAULT_TIMEOUT_MS = 30000;

async function parseBody(response: Response): Promise<unknown> {
  const ct = response.headers.get('content-type') ?? '';
  if (ct.includes('application/json')) {
    try {
      return await response.json();
    } catch {
      return null;
    }
  }
  const text = await response.text();
  return text ? { message: text } : null;
}

async function requestOnce<T>(endpoint: string, config: RequestConfig): Promise<ApiResponse<T>> {
  const method = config.method ?? 'GET';
  const base = config.baseUrl ?? API_URL;
  const url = endpoint.startsWith('http') ? endpoint : `${base.replace(/\/$/, '')}/${endpoint.replace(/^\//, '')}`;
  const headers: Record<string, string> = {
    'X-Client': 'web',
    'X-Requested-With': 'ejoi-web',
    ...config.headers,
  };

  const token = config.authToken ?? session.getAccessToken();
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  let body: BodyInit | undefined;
  if (config.body !== undefined && config.body !== null) {
    if (config.body instanceof FormData) {
      body = config.body;
    } else {
      headers['Content-Type'] = headers['Content-Type'] ?? 'application/json';
      body = JSON.stringify(config.body);
    }
  }

  if (MOCK_API) {
    const mocked = handleMockApiRequest<T>(url, config);
    if (mocked) {
      return mocked;
    }
  }

  const timeoutMs = config.timeoutMs ?? DEFAULT_TIMEOUT_MS;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, {
      method,
      headers,
      body,
      credentials: 'include',
      signal: controller.signal,
    });
    const data = await parseBody(response);
    if (!response.ok) {
      throw new ApiError(response.status, response.statusText, data);
    }
    return { data: data as T, status: response.status, statusText: response.statusText };
  } finally {
    clearTimeout(timer);
  }
}

async function requestInternal<T>(endpoint: string, config: RequestConfig): Promise<ApiResponse<T>> {
  try {
    return await requestOnce<T>(endpoint, config);
  } catch (err) {
    if (
      err instanceof ApiError &&
      err.status === 401 &&
      !config.skipAuthRefresh &&
      !config._retry
    ) {
      try {
        await session.refresh();
      } catch {
        // doRefresh borra el refresh token solo si el backend lo rechazó; si sigue
        // ahí fue un error de red y la sesión puede recuperarse en el próximo intento.
        if (!session.getRefreshToken()) {
          session.clearSession();
          notifySessionExpired();
        }
        throw err;
      }
      return requestOnce<T>(endpoint, { ...config, _retry: true });
    }
    if (err instanceof ApiError && err.status === 401 && config._retry) {
      session.clearSession();
      notifySessionExpired();
    }
    throw err;
  }
}

export const httpClient = {
  request<T = unknown>(endpoint: string, config: RequestConfig = {}) {
    return requestInternal<T>(endpoint, config);
  },
  get<T = unknown>(
    endpoint: string,
    headers?: Record<string, string>,
    options?: Pick<RequestConfig, 'suppressFatalBoundary'>,
  ) {
    return this.request<T>(endpoint, { method: 'GET', headers, ...options });
  },
  post<T = unknown>(endpoint: string, body?: unknown, headers?: Record<string, string>) {
    return this.request<T>(endpoint, { method: 'POST', body, headers });
  },
  put<T = unknown>(endpoint: string, body?: unknown, headers?: Record<string, string>) {
    return this.request<T>(endpoint, { method: 'PUT', body, headers });
  },
  patch<T = unknown>(endpoint: string, body?: unknown, headers?: Record<string, string>) {
    return this.request<T>(endpoint, { method: 'PATCH', body, headers });
  },
  delete<T = unknown>(endpoint: string, headers?: Record<string, string>) {
    return this.request<T>(endpoint, { method: 'DELETE', headers });
  },
  postFormData<T = unknown>(endpoint: string, formData: FormData) {
    return this.request<T>(endpoint, { method: 'POST', body: formData });
  },
};
