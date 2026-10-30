import { expect, test, type Page } from '@playwright/test';

const firstMessageContent =
  '¡Hola! Soy Luna. Vi que te interesan música y viajes, así que tengo curiosidad: ¿qué es lo que más te gusta de música?';

async function mockChatReady(page: Page, options?: { creationSequence?: boolean }) {
  let creationPolls = 0;
  await page.addInitScript(() => {
    sessionStorage.setItem('ejoi-mock-demo-logged-in', '1');
  });

  await page.route('**/api/**', async (route) => {
    const path = new URL(route.request().url()).pathname.replace(/^\/api/, '');

    if (path.includes('/auth/refresh') || path.includes('/auth/session')) {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ accessToken: 'e2e-chat-parity' }),
      });
      return;
    }

    if (path.includes('/companion/me/creation')) {
      if (options?.creationSequence && creationPolls === 0) {
        creationPolls += 1;
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            state: 'creating',
            steps: { personality: true, interests: true, greeting: true, portrait: true },
            profile: { name: 'Luna', visualStyle: 'realista' },
          }),
        });
        return;
      }
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          state: 'ready',
          profile: { id: 'c1', name: 'Luna', visualStyle: 'realista' },
          firstMessage: {
            id: 'fm1',
            content: firstMessageContent,
            meta: {
              kind: 'first_message',
              basedOnInterests: ['Música', 'Viajes'],
              quickReplies: ['Te recomiendo una canción', 'Te cuento de un viaje'],
            },
          },
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
          persona: 'Cálida',
          intensity: 'balanced',
          interests: ['Música', 'Viajes', 'Literatura'],
          boundaries: ['Política'],
          visualStyle: 'realista',
          gender: 'femenino',
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
        body: JSON.stringify({
          draft: {
            data: {
              webView: 'chat',
              companionName: 'Luna',
              persona: 'Cálida',
              intensity: 'balanced',
              interests: ['Música', 'Viajes', 'Literatura'],
            },
          },
        }),
      });
      return;
    }

    await route.fulfill({ status: 200, contentType: 'application/json', body: '{}' });
  });
}

test.describe('Chat paridad móvil v2 (SCRUM-168)', () => {
  test('momento de éxito 2 s tras crear', async ({ page }) => {
    await mockChatReady(page, { creationSequence: true });
    await page.goto('/chat');
    await expect(page.getByTestId('chat-ready-moment')).toBeVisible({ timeout: 15_000 });
    await expect(page.locator('.bubble--ai')).toHaveCount(0);
    await expect(page.getByTestId('chat-ready-moment')).toBeHidden({ timeout: 3500 });
    await expect(page.locator('.bubble--ai').first()).toBeVisible();
  });

  test('prefers-reduced-motion desactiva animación del momento de éxito', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await mockChatReady(page, { creationSequence: true });
    await page.goto('/chat');
    await page.getByTestId('chat-ready-moment').waitFor({ timeout: 15_000 });
    const animation = await page.locator('.chat-page__ready-check').evaluate(
      (el) => getComputedStyle(el).animationName,
    );
    expect(animation).toBe('none');
  });

  test('primer mensaje resalta intereses con --c-brand-text', async ({ page }) => {
    await mockChatReady(page);
    await page.goto('/chat');
    await page.getByTestId('chat-messages').waitFor();
    const highlight = page.locator('.bubble__hl').first();
    await expect(highlight).toContainText('música');
    const color = await highlight.evaluate((el) => {
      const probe = document.createElement('span');
      probe.style.color = 'var(--c-brand-text)';
      document.body.appendChild(probe);
      const expected = getComputedStyle(probe).color;
      probe.remove();
      return { actual: getComputedStyle(el).color, expected };
    });
    expect(color.actual).toBe(color.expected);
  });

  test('compositor: placeholder y botón enviar deshabilitado gris', async ({ page }) => {
    await mockChatReady(page);
    await page.goto('/chat');
    await page.getByTestId('chat-composer').waitFor();
    await expect(page.locator('.chat-composer__input')).toHaveAttribute('placeholder', 'Escribe un mensaje…');
    const send = page.locator('.chat-composer__send');
    await expect(send).toHaveClass(/chat-composer__send--empty/);
    const bg = await send.evaluate((el) => getComputedStyle(el).backgroundColor);
    const disBg = await page.evaluate(() => {
      const probe = document.createElement('span');
      probe.style.backgroundColor = 'var(--c-dis-bg)';
      document.body.appendChild(probe);
      const v = getComputedStyle(probe).backgroundColor;
      probe.remove();
      return v;
    });
    expect(bg).toBe(disBg);
  });

  test('error de creación: Intentar de nuevo y Revisar mis elecciones', async ({ page }) => {
    await page.addInitScript(() => {
      sessionStorage.setItem('ejoi-mock-demo-logged-in', '1');
    });
    await page.route('**/api/**', async (route) => {
      const path = new URL(route.request().url()).pathname.replace(/^\/api/, '');
      if (path.includes('/auth/refresh')) {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ accessToken: 'e2e-chat-parity' }),
        });
        return;
      }
      if (path.includes('/companion/me/creation')) {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ state: 'error', profile: { name: 'Luna' } }),
        });
        return;
      }
      if (path.includes('/users/me/onboarding-draft')) {
        await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ draft: null }) });
        return;
      }
      await route.fulfill({ status: 200, contentType: 'application/json', body: '{}' });
    });
    await page.goto('/chat');
    const banner = page.getByTestId('chat-error-banner');
    await banner.waitFor();
    await expect(banner.getByRole('button', { name: 'Intentar de nuevo' })).toBeVisible();
    await expect(banner.getByRole('button', { name: 'Revisar mis elecciones' })).toBeVisible();
  });
});
