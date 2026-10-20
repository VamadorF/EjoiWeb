import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page } from '@playwright/test';

import { QA_VIEWPORTS } from './fixtures/viewports';

async function mockAuthedApi(page: Page) {
  await page.route('**/api/**', async (route) => {
    const path = new URL(route.request().url()).pathname.replace(/^\/api/, '');
    if (path.includes('/auth/refresh')) {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ accessToken: 'e2e-a11y' }),
      });
      return;
    }
    if (path.includes('/companion/me/creation')) {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          state: 'ready',
          profile: { name: 'Luna', visualStyle: 'realista' },
          firstMessage: { id: 'm1', content: 'Hola' },
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
          persona: 'Amigable y empática',
          intensity: 'balanced',
          interests: ['Arte y cultura', 'Música', 'Viajes'],
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
    if (path.includes('/users/me/onboarding-draft')) {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ data: { webView: 'como' } }),
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
        body: JSON.stringify({ claimed: 0, max: 100 }),
      });
      return;
    }
    await route.fulfill({ status: 200, contentType: 'application/json', body: '{}' });
  });
}

const screens = [
  { name: 'acceso', path: '/acceso' },
  { name: 'quien', path: '/crear/quien' },
  { name: 'como', path: '/crear/como' },
  { name: 'chat-ready', path: '/chat' },
  { name: 'editar', path: '/chat/editar' },
];

test.describe('Accesibilidad axe (SCRUM-113 / 116)', () => {
  for (const vp of QA_VIEWPORTS) {
    for (const screen of screens) {
      test(`${screen.name} @ ${vp.label} sin violaciones serious/critical`, async ({ page }) => {
        await page.setViewportSize({ width: vp.width, height: vp.height });
        await mockAuthedApi(page);
        await page.goto(screen.path);
        await page.waitForLoadState('networkidle');
        const results = await new AxeBuilder({ page })
          .withTags(['wcag2a', 'wcag2aa'])
          .analyze();
        const blocking = results.violations.filter(
          (v) => v.impact === 'serious' || v.impact === 'critical',
        );
        expect(blocking, JSON.stringify(blocking, null, 2)).toEqual([]);
      });
    }
  }
});
