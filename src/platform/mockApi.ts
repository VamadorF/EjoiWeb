/**
 * API simulada para desarrollo/preview sin eJoi-BE (activar con VITE_MOCK_API=true).
 * Contrato alineado con e2e/fixtures/integrationMock.ts.
 */

import {
  buildFirstMessageTemplate,
  buildQuickReplies,
  catalogInterestsFromSelection,
} from './mockGreeting';

export type MockRequestConfig = {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  body?: unknown;
  authToken?: string;
};

type MockApiResponse<T> = {
  data: T;
  status: number;
  statusText: string;
};

export const MOCK_USER_ID = 'mock-dev-user';
export const MOCK_DEMO_SESSION_KEY = 'ejoi-mock-demo-logged-in';

export function isMockDemoLoggedIn(): boolean {
  if (typeof sessionStorage === 'undefined') return false;
  return sessionStorage.getItem(MOCK_DEMO_SESSION_KEY) === '1';
}

export function setMockDemoLoggedIn(): void {
  if (typeof sessionStorage === 'undefined') return;
  sessionStorage.setItem(MOCK_DEMO_SESSION_KEY, '1');
}

const MOCK_PORTRAIT_PATH = '/portraits/realista-femenino.webp';

type OnboardingDraftBody = {
  schemaVersion: number;
  step: number;
  data: Record<string, unknown>;
};

type MockCompanionProfile = {
  id: string;
  name: string;
  visualStyle: string;
  gender: string;
  persona: string;
  intensity: string;
  interests: string[];
  boundaries: string[];
  age?: number;
  ethnicity?: string;
  hairColor?: string;
  voiceKey?: string;
};

type MockChatMessage = {
  id: string;
  content: string;
  role: 'user' | 'assistant';
  meta?: Record<string, unknown>;
};

const CREATION_READY_MS = 3000;
const CREATION_STEP_GREETING_MS = 1000;
const CREATION_STEP_PORTRAIT_MS = 2000;

type CreationRow = {
  state: 'none' | 'creating' | 'ready' | 'error';
  creatingSince: number;
  companion?: MockCompanionProfile;
};

function defaultMockCompanion(): MockCompanionProfile {
  return {
    id: 'c1',
    name: 'Luna',
    visualStyle: 'realista',
    gender: 'femenino',
    persona: 'Amigable y empática',
    intensity: 'balanced',
    interests: ['Música', 'Cine y series', 'Viajes'],
    boundaries: [],
  };
}

function portraitPathFor(style: string, gender: string): string {
  const illustrated = style === 'anime';
  const masculine = gender === 'masculino';
  if (illustrated) {
    return masculine ? '/portraits/ilustrado-masculino.webp' : '/portraits/ilustrado-femenino.webp';
  }
  return masculine ? '/portraits/realista-masculino.webp' : '/portraits/realista-femenino.webp';
}

function portraitUrlForCompanion(companion: MockCompanionProfile): string {
  const path = portraitPathFor(companion.visualStyle, companion.gender);
  if (typeof window !== 'undefined') {
    return new URL(path, window.location.origin).href;
  }
  return path;
}

function companionFromPost(body: Record<string, unknown>): MockCompanionProfile {
  const base = defaultMockCompanion();
  const name = typeof body.name === 'string' ? body.name.trim() : '';
  const visualStyle = typeof body.visualStyle === 'string' ? body.visualStyle : base.visualStyle;
  const gender = typeof body.gender === 'string' ? body.gender : base.gender;
  const persona = typeof body.persona === 'string' ? body.persona : base.persona;
  const intensity = typeof body.intensity === 'string' ? body.intensity : base.intensity;
  const interests = Array.isArray(body.interests)
    ? body.interests.filter((item): item is string => typeof item === 'string')
    : base.interests;
  const boundaries = Array.isArray(body.boundaries)
    ? body.boundaries.filter((item): item is string => typeof item === 'string')
    : base.boundaries;
  const age = typeof body.age === 'number' ? body.age : undefined;
  const ethnicity = typeof body.ethnicity === 'string' ? body.ethnicity.trim() : undefined;
  const hairColor = typeof body.hairColor === 'string' ? body.hairColor.trim() : undefined;
  const voiceKey = typeof body.voiceKey === 'string' ? body.voiceKey.trim().toUpperCase() : undefined;

  return {
    ...base,
    name: name || base.name,
    visualStyle,
    gender,
    persona,
    intensity,
    interests,
    boundaries,
    ...(age != null ? { age } : {}),
    ...(ethnicity ? { ethnicity } : {}),
    ...(hairColor ? { hairColor } : {}),
    ...(voiceKey ? { voiceKey } : {}),
  };
}

function patchCompanionProfile(
  current: MockCompanionProfile,
  patch: Record<string, unknown>,
): MockCompanionProfile {
  const next = { ...current };
  if (typeof patch.name === 'string') next.name = patch.name.trim() || next.name;
  if (typeof patch.visualStyle === 'string') next.visualStyle = patch.visualStyle;
  if (typeof patch.gender === 'string') next.gender = patch.gender;
  if (typeof patch.persona === 'string') next.persona = patch.persona;
  if (typeof patch.intensity === 'string') next.intensity = patch.intensity;
  if (Array.isArray(patch.interests)) {
    next.interests = patch.interests.filter((item): item is string => typeof item === 'string');
  }
  if (Array.isArray(patch.boundaries)) {
    next.boundaries = patch.boundaries.filter((item): item is string => typeof item === 'string');
  }
  if (typeof patch.age === 'number') next.age = patch.age;
  if (typeof patch.ethnicity === 'string') next.ethnicity = patch.ethnicity.trim();
  if (typeof patch.hairColor === 'string') next.hairColor = patch.hairColor.trim();
  if (typeof patch.voiceKey === 'string') next.voiceKey = patch.voiceKey.trim().toUpperCase();
  return next;
}

function creationElapsedMs(creation: CreationRow): number {
  if (creation.state !== 'creating' || creation.creatingSince <= 0) return 0;
  return Date.now() - creation.creatingSince;
}

function creationStepsForElapsed(elapsedMs: number) {
  return {
    personality: true,
    interests: true,
    greeting: elapsedMs >= CREATION_STEP_GREETING_MS,
    portrait: elapsedMs >= CREATION_STEP_PORTRAIT_MS,
  };
}

function buildTemplateFirstMessage(companion: MockCompanionProfile) {
  const basedOnInterests = catalogInterestsFromSelection(companion.interests);
  return {
    id: 'm1',
    content: buildFirstMessageTemplate(companion.name, companion.interests),
    meta: {
      kind: 'first_message',
      basedOnInterests,
      basedOnPersona: null,
      quickReplies: buildQuickReplies(companion.interests),
      source: 'template',
    },
  };
}

function seedChatFirstMessage(userId: string, companion: MockCompanionProfile) {
  const first = buildTemplateFirstMessage(companion);
  chatStore.set(userId, [
    {
      id: first.id,
      content: first.content,
      role: 'assistant',
      meta: first.meta,
    },
  ]);
}

function syncCreationReady(userId: string, creation: CreationRow) {
  if (creation.state !== 'creating' || creation.creatingSince <= 0) return;
  if (creationElapsedMs(creation) < CREATION_READY_MS) return;
  creation.state = 'ready';
  seedChatFirstMessage(userId, getMockCompanion(userId));
}

function getMockCompanion(userId: string): MockCompanionProfile {
  const row = creationStore.get(userId);
  return row?.companion ?? defaultMockCompanion();
}

const draftStore = new Map<string, OnboardingDraftBody | null>();
const creationStore = new Map<string, CreationRow>();
const chatStore = new Map<string, MockChatMessage[]>();

export function resetMockApiStoresForTests(): void {
  draftStore.clear();
  creationStore.clear();
  chatStore.clear();
}

function portraitUrl(): string {
  if (typeof window !== 'undefined') {
    return new URL(MOCK_PORTRAIT_PATH, window.location.origin).href;
  }
  return MOCK_PORTRAIT_PATH;
}

function fakeAccessToken(userId: string): string {
  const enc = (value: object) =>
    btoa(JSON.stringify(value))
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');
  return `${enc({ alg: 'none', typ: 'JWT' })}.${enc({ userId, sub: userId })}.mock`;
}

function authBody(userId: string) {
  return {
    accessToken: fakeAccessToken(userId),
    user: { id: userId, email: 'demo@ejoi.test', name: 'Luna demo' },
  };
}

export function normalizeApiPath(url: string): string {
  try {
    const parsed = url.startsWith('http') ? new URL(url) : new URL(url, 'http://mock.local');
    let path = parsed.pathname;
    if (path.startsWith('/api/')) path = path.slice(4);
    if (!path.startsWith('/')) path = `/${path}`;
    return path;
  } catch {
    return url;
  }
}

function ensureUser(userId: string) {
  if (!draftStore.has(userId)) draftStore.set(userId, null);
  if (!creationStore.has(userId)) {
    creationStore.set(userId, { state: 'none', creatingSince: 0 });
  }
}

function getUserIdFromAuth(config: Pick<MockRequestConfig, 'authToken'>): string {
  const token = config.authToken;
  if (token) {
    try {
      const segment = token.split('.')[1];
      if (segment) {
        const json = atob(segment.replace(/-/g, '+').replace(/_/g, '/'));
        const payload = JSON.parse(json) as { userId?: string; sub?: string };
        const id = payload.userId?.trim() || payload.sub?.trim();
        if (id) return id;
      }
    } catch {
      /* fallback */
    }
  }
  return MOCK_USER_ID;
}

function ok<T>(data: T, status = 200): MockApiResponse<T> {
  return { data, status, statusText: 'OK' };
}

function unauthorized<T>(): MockApiResponse<T> {
  return { data: {} as T, status: 401, statusText: 'Unauthorized' };
}

function serverError<T>(): MockApiResponse<T> {
  return { data: {} as T, status: 500, statusText: 'Internal Server Error' };
}

function shouldFailCompanionCreateOnce(): boolean {
  if (typeof window === 'undefined') return false;
  return new URLSearchParams(window.location.search).get('demoFail') === 'create';
}

export function handleMockApiRequest<T>(
  absoluteOrRelativeUrl: string,
  config: MockRequestConfig,
): MockApiResponse<T> | null {
  const method = config.method ?? 'GET';
  const path = normalizeApiPath(absoluteOrRelativeUrl);

  if (path.endsWith('/image/generate') && method === 'POST') {
    return ok({
      fileUrl: portraitUrl(),
      storagePath: 'mock/portrait.webp',
    } as T);
  }

  const userId = getUserIdFromAuth(config);
  ensureUser(userId);
  const creation = creationStore.get(userId)!;

  if (path.endsWith('/auth/refresh') && method === 'POST') {
    if (!isMockDemoLoggedIn()) return unauthorized<T>();
    return ok(authBody(userId) as T);
  }

  if (
    (path.endsWith('/auth/google') || path.endsWith('/auth/apple') || path.endsWith('/auth/mock-login')) &&
    method === 'POST'
  ) {
    setMockDemoLoggedIn();
    return ok(authBody(userId) as T);
  }

  if (path.endsWith('/auth/logout') && method === 'POST') {
    return ok({} as T);
  }

  if (path.includes('/users/me/onboarding-draft') && method === 'GET') {
    return ok({ draft: draftStore.get(userId) ?? null } as T);
  }

  if (path.includes('/users/me/onboarding-draft') && (method === 'PUT' || method === 'PATCH')) {
    const nextDraft = config.body as OnboardingDraftBody;
    draftStore.set(userId, nextDraft);
    return ok({ draft: nextDraft } as T);
  }

  if (path.includes('/companion/me/creation') && method === 'GET') {
    syncCreationReady(userId, creation);
    const elapsed = creationElapsedMs(creation);
    const companion = getMockCompanion(userId);
    const profileSummary = {
      id: companion.id,
      name: companion.name,
      visualStyle: companion.visualStyle,
      avatarUrl: portraitUrlForCompanion(companion),
    };
    const body =
      creation.state === 'ready'
        ? {
            state: 'ready',
            steps: { personality: true, interests: true, greeting: true, portrait: true },
            profile: profileSummary,
            firstMessage: buildTemplateFirstMessage(companion),
          }
        : creation.state === 'error'
          ? {
              state: 'error',
              error: { code: 'MOCK_FAIL' },
              profile: { name: companion.name, visualStyle: companion.visualStyle },
            }
          : creation.state === 'creating'
            ? {
                state: 'creating',
                steps: creationStepsForElapsed(elapsed),
                profile: profileSummary,
              }
            : { state: 'none' };
    return ok(body as T);
  }

  if (path.endsWith('/companion/me') && method === 'POST') {
    creation.companion = companionFromPost((config.body ?? {}) as Record<string, unknown>);
    if (shouldFailCompanionCreateOnce()) {
      creation.state = 'error';
      return serverError<T>();
    }
    creation.state = 'creating';
    creation.creatingSince = Date.now();
    chatStore.delete(userId);
    const created = getMockCompanion(userId);
    return ok({ id: created.id, name: created.name } as T);
  }

  if (path.includes('/companion/me/profile') || (path.endsWith('/companion/me') && method === 'GET')) {
    const companion = getMockCompanion(userId);
    return ok({
      ...companion,
      avatarUrl: portraitUrlForCompanion(companion),
    } as T);
  }

  if (path.endsWith('/companion/me') && method === 'PATCH') {
    const patched = patchCompanionProfile(
      getMockCompanion(userId),
      (config.body ?? {}) as Record<string, unknown>,
    );
    creation.companion = patched;
    return ok({
      ...patched,
      avatarUrl: portraitUrlForCompanion(patched),
    } as T);
  }

  if (path.includes('/chat/message') && method === 'POST') {
    const payload = (config.body ?? {}) as { message?: string; clientMessageId?: string };
    const userText = typeof payload.message === 'string' ? payload.message : '';
    const userIdMsg = payload.clientMessageId ?? `user-${Date.now()}`;
    const thread = chatStore.get(userId) ?? [];
    thread.push({ id: userIdMsg, content: userText, role: 'user' });
    const assistantId = `mock-${Date.now()}`;
    const assistant = {
      id: assistantId,
      content: 'Cuéntame más sobre eso.',
      role: 'assistant' as const,
    };
    thread.push(assistant);
    chatStore.set(userId, thread);
    return ok(assistant as T);
  }

  if (path.includes('/chat/history') && method === 'GET') {
    syncCreationReady(userId, creation);
    const messages = chatStore.get(userId) ?? [];
    return ok({ messages, hasMore: false, nextCursor: null } as T);
  }

  if (path.includes('/chat/') && method === 'GET') {
    return ok({ messages: [], hasMore: false } as T);
  }

  if (path.includes('/subscription/me')) {
    return ok({ messagesRemaining: 54, planLabel: 'basic' } as T);
  }

  if (path.includes('/campaign/founder-count')) {
    return ok({ claimed: 42, max: 100 } as T);
  }

  if (path.includes('/campaign/referral/preview')) {
    return ok({ valid: true, inviterName: 'Alex' } as T);
  }

  if (path.includes('/campaign/referral/apply') && method === 'POST') {
    return ok({} as T);
  }

  if (path.includes('/users/me/consents') && method === 'POST') {
    return ok({} as T);
  }

  if (path.includes('/companion/greeting-preview') && method === 'POST') {
    const payload = (config.body ?? {}) as { name?: string; interests?: string[] };
    const name = typeof payload.name === 'string' && payload.name.trim() ? payload.name.trim() : 'Luna';
    const interests = Array.isArray(payload.interests)
      ? payload.interests.filter((item): item is string => typeof item === 'string')
      : [];
    return ok({
      greeting: buildFirstMessageTemplate(name, interests),
      basedOnInterests: catalogInterestsFromSelection(interests),
      quickReplies: buildQuickReplies(interests),
      source: 'template',
    } as T);
  }

  if (method === 'GET' || method === 'POST' || method === 'PUT' || method === 'PATCH') {
    return ok({} as T);
  }

  return null;
}

export function installMockFetch(): void {
  if (typeof window === 'undefined' || (window as { __ejoiMockFetch?: boolean }).__ejoiMockFetch) {
    return;
  }
  (window as { __ejoiMockFetch?: boolean }).__ejoiMockFetch = true;
  const nativeFetch = window.fetch.bind(window);
  window.fetch = async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
    const url = typeof input === 'string' ? input : input instanceof URL ? input.href : input.url;
    const method = init?.method ?? (input instanceof Request ? input.method : 'GET');
    const path = normalizeApiPath(url);
    if (!path.startsWith('/auth/') && !path.startsWith('/users/') && !path.startsWith('/companion') && !path.startsWith('/chat') && !path.startsWith('/campaign') && !path.startsWith('/subscription') && !path.startsWith('/image')) {
      return nativeFetch(input, init);
    }
    let body: unknown;
    if (init?.body && typeof init.body === 'string') {
      try {
        body = JSON.parse(init.body);
      } catch {
        body = init.body;
      }
    }
    const token =
      init?.headers && typeof init.headers === 'object' && !(init.headers instanceof Headers)
        ? (init.headers as Record<string, string>).Authorization?.replace(/^Bearer\s+/i, '')
        : undefined;
    const mocked = handleMockApiRequest(url, {
      method: method as MockRequestConfig['method'],
      body,
      authToken: token,
    });
    if (!mocked) {
      return nativeFetch(input, init);
    }
    return new Response(JSON.stringify(mocked.data), {
      status: mocked.status,
      statusText: mocked.statusText,
      headers: { 'Content-Type': 'application/json' },
    });
  };
}
