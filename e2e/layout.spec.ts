import { expect, test } from '@playwright/test';

test.describe('Desktop shell 1440×900', () => {
  test.use({ viewport: { width: 1440, height: 900 } });

  test('/crear/quien cabe sin scroll vertical', async ({ page }) => {
    await page.goto('/crear/quien');
    const scrollHeight = await page.evaluate(() => document.documentElement.scrollHeight);
    expect(scrollHeight).toBeLessThanOrEqual(900);
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
    await page.goto('/chat');
    const menu = page.getByTestId('chat-menu');
    const read = page.getByTestId('chat-read');
    const profile = page.getByTestId('chat-profile');

    const menuBox = await menu.boundingBox();
    const readBox = await read.boundingBox();
    const profileBox = await profile.boundingBox();

    expect(menuBox?.width).toBe(264);
    expect(readBox?.width).toBeGreaterThanOrEqual(680);
    expect(readBox?.width).toBeLessThanOrEqual(720);
    expect(profileBox?.width).toBe(320);
  });
});
