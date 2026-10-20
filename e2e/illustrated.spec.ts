import { expect, test, type Page } from '@playwright/test';

async function mockDraftApi(page: Page, draftData: Record<string, unknown>) {
  let draft = { schemaVersion: 1, step: 2, webView: 'quien' as const, data: draftData };

  await page.route('**/api/**', async (route) => {
    const path = new URL(route.request().url()).pathname.replace(/^\/api/, '');

    if (path.includes('/auth/refresh')) {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ accessToken: 'e2e-illustrated' }),
      });
      return;
    }

    if (path.includes('/users/me/onboarding-draft') && route.request().method() === 'GET') {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ draft: { data: draft.data } }),
      });
      return;
    }

    if (path.includes('/users/me/onboarding-draft') && route.request().method() === 'PUT') {
      const body = route.request().postDataJSON() as typeof draft;
      draft = { ...draft, ...body, data: { ...draft.data, ...(body.data ?? {}) } };
      await route.fulfill({ status: 200, contentType: 'application/json', body: '{}' });
      return;
    }

    await route.fulfill({ status: 200, contentType: 'application/json', body: '{}' });
  });
}

test.describe('Estilo ilustrado end-to-end (SCRUM-115)', () => {
  test.use({ viewport: { width: 1440, height: 900 } });

  test('onboarding: selector ilustrado y preview coherente', async ({ page }) => {
    await mockDraftApi(page, { gender: '', visualStyle: '', interests: [] });
    await page.goto('/crear/quien');

    await page.getByRole('radio', { name: /Ilustrado/i }).click();
    await page.getByRole('radio', { name: 'Femenino' }).click();

    const portrait = page.getByTestId('creation-portrait');
    await expect(portrait).toHaveAttribute('src', /ilustrado-femenino\.webp/);

    const illustratedThumb = page.getByRole('radio', { name: /Ilustrado/i }).locator('img');
    await expect(illustratedThumb).toHaveAttribute('src', /ilustrado-femenino\.webp/);
  });

  test('chat: panel con retrato de muestra ilustrado durante creación', async ({ page }) => {
    const handleChatApi = async (route: import('@playwright/test').Route) => {
      const path = new URL(route.request().url()).pathname.replace(/^\/api/, '');

      if (path.includes('/auth/refresh')) {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ accessToken: 'e2e-illustrated' }),
        });
        return;
      }

      if (path.includes('/users/me/onboarding-draft')) {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            draft: {
              schemaVersion: 1,
              step: 3,
              updatedAt: '2026-01-01T00:00:00.000Z',
              data: {
                gender: 'femenino',
                visualStyle: 'anime',
                persona: 'Cálida',
                interests: ['Música'],
                boundaries: [],
                companionName: 'Luna',
              },
            },
          }),
        });
        return;
      }

      if (path.includes('/companion/me/creation')) {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            state: 'creating',
            steps: { personality: true, interests: true, greeting: false, portrait: false },
            profile: { id: 'c1', name: 'Luna', visualStyle: 'anime' },
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
            visualStyle: 'anime',
            gender: 'femenino',
            persona: 'Cálida',
            intensity: 'balanced',
            interests: ['Música'],
            boundaries: [],
          }),
        });
        return;
      }

      if (path.includes('/companion/me') && route.request().method() === 'PATCH') {
        await route.fulfill({ status: 200, contentType: 'application/json', body: '{}' });
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
          body: JSON.stringify({ remainingMessages: 12 }),
        });
        return;
      }

      await route.fulfill({ status: 200, contentType: 'application/json', body: '{}' });
    };

    await page.route('**/api/**', handleChatApi);

    await page.goto('/chat');
    await page.getByTestId('chat-creating-panel').waitFor();

    const sample = page.locator('.chat-profile-card__portrait');
    await expect(sample).toHaveAttribute('src', /ilustrado-femenino\.webp/);
    await expect(page.getByTestId('chat-creating-panel').getByText('Ilustrado')).toBeVisible();
  });

  test('editar: opción ilustrado con miniatura de asset', async ({ page }) => {
    await page.addInitScript(() => {
      sessionStorage.setItem('ejoi-mock-demo-logged-in', '1');
    });
    await page.route('**/api/**', async (route) => {
      const path = new URL(route.request().url()).pathname.replace(/^\/api/, '');

      if (path.includes('/auth/refresh')) {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ accessToken: 'e2e-illustrated' }),
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
            gender: 'femenino',
            persona: 'Cálida',
            intensity: 'balanced',
            interests: ['Música'],
            boundaries: [],
            voiceKey: 'NORAH',
            avatarUrl: 'https://example.com/old.jpg',
          }),
        });
        return;
      }

      await route.fulfill({ status: 200, contentType: 'application/json', body: '{}' });
    });

    await page.goto('/chat/editar');
    await page.getByTestId('edit-companion-page').waitFor();
    await page.getByTestId('edit-row-style').click();
    await page.getByTestId('edit-section-dialog').waitFor();
    const illustrated = page.getByRole('radio', { name: /Ilustrado/i });
    await expect(illustrated).toBeVisible();
    await expect(illustrated.locator('img')).toHaveAttribute('src', /ilustrado-femenino\.webp/);
  });
});
