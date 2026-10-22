import type { Page, Route } from '@playwright/test';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { E2E_TEST_SESSION_SECRET, E2E_USER_ID, fakeAccessToken } from './tokens';

const fixtureDir = path.dirname(fileURLToPath(import.meta.url));
export const TEST_PORTRAIT_PATH = path.join(fixtureDir, 'test-portrait.png');

export type OnboardingDraftBody = {
  schemaVersion: number;
  step: number;
  data: Record<string, unknown>;
};

export type IntegrationMockOptions = {
  userId?: string;
  /** Fallos consecutivos en POST /companion/me antes de éxito. */
  companionCreateFailures?: number;
  /** Retraso en ms antes de pasar de creating a ready en el poll. */
  readyAfterMs?: number;
  /** Vistas que acepta PUT del borrador; fuera de la lista responde 400 como eJoi-BE. */
  draftWebViews?: readonly string[];
};

/** `ONBOARDING_DRAFT_WEB_VIEWS` de eJoi-BE (fix/onboarding-draft-revision-view). */
export const BE_DRAFT_WEB_VIEWS = ['quien', 'como', 'chat', 'revision'] as const;
/** Contrato previo de eJoi-BE develop, sin `revision`. */
export const LEGACY_BE_DRAFT_WEB_VIEWS = ['quien', 'como', 'chat'] as const;

export type IntegrationMockHandle = {
  getDraft: () => OnboardingDraftBody | null;
  getMessagePosts: () => { message: string; clientMessageId?: string }[];
  forceCreationError: () => void;
  advanceCreationReady: () => void;
};

export function resetIntegrationMockState(): void {
  draftStore.clear();
  creationStore.clear();
  messageLog.length = 0;
}

const draftStore = new Map<string, OnboardingDraftBody | null>();
const creationStore = new Map<
  string,
  { state: 'none' | 'creating' | 'ready' | 'error'; creatingSince: number; failuresLeft: number; readyAfterMs: number }
>();
const messageLog: { message: string; clientMessageId?: string }[] = [];

function apiPath(url: string): string {
  return new URL(url).pathname.replace(/^\/api/, '');
}

export async function installIntegrationMock(
  page: Page,
  options: IntegrationMockOptions = {},
): Promise<IntegrationMockHandle> {
  const userId = options.userId ?? E2E_USER_ID;
  const accessToken = fakeAccessToken(userId);
  const draftWebViews = options.draftWebViews ?? BE_DRAFT_WEB_VIEWS;
  if (!draftStore.has(userId)) draftStore.set(userId, null);
  if (!creationStore.has(userId)) {
    creationStore.set(userId, {
      state: 'none',
      creatingSince: 0,
      failuresLeft: options.companionCreateFailures ?? 0,
      readyAfterMs: options.readyAfterMs ?? 0,
    });
  } else if (options.companionCreateFailures !== undefined || options.readyAfterMs !== undefined) {
    const row = creationStore.get(userId)!;
    if (options.companionCreateFailures !== undefined) row.failuresLeft = options.companionCreateFailures;
    if (options.readyAfterMs !== undefined) row.readyAfterMs = options.readyAfterMs;
  }

  const getCreation = () => creationStore.get(userId)!;
  let creationState: 'none' | 'creating' | 'ready' | 'error' = getCreation().state;

  const portraitUrl = 'http://127.0.0.1:4173/__e2e__/test-portrait.png';

  await page.route(portraitUrl, async (route) => {
    await route.fulfill({ path: TEST_PORTRAIT_PATH, contentType: 'image/png' });
  });

  await page.route('**/image/**', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ fileUrl: portraitUrl, storagePath: 'e2e/test-portrait.png' }),
    });
  });

  await page.route('**/api/**', async (route: Route) => {
    const path = apiPath(route.request().url());
    const method = route.request().method();

    if (path.endsWith('/auth/refresh') && method === 'POST') {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ accessToken }),
      });
      return;
    }

    if (path.endsWith('/auth/test-session') && method === 'POST') {
      const secret = route.request().headers()['x-test-session-secret'];
      if (secret !== E2E_TEST_SESSION_SECRET) {
        await route.fulfill({ status: 404, body: 'Not found' });
        return;
      }
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          accessToken,
          user: { id: userId, email: `${userId}@e2e.test` },
        }),
      });
      return;
    }

    if (path.includes('/users/me/onboarding-draft') && method === 'GET') {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ draft: draftStore.get(userId) ?? null }),
      });
      return;
    }

    if (path.includes('/users/me/onboarding-draft') && method === 'PUT') {
      const nextDraft = route.request().postDataJSON() as OnboardingDraftBody;
      const webView = nextDraft.data?.webView;
      if (typeof webView === 'string' && !draftWebViews.includes(webView)) {
        // Igual que eJoi-BE: ValidationPipe con IsIn(ONBOARDING_DRAFT_WEB_VIEWS).
        await route.fulfill({
          status: 400,
          contentType: 'application/json',
          body: JSON.stringify({ message: ['data.webView must be one of the following values'] }),
        });
        return;
      }
      draftStore.set(userId, nextDraft);
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ draft: nextDraft }),
      });
      return;
    }

    if (path.includes('/companion/me/creation') && method === 'GET') {
      const creation = getCreation();
      creationState = creation.state;
      if (creationState === 'creating' && creation.readyAfterMs > 0 && creation.creatingSince > 0) {
        if (Date.now() - creation.creatingSince >= creation.readyAfterMs) {
          creation.state = 'ready';
          creationState = 'ready';
        }
      }
      const body =
        creationState === 'ready'
          ? {
              state: 'ready',
              steps: { personality: true, interests: true, greeting: true, portrait: true },
              profile: { id: 'c1', name: 'Luna', visualStyle: 'realista', avatarUrl: portraitUrl },
              firstMessage: { id: 'm1', content: 'Hola, soy Luna', meta: { quickReplies: ['Sí'] } },
            }
          : creationState === 'error'
            ? {
                state: 'error',
                error: { code: 'E2E_FAIL' },
                profile: { name: 'Luna', visualStyle: 'realista' },
              }
            : creationState === 'creating'
              ? {
                  state: 'creating',
                  steps: { personality: true, interests: true, greeting: false, portrait: false },
                  profile: { name: 'Luna', visualStyle: 'realista' },
                }
              : { state: 'none' };

      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(body) });
      return;
    }

    if (path.endsWith('/companion/me') && method === 'POST') {
      const creation = getCreation();
      if (creation.failuresLeft > 0) {
        creation.failuresLeft -= 1;
        creation.state = 'error';
        creationState = 'error';
        await route.fulfill({ status: 500, contentType: 'application/json', body: JSON.stringify({ code: 'E2E_FAIL' }) });
        return;
      }
      creation.state = 'creating';
      creation.creatingSince = Date.now();
      creationState = 'creating';
      if (creation.readyAfterMs === 0) {
        creation.state = 'ready';
        creationState = 'ready';
      }
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ id: 'c1', name: 'Luna' }),
      });
      return;
    }

    if (path.includes('/companion/me/profile') || (path.endsWith('/companion/me') && method === 'GET')) {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          id: 'c1',
          name: 'Luna',
          visualStyle: 'realista',
          persona: 'Amigable y empática',
          intensity: 'balanced',
          interests: ['Música', 'Cine', 'Viajes'],
          boundaries: [],
          avatarUrl: portraitUrl,
        }),
      });
      return;
    }

    if (path.includes('/chat/message') && method === 'POST') {
      const payload = route.request().postDataJSON() as {
        message?: string;
        clientMessageId?: string;
      };
      messageLog.push({
        message: payload.message ?? '',
        clientMessageId: payload.clientMessageId,
      });
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ id: 'out-1', content: 'Recibido', role: 'assistant' }),
      });
      return;
    }

    if (path.includes('/chat/')) {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ messages: [], hasMore: false }),
      });
      return;
    }

    if (path.includes('/subscription/me')) {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ remainingMessages: 12, planLabel: 'basic' }),
      });
      return;
    }

    if (path.includes('/campaign/founder-count')) {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ claimed: 12, max: 100 }),
      });
      return;
    }

    if (path.includes('/users/me/consents') && method === 'POST') {
      await route.fulfill({ status: 200, contentType: 'application/json', body: '{}' });
      return;
    }

    if (path.includes('/companion/greeting-preview') && method === 'POST') {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ greeting: 'Hola, encantada de conocerte.' }),
      });
      return;
    }

    await route.fulfill({ status: 200, contentType: 'application/json', body: '{}' });
  });

  return {
    getDraft: () => draftStore.get(userId) ?? null,
    getMessagePosts: () => [...messageLog],
    forceCreationError: () => {
      getCreation().state = 'error';
    },
    advanceCreationReady: () => {
      getCreation().state = 'ready';
    },
  };
}

/** C4: POST /auth/test-session (mock en preview o backend 3.5 vía proxy). */
export async function loginWithTestSession(page: Page): Promise<void> {
  await page.evaluate(async (secret) => {
    const res = await fetch('/api/auth/test-session', {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        'X-Test-Session-Secret': secret,
        'X-Client': 'web',
        'X-Requested-With': 'ejoi-web',
      },
      body: JSON.stringify({ providerUserId: 'e2e-scrum-116' }),
    });
    if (!res.ok) throw new Error(`test-session ${res.status}`);
  }, E2E_TEST_SESSION_SECRET);
}
