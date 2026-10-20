import { expect, test } from '@playwright/test';

test.describe('Desktop shell 1440×900', () => {
  test.use({ viewport: { width: 1440, height: 900 } });

  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      sessionStorage.setItem('ejoi-mock-demo-logged-in', '1');
    });
    await page.route('**/api/**', async (route) => {
      const path = new URL(route.request().url()).pathname.replace(/^\/api/, '');
      if (path.includes('/auth/refresh')) {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ accessToken: 'e2e-layout' }),
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
  });

  test('/crear/quien cabe sin scroll vertical', async ({ page }) => {
    await page.goto('/crear/quien');
    const scrollHeight = await page.evaluate(() => document.documentElement.scrollHeight);
    expect(scrollHeight).toBeLessThanOrEqual(900);
    const main = page.locator('#main-content');
    const mainScroll = await main.evaluate((el) => ({
      scrollHeight: el.scrollHeight,
      clientHeight: el.clientHeight,
    }));
    expect(mainScroll.scrollHeight).toBeLessThanOrEqual(mainScroll.clientHeight);
  });

  test('/crear/como cabe sin scroll en el main', async ({ page }) => {
    await page.goto('/crear/como');
    const main = page.locator('#main-content');
    const mainScroll = await main.evaluate((el) => ({
      scrollHeight: el.scrollHeight,
      clientHeight: el.clientHeight,
    }));
    expect(mainScroll.scrollHeight).toBeLessThanOrEqual(mainScroll.clientHeight);
  });

  test('opción seleccionada en Vista 2 usa borde de selección', async ({ page }) => {
    await page.goto('/crear/quien');
    const femenino = page.getByRole('radio', { name: 'Femenino' });
    await femenino.click();
    const styles = await femenino.evaluate((el) => {
      const cs = getComputedStyle(el);
      return {
        borderWidth: cs.borderTopWidth,
        background: cs.backgroundColor,
      };
    });
    expect(styles.borderWidth).toBe('2px');
    expect(styles.background).not.toBe('rgba(0, 0, 0, 0)');
  });

  test('medidas del shell de creación', async ({ page }) => {
    await page.goto('/crear/quien');
    const header = page.getByTestId('shell-header');
    const preview = page.getByTestId('shell-preview');
    const footer = page.getByTestId('shell-footer');

    await expect(header).toHaveCSS('height', '72px');
    await expect(preview).toHaveCSS('width', '420px');
    await expect(footer).toHaveCSS('height', '88px');
  });

  test('medidas del shell de chat', async ({ page }) => {
    await page.route('**/api/**', async (route) => {
      const path = new URL(route.request().url()).pathname.replace(/^\/api/, '');
      if (path.includes('/auth/refresh')) {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ accessToken: 'e2e-layout' }),
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
            firstMessage: { id: 'm1', content: 'Hola', meta: {} },
          }),
        });
        return;
      }
      if (path.includes('/companion/me')) {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            id: 'c1',
            name: 'Luna',
            visualStyle: 'realista',
            interests: [],
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
          body: JSON.stringify({ messagesRemaining: 12 }),
        });
        return;
      }
      await route.fulfill({ status: 200, contentType: 'application/json', body: '{}' });
    });
    await page.goto('/chat');
    await page.waitForSelector('[data-testid="chat-read"]');
    const menu = page.getByTestId('chat-menu');
    const read = page.getByTestId('chat-read');
    const profile = page.getByTestId('chat-profile');

    const menuBox = await menu.boundingBox();
    const readBox = await read.boundingBox();
    const profileBox = await profile.boundingBox();

    expect(menuBox?.width).toBe(264);
    expect(readBox?.width).toBeGreaterThanOrEqual(680);
    expect(readBox?.width).toBeLessThanOrEqual(900);
    expect(profileBox?.width).toBe(320);
  });

  test('chat: encabezado, cupo y burbujas del manual', async ({ page }) => {
    await page.route('**/api/**', async (route) => {
      const path = new URL(route.request().url()).pathname.replace(/^\/api/, '');
      if (path.includes('/auth/refresh')) {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ accessToken: 'e2e-layout-chat-ui' }),
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
            firstMessage: { id: 'm1', content: 'Hola', meta: {} },
          }),
        });
        return;
      }
      if (path.includes('/companion/me')) {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ id: 'c1', name: 'Luna', visualStyle: 'realista', interests: [], boundaries: [] }),
        });
        return;
      }
      if (path.includes('/chat/')) {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            messages: [{ id: 'u1', role: 'user', message: 'Hola Luna' }],
            hasMore: false,
          }),
        });
        return;
      }
      if (path.includes('/subscription/me')) {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ messagesRemaining: 12 }),
        });
        return;
      }
      await route.fulfill({ status: 200, contentType: 'application/json', body: '{}' });
    });

    await page.goto('/chat');
    await page.waitForSelector('[data-testid="chat-conv-header"]');
    await expect(page.getByTestId('chat-quota')).toContainText('12 mensajes restantes');

    const aiBubble = page.locator('.bubble--ai').first();
    const userBubble = page.locator('.bubble--user').first();
    await expect(aiBubble).toBeVisible();
    await expect(userBubble).toBeVisible();

    const aiBg = await aiBubble.evaluate((el) => getComputedStyle(el).backgroundColor);
    const userBg = await userBubble.evaluate((el) => getComputedStyle(el).backgroundColor);
    expect(aiBg).not.toBe('rgba(0, 0, 0, 0)');
    expect(userBg).not.toBe(aiBg);
  });
});

test.describe('Desktop shell 1280×800', () => {
  test.use({ viewport: { width: 1280, height: 800 } });

  test('preview lateral 360 px', async ({ page }) => {
    await page.goto('/crear/quien');
    await expect(page.getByTestId('shell-preview')).toHaveCSS('width', '360px');
  });
});

test.describe('Desktop shell 1024×768', () => {
  test.use({ viewport: { width: 1024, height: 768 } });

  test('franja preview 72 px', async ({ page }) => {
    await page.route('**/api/**', async (route) => {
      const path = new URL(route.request().url()).pathname.replace(/^\/api/, '');
      if (path.includes('/auth/refresh')) {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ accessToken: 'e2e-layout-1024' }),
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
    await page.goto('/crear/quien');
    await expect(page.getByTestId('shell-preview')).toHaveCSS('height', '72px');
  });
});
