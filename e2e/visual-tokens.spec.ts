import { expect, test, type Locator, type Page } from '@playwright/test';

type CssProp = 'backgroundColor' | 'color' | 'borderTopColor';

async function expectUsesToken(
  page: Page,
  target: Locator,
  property: CssProp,
  cssVar: string,
) {
  await expect(target).toBeVisible();
  const result = await target.evaluate(
    (el, { prop, name }) => {
      const cssProp =
        prop === 'backgroundColor'
          ? 'background-color'
          : prop === 'borderTopColor'
            ? 'border-top-color'
            : 'color';
      const probe = document.createElement('span');
      probe.style.setProperty(cssProp, `var(${name})`);
      document.body.appendChild(probe);
      const expected = getComputedStyle(probe)[prop as 'backgroundColor'];
      probe.remove();
      const actual = getComputedStyle(el)[prop as 'backgroundColor'];
      const rgbTuple = (color: string): [number, number, number] | null => {
        const srgb = color.match(/color\(srgb\s+([\d.]+)\s+([\d.]+)\s+([\d.]+)\)/);
        if (srgb) {
          return [
            Math.round(parseFloat(srgb[1]) * 255),
            Math.round(parseFloat(srgb[2]) * 255),
            Math.round(parseFloat(srgb[3]) * 255),
          ];
        }
        const rgb = color.match(/rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/);
        if (rgb) return [Number(rgb[1]), Number(rgb[2]), Number(rgb[3])];
        return null;
      };
      const normalizePaint = (paint: string) => {
        const tmp = document.createElement('div');
        tmp.style.setProperty(cssProp, paint);
        document.body.appendChild(tmp);
        const computed = getComputedStyle(tmp)[prop as 'backgroundColor'];
        tmp.remove();
        return rgbTuple(computed);
      };
      const a = normalizePaint(actual);
      const b = normalizePaint(expected);
      const equal =
        a && b ? a[0] === b[0] && a[1] === b[1] && a[2] === b[2] : actual === expected;
      return { actual, expected, equal };
    },
    { prop: property, name: cssVar },
  );
  expect(result.equal, `${cssVar} ${property}: ${result.actual} vs ${result.expected}`).toBe(true);
}

async function setTheme(page: Page, theme: 'light' | 'dark') {
  await page.evaluate((t) => {
    localStorage.setItem('ejoi.theme', t);
    document.documentElement.dataset.theme = t;
  }, theme);
}

async function mockAuthedApi(page: Page, creation: Record<string, unknown>) {
  await page.route('**/api/**', async (route) => {
    const path = new URL(route.request().url()).pathname.replace(/^\/api/, '');

    if (path.includes('/auth/refresh')) {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ accessToken: 'e2e-visual' }),
      });
      return;
    }
    if (path.includes('/companion/me/creation')) {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(creation) });
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
          persona: 'Cálida',
          intensity: 'balanced',
          interests: ['Música'],
          boundaries: [],
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
        body: JSON.stringify({
          messages: [
            { id: 'm1', role: 'assistant', message: 'Hola desde e2e' },
            { id: 'm2', role: 'user', message: 'Hola Luna' },
          ],
          hasMore: false,
        }),
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
}

for (const theme of ['light', 'dark'] as const) {
  test.describe(`Tokens computados (${theme})`, () => {
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
            body: JSON.stringify({ accessToken: 'e2e-visual' }),
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

    test('selección .opt', async ({ page }) => {
      await page.goto('/crear/paso-1');
      await setTheme(page, theme);
      const femenino = page.getByRole('radio', { name: 'Femenino' });
      await femenino.click();
      await expect(femenino).toHaveAttribute('aria-checked', 'true');
      await expect(femenino).toHaveCSS('border-top-width', '2px');
      const bg = await femenino.evaluate((el) => getComputedStyle(el).backgroundColor);
      expect(bg).not.toMatch(/^rgba\(0, 0, 0, 0\)$/);
    });

    test('botón primario', async ({ page }) => {
      await mockAuthedApi(page, {
        state: 'error',
        profile: { name: 'Luna', visualStyle: 'realista' },
      });
      await page.goto('/chat');
      await setTheme(page, theme);
      const primary = page.getByTestId('chat-error-banner').getByRole('button', { name: 'Intentar de nuevo' });
      await expectUsesToken(page, primary, 'backgroundColor', '--c-brand');
      await expectUsesToken(page, primary, 'color', '--c-on-brand');
    });

    test('burbujas de chat', async ({ page }) => {
      await mockAuthedApi(page, {
        state: 'ready',
        profile: { id: 'c1', name: 'Luna', visualStyle: 'realista' },
        firstMessage: { id: 'm1', content: 'Hola desde e2e' },
      });
      await page.goto('/chat');
      await setTheme(page, theme);
      await page.getByTestId('chat-messages').waitFor();
      const ai = page.locator('.bubble--ai').first();
      const user = page.locator('.bubble--user').first();
      await expectUsesToken(page, ai, 'backgroundColor', '--c-surface');
      await expectUsesToken(page, user, 'backgroundColor', '--c-brand');
      await expectUsesToken(page, user, 'color', '--c-on-brand');
    });

    test('chip seleccionado', async ({ page }) => {
      await page.goto('/crear/paso-1');
      await setTheme(page, theme);
      await page.getByRole('radio', { name: 'Femenino' }).click();
      await page.getByRole('radio', { name: 'Amigable y empática' }).click();
      await page.getByRole('radio', { name: 'Realista' }).click();
      await page.getByRole('button', { name: 'Continuar' }).click();
      await page.waitForURL('**/crear/paso-2');
      await page.getByRole('button', { name: 'Continuar' }).click();
      await page.waitForURL('**/crear/paso-3');
      const chip = page.getByRole('button', { name: 'Música' });
      await chip.click();
      await expect(chip).toHaveAttribute('aria-pressed', 'true');
      await expect(chip).toHaveCSS('border-top-width', '2px');
      const bg = await chip.evaluate((el) => getComputedStyle(el).backgroundColor);
      expect(bg).not.toMatch(/^rgba\(0, 0, 0, 0\)$/);
    });

    test('segmento activo .seg', async ({ page }) => {
      await page.goto('/crear/paso-1');
      await setTheme(page, theme);
      await page.getByRole('radio', { name: 'Femenino' }).click();
      await page.getByRole('radio', { name: 'Amigable y empática' }).click();
      await page.getByRole('radio', { name: 'Realista' }).click();
      await page.getByRole('button', { name: 'Continuar' }).click();
      await page.waitForURL('**/crear/paso-2');
      const active = page.getByRole('radio', { name: 'Activa' });
      await active.click();
      await expect(active).toHaveAttribute('aria-checked', 'true');
      await expect(active).toHaveCSS('font-weight', '700');
      const bg = await active.evaluate((el) => getComputedStyle(el).backgroundColor);
      expect(bg).not.toMatch(/^rgba\(0, 0, 0, 0\)$/);
    });

    test('banner de error', async ({ page }) => {
      await mockAuthedApi(page, {
        state: 'error',
        profile: { name: 'Luna', visualStyle: 'realista' },
      });
      await page.goto('/chat');
      await setTheme(page, theme);
      const banner = page.getByTestId('chat-error-banner');
      await banner.waitFor();
      await expectUsesToken(page, banner, 'backgroundColor', '--c-err-banner-bg');
      await expectUsesToken(page, banner, 'color', '--c-err-banner-ink');
    });
  });
}
