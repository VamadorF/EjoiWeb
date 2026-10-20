import { expect, test, type Page } from '@playwright/test';

async function mockAuthedApi(page: Page, creation?: Record<string, unknown>) {
  await page.route('**/api/**', async (route) => {
    const path = new URL(route.request().url()).pathname.replace(/^\/api/, '');

    if (path.includes('/auth/refresh')) {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ accessToken: 'e2e-keyboard' }),
      });
      return;
    }
    if (path.includes('/companion/me/creation')) {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(
          creation ?? {
            state: 'ready',
            profile: { id: 'c1', name: 'Luna', visualStyle: 'realista' },
            firstMessage: { id: 'm1', content: 'Hola', meta: { quickReplies: ['Sí'] } },
          },
        ),
      });
      return;
    }
    if (
      path.includes('/companion/me/profile') ||
      (path.includes('/companion/me') && route.request().method() === 'GET')
    ) {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          id: 'c1',
          name: 'Luna',
          visualStyle: 'realista',
          persona: 'Amigable y empática',
          intensity: 'balanced',
          interests: ['Arte y cultura', 'Música', 'Viajes'],
          boundaries: [],
        }),
      });
      return;
    }
    if (path.includes('/chat/message') && route.request().method() === 'POST') {
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
    if (path.includes('/users/me/onboarding-draft')) {
      const method = route.request().method();
      if (method === 'GET') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            data: {
              gender: 'femenino',
              visualStyle: 'realista',
              interests: ['Arte y cultura', 'Música', 'Viajes'],
              persona: 'Amigable y empática',
              intensity: 'balanced',
              boundaries: [],
              companionName: 'Luna',
              webView: 'como',
            },
          }),
        });
        return;
      }
      await route.fulfill({ status: 200, contentType: 'application/json', body: '{}' });
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
    await route.fulfill({ status: 200, contentType: 'application/json', body: '{}' });
  });
}

async function collectTabStops(page: Page) {
  const seen = new Set<string>();
  const order: string[] = [];
  for (let i = 0; i < 40; i += 1) {
    await page.keyboard.press('Tab');
    const tag = await page.evaluate(() => {
      const active = document.activeElement as HTMLElement | null;
      if (!active || active === document.body || active === document.documentElement) return '';
      return `${active.tagName}:${active.getAttribute('data-testid') ?? active.className}`;
    });
    if (!tag) continue;
    if (seen.has(tag)) break;
    seen.add(tag);
    order.push(tag);
  }
  return order;
}

test.describe('Teclado desktop (SCRUM-113)', () => {
  test.use({ viewport: { width: 1440, height: 900 } });

  test('preview de creación no recibe foco', async ({ page }) => {
    await mockAuthedApi(page);
    await page.goto('/crear/quien');
    await page.waitForSelector('[data-testid="shell-preview"]');
    const previewFocused = await page.evaluate(() => {
      const preview = document.querySelector('[data-testid="shell-preview"]');
      return preview?.contains(document.activeElement) ?? false;
    });
    expect(previewFocused).toBe(false);
    await expect(page.locator('[data-testid="shell-preview"]')).toHaveAttribute('inert', '');
  });

  test('Tab recorre acceso sin atrapar foco', async ({ page }) => {
    await mockAuthedApi(page);
    await page.goto('/acceso');
    await page.waitForLoadState('networkidle');
    await page.locator('body').click({ position: { x: 8, y: 8 } });
    const stops = await collectTabStops(page);
    expect(stops.length).toBeGreaterThan(1);

    const skip = page.locator('.skip-to-content');
    await skip.focus();
    await skip.press('Enter');
    await expect(page.locator('#main-content')).toBeFocused();
  });

  test('línea de cuenta accesible por teclado', async ({ page }) => {
    await page.route('**/api/**', async (route) => {
      const path = new URL(route.request().url()).pathname.replace(/^\/api/, '');
      if (path.includes('/campaign/founder-count')) {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ claimed: 0, max: 100 }),
        });
        return;
      }
      await route.abort();
    });
    await page.goto('/acceso');
    await expect(page.getByTestId('page-acceso')).toBeVisible();

    const signIn = page.getByRole('button', { name: 'Iniciar sesión' });
    await signIn.focus();
    await expect(signIn).toBeFocused();
    await page.keyboard.press('Enter');
    await expect(page.getByRole('heading', { name: 'Qué bueno verte de nuevo' })).toBeVisible();

    await page.goto('/acceso');
    const codeBtn = page.getByRole('button', { name: 'Tengo un código' });
    await codeBtn.focus();
    await expect(codeBtn).toBeFocused();
    await page.keyboard.press('Enter');
    await expect(page.locator('#access-invite-code')).toBeFocused();
  });

  test('Enter envía y Shift+Enter no envía en el chat', async ({ page }) => {
    await mockAuthedApi(page);
    await page.goto('/chat');
    await page.waitForSelector('[data-testid="chat-composer"]');
    const textarea = page.locator('.chat-composer__input');
    await textarea.focus();
    await page.keyboard.type('Hola');
    await page.keyboard.press('Shift+Enter');
    await expect(textarea).toHaveValue('Hola\n');
    await page.keyboard.press('Enter');
    await expect(textarea).toHaveValue('');
  });

  test('flujo principal solo con teclado hasta editar nombre', async ({ page }) => {
    await mockAuthedApi(page);
    await page.goto('/crear/quien');
    await page.waitForSelector('.opt');
    await page.locator('[role="radio"]').first().focus();
    await page.keyboard.press(' ');
    await page.locator('[aria-labelledby="create-who-style"] [role="radio"]').first().focus();
    await page.keyboard.press(' ');
    const interests = page.locator('[aria-labelledby="create-who-interests"] button');
    await interests.nth(0).focus();
    await page.keyboard.press(' ');
    await interests.nth(1).focus();
    await page.keyboard.press(' ');
    await interests.nth(2).focus();
    await page.keyboard.press(' ');
    await page.getByRole('button', { name: 'Continuar' }).focus();
    await page.keyboard.press('Enter');
    await page.waitForURL('**/crear/como');

    await page.goto('/chat');
    await page.waitForSelector('[data-testid="chat-composer"]');
    await page.locator('.chat-composer__input').focus();
    await page.keyboard.type('Mensaje teclado');
    await page.keyboard.press('Enter');
    await expect(page.locator('.chat-composer__input')).toHaveValue('');

    await page.goto('/chat/editar');
    await page.waitForSelector('[data-testid="edit-companion-page"]');
    await page.getByTestId('edit-row-personality').click();
    await page.getByTestId('edit-section-dialog').waitFor();
    const nameInput = page.locator('[aria-labelledby="edit-name"]').last();
    await nameInput.focus();
    await page.keyboard.press('End');
    await page.keyboard.type('a');
    await expect(nameInput).toHaveValue(/a$/);
  });

  test('controles propios cumplen 44px', async ({ page }) => {
    await mockAuthedApi(page);
    await page.goto('/chat');
    await page.waitForSelector('.chat-composer__send');
    const send = page.locator('.chat-composer__send');
    const box = await send.boundingBox();
    expect(box?.height).toBeGreaterThanOrEqual(44);
    expect(box?.width).toBeGreaterThanOrEqual(44);
  });
});
