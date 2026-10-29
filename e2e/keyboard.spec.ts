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

  test('el wizard no monta el panel lateral de preview', async ({ page }) => {
    await mockAuthedApi(page);
    await page.goto('/crear/paso-1');
    await expect(page.getByTestId('shell-header')).toBeVisible();
    await expect(page.getByTestId('shell-preview')).toHaveCount(0);
  });

  test('Tab recorre bienvenida sin atrapar foco', async ({ page }) => {
    await page.route('**/api/**', async (route) => {
      const path = new URL(route.request().url()).pathname.replace(/^\/api/, '');
      if (path.includes('/auth/refresh')) {
        await route.fulfill({ status: 401, contentType: 'application/json', body: '{}' });
        return;
      }
      await route.fulfill({ status: 200, contentType: 'application/json', body: '{}' });
    });
    await page.goto('/');
    await expect(page.getByTestId('page-bienvenida')).toBeVisible();
    await page.locator('body').click({ position: { x: 8, y: 8 } });
    const stops = await collectTabStops(page);
    expect(stops.length).toBeGreaterThan(1);
  });

  test('bienvenida: código por teclado', async ({ page }) => {
    await page.route('**/api/**', async (route) => {
      const path = new URL(route.request().url()).pathname.replace(/^\/api/, '');
      if (path.includes('/auth/refresh')) {
        await route.fulfill({ status: 401, contentType: 'application/json', body: '{}' });
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
    await page.goto('/');
    await expect(page.getByTestId('page-bienvenida')).toBeVisible();
    const codeBtn = page.getByRole('button', { name: 'Tengo un código' });
    await codeBtn.focus();
    await expect(codeBtn).toBeFocused();
    await expect(codeBtn).toBeDisabled();
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
    await page.goto('/crear/paso-1');
    await page.waitForSelector('.opt');
    const { pickWizardThroughStep3WithKeyboard } = await import('./fixtures/keyboardFlow');
    await pickWizardThroughStep3WithKeyboard(page);

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

  test('perfil completo se abre con teclado', async ({ page }) => {
    await page.route('**/api/**', async (route) => {
      const path = new URL(route.request().url()).pathname.replace(/^\/api/, '');
      if (path.includes('/auth/refresh')) {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ accessToken: 'e2e-keyboard-profile' }),
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
            firstMessage: { id: 'm1', content: 'Hola' },
          }),
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
            interests: ['Música'],
            boundaries: ['Política'],
            gender: 'femenino',
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
      await route.fulfill({ status: 200, contentType: 'application/json', body: '{}' });
    });

    await page.goto('/chat');
    await page.getByTestId('chat-profile-card').waitFor();
    await expect(page.getByText('Política')).toBeHidden();

    const summary = page.getByTestId('chat-profile-more').locator('summary');
    await summary.focus();
    await page.keyboard.press('Enter');
    await expect(page.getByText('Política')).toBeVisible();
    await expect(page.getByText(/Realista/)).toBeVisible();
  });
});
