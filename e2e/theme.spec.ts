import { expect, test, type Page } from '@playwright/test';

const LIGHT_BG = 'rgb(251, 247, 244)';
const DARK_BG = 'rgb(27, 25, 24)';

const companionProfile = {
  id: 'c1',
  name: 'Luna',
  visualStyle: 'realista',
  persona: 'Amigable y empática',
  intensity: 'balanced',
  interests: ['Arte y cultura', 'Música', 'Viajes'],
  boundaries: [],
};

async function mockApi(page: Page, creation: Record<string, unknown>) {
  await page.route('**/api/**', async (route) => {
    const path = new URL(route.request().url()).pathname.replace(/^\/api/, '');

    if (path.includes('/auth/refresh')) {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ accessToken: 'e2e' }) });
      return;
    }
    if (path.includes('/companion/me/creation')) {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(creation) });
      return;
    }
    if (path.includes('/companion/me/profile')) {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(companionProfile) });
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
    if (path.includes('/chat/')) {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ messages: [], hasMore: false }),
      });
      return;
    }
    if (path.includes('/users/me/onboarding-draft')) {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ data: { webView: 'como' } }),
      });
      return;
    }
    if (path.includes('/campaign/founder-count')) {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ claimed: 0, max: 100 }),
      });
      return;
    }
    await route.fulfill({ status: 200, contentType: 'application/json', body: '{}' });
  });
}

async function applyTheme(page: Page, theme: 'light' | 'dark') {
  await page.evaluate((t) => {
    localStorage.setItem('ejoi.theme', t);
    document.documentElement.dataset.theme = t;
  }, theme);
}

async function expectBodyBg(page: Page, rgb: string) {
  await expect(page.locator('body')).toHaveCSS('background-color', rgb);
}

test.describe('Tema claro/oscuro (SCRUM-112)', () => {
  test.use({ viewport: { width: 1440, height: 900 } });

  test('seis pantallas respetan claro y oscuro', async ({ page }) => {
    const screens: { id: string; path: string; setup?: () => Promise<void> }[] = [
      { id: 'bienvenida', path: '/' },
      { id: 'quien', path: '/crear/paso-1' },
      { id: 'como', path: '/crear/paso-4' },
      {
        id: 'chat-creating',
        path: '/chat',
        setup: () =>
          mockApi(page, {
            state: 'creating',
            steps: { personality: true, interests: true, greeting: false, portrait: false },
            profile: { name: 'Luna', visualStyle: 'realista' },
          }),
      },
      {
        id: 'chat-ready',
        path: '/chat',
        setup: () =>
          mockApi(page, {
            state: 'ready',
            profile: { name: 'Luna', visualStyle: 'realista' },
            firstMessage: { id: 'm1', content: 'Hola' },
          }),
      },
      {
        id: 'editar',
        path: '/chat/editar',
        setup: () =>
          mockApi(page, {
            state: 'ready',
            profile: { name: 'Luna', visualStyle: 'realista' },
          }),
      },
    ];

    for (const screen of screens) {
      if (screen.setup) await screen.setup();
      await page.goto(screen.path);
      await page.waitForLoadState('networkidle');

      await applyTheme(page, 'light');
      await expectBodyBg(page, LIGHT_BG);
      await expect(page.locator('[data-testid="shell-header"], [data-testid="chat-read"]')).toBeVisible();

      await applyTheme(page, 'dark');
      await expectBodyBg(page, DARK_BG);
      await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');

      await page.unroute('**/api/**');
    }
  });

  test('sin saltos de layout al cambiar tema', async ({ page }) => {
    await page.route('**/api/**', async (route) => {
      const path = new URL(route.request().url()).pathname.replace(/^\/api/, '');
      if (path.includes('/auth/refresh')) {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ accessToken: 'e2e-theme-layout' }),
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

    await page.goto('/crear/paso-1');
    await page.getByTestId('shell-footer').waitFor();
    const headerBefore = await page.getByTestId('shell-header').boundingBox();
    const footerBefore = await page.getByTestId('shell-footer').boundingBox();

    await applyTheme(page, 'dark');
    await page.waitForFunction(
      () => !document.documentElement.classList.contains('theme-transition'),
    );
    const headerAfter = await page.getByTestId('shell-header').boundingBox();
    const footerAfter = await page.getByTestId('shell-footer').boundingBox();

    expect(headerBefore).toEqual(headerAfter);
    expect(footerBefore).toEqual(footerAfter);
  });

  test('preferencia persiste tras recargar', async ({ page }) => {
    await page.goto('/');
    await applyTheme(page, 'dark');
    await page.reload();
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  });

  test('tema se elige en la bienvenida', async ({ page }) => {
    await page.goto('/');
    await page.getByTestId('theme-settings-trigger').click();
    await page.getByTestId('theme-settings-dialog').getByRole('radio', { name: 'Oscuro' }).click();
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
    await expect
      .poll(() => page.evaluate(() => localStorage.getItem('ejoi.theme')))
      .toBe('dark');
  });

  test('sin override sigue prefers-color-scheme del dispositivo', async ({ page }) => {
    await page.emulateMedia({ colorScheme: 'dark' });
    await page.goto('/');
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
    await expect
      .poll(() => page.evaluate(() => localStorage.getItem('ejoi.theme')))
      .toBeNull();

    await page.getByTestId('theme-settings-trigger').click();
    await page.getByTestId('theme-settings-dialog').getByRole('radio', { name: 'Auto' }).click();
    await expect
      .poll(() => page.evaluate(() => localStorage.getItem('ejoi.theme')))
      .toBeNull();
  });

  test('tema se cambia desde el menú lateral en el chat', async ({ page }) => {
    await mockApi(page, {
      state: 'ready',
      profile: { name: 'Luna', visualStyle: 'realista' },
      firstMessage: { id: 'm1', content: 'Hola' },
    });
    await page.goto('/chat');
    await page.getByTestId('chat-read').waitFor();

    await page.getByTestId('theme-settings-trigger').click();
    await page.getByTestId('theme-settings-dialog').getByRole('radio', { name: 'Oscuro' }).click();
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  });

  test('hover y foco distinguibles en ambos temas', async ({ page }) => {
    for (const theme of ['light', 'dark'] as const) {
      await page.goto('/');
      await applyTheme(page, theme);
      const btn = page.getByRole('button', { name: 'Términos' });
      await btn.hover();
      const hoverBg = await btn.evaluate((el) => getComputedStyle(el).backgroundColor);
      expect(hoverBg).not.toBe('rgba(0, 0, 0, 0)');

      await btn.focus();
      const focusOutline = await btn.evaluate((el) => getComputedStyle(el).outlineColor);
      expect(focusOutline).not.toBe('rgba(0, 0, 0, 0)');
    }
  });
});
