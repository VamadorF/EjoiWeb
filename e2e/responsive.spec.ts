import { expect, test, type Page } from '@playwright/test';

const emptyDraft = {
  schemaVersion: 1,
  step: 2,
  webView: 'quien' as const,
  data: {
    gender: 'femenino',
    visualStyle: 'realista',
    interests: ['Música', 'Cine', 'Viajes'],
  },
};

async function mockCreationApi(page: Page) {
  let draft: typeof emptyDraft | null = null;

  await page.addInitScript(() => {
    sessionStorage.setItem('ejoi-mock-demo-logged-in', '1');
  });

  await page.route('**/api/**', async (route) => {
    const path = new URL(route.request().url()).pathname.replace(/^\/api/, '');

    if (path.includes('/auth/refresh') || path.includes('/auth/session')) {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ accessToken: 'e2e-responsive' }),
      });
      return;
    }

    if (path.includes('/users/me/onboarding-draft') && route.request().method() === 'GET') {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ draft: draft ? { data: draft.data } : null }),
      });
      return;
    }

    if (path.includes('/users/me/onboarding-draft') && route.request().method() === 'PUT') {
      const body = route.request().postDataJSON() as typeof emptyDraft;
      draft = {
        ...emptyDraft,
        ...body,
        data: { ...emptyDraft.data, ...(body.data ?? {}) },
      };
      await route.fulfill({ status: 200, contentType: 'application/json', body: '{}' });
      return;
    }

    await route.fulfill({ status: 200, contentType: 'application/json', body: '{}' });
  });
}

async function pickMinimalStep1(page: Page) {
  await page.waitForSelector('.opt, .create-option');
  await page.getByRole('radio', { name: 'Femenino' }).click({ force: true });
  await page.getByRole('radio', { name: 'Amigable y empática' }).click({ force: true });
  await page.getByRole('radio', { name: 'Realista' }).click({ force: true });
}

test.describe('Responsive creación', () => {
  test('1280×800 sin panel lateral y retrato 140 px', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await mockCreationApi(page);
    await page.goto('/crear/paso-1');
    await expect(page.getByTestId('shell-preview')).toHaveCount(0);
    const thumb = page.locator('.opt__thumb').first();
    await expect(thumb).toHaveCSS('max-height', '140px');
  });

  test('1024×768 sin panel lateral e intereses en 4 columnas', async ({ page }) => {
    await page.setViewportSize({ width: 1024, height: 768 });
    await mockCreationApi(page);
    await page.goto('/crear/paso-1');
    await expect(page.getByTestId('shell-preview')).toHaveCount(0);
    await pickMinimalStep1(page);
    await page.getByRole('button', { name: 'Continuar' }).click();
    await page.waitForURL('**/crear/paso-2');
    await page.getByRole('button', { name: 'Continuar' }).click();
    await page.waitForURL('**/crear/paso-3');
    const interestsGrid = page.locator('[aria-labelledby="wizard-interests"] .option-grid');
    const columns = await interestsGrid.evaluate((el) =>
      getComputedStyle(el).gridTemplateColumns.split(' ').filter(Boolean).length,
    );
    expect(columns).toBe(4);
  });

  test('800 px usa flujo móvil de 4 pasos', async ({ page }) => {
    await page.setViewportSize({ width: 800, height: 1000 });
    await mockCreationApi(page);
    await page.goto('/crear/paso-1');
    await expect(page.getByTestId('create-wizard')).toBeVisible();
    await expect(page.getByTestId('create-wizard-step')).toContainText('1/4');
  });

  test('cambiar ancho no descarta el draft', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await mockCreationApi(page);
    await page.goto('/crear/paso-1');
    await expect(page.getByRole('heading', { level: 1, name: 'Crea tu compañía' })).toBeVisible();
    await pickMinimalStep1(page);
    await page.waitForTimeout(400);
    await page.setViewportSize({ width: 800, height: 1000 });
    await expect(page.getByTestId('create-wizard')).toBeVisible();
    await expect(page.getByRole('radio', { name: 'Femenino' })).toHaveAttribute('aria-checked', 'true');
    await page.getByRole('button', { name: 'Continuar' }).click();
    await expect(page.getByTestId('create-wizard-step')).toContainText('2/4');
  });
});

test.describe('Chat bajo 1024', () => {
  test.use({ viewport: { width: 800, height: 900 } });

  test('chat a ancho del panel, sin sidebar', async ({ page }) => {
    await page.route('**/api/**', async (route) => {
      const path = new URL(route.request().url()).pathname.replace(/^\/api/, '');
      if (path.includes('/auth/refresh')) {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ accessToken: 'e2e-chat-mobile' }),
        });
        return;
      }
      if (path.includes('/companion/me/creation')) {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            state: 'ready',
            profile: { id: 'c1', name: 'Luna', visualStyle: 'realista' },
            firstMessage: { id: 'm1', content: 'Hola', meta: { quickReplies: ['Sí'] } },
          }),
        });
        return;
      }
      if (path.includes('/companion/me/profile') || path.includes('/companion/me')) {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            id: 'c1',
            name: 'Luna',
            visualStyle: 'realista',
            persona: 'Amigable y empática',
            intensity: 'balanced',
            interests: ['Música'],
            boundaries: [],
          }),
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
      if (path.includes('/users/me/onboarding-draft')) {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ draft: null }),
        });
        return;
      }
      await route.fulfill({ status: 200, contentType: 'application/json', body: '{}' });
    });

    await page.goto('/chat');
    await page.waitForSelector('[data-testid="chat-composer"]');
    const read = page.getByTestId('chat-read');
    const readBox = await read.boundingBox();
    expect(readBox?.width ?? 0).toBeGreaterThan(700);
    await expect(page.getByTestId('chat-menu')).toHaveCount(0);
    await expect(page.getByTestId('chat-menu-toggle')).toHaveCount(0);
    await expect(page.getByTestId('home-tabs')).toBeVisible();
    await expect(page.getByTestId('theme-settings-trigger')).toBeVisible();
  });
});
