import { expect, test, type Page } from '@playwright/test';

async function mockAuthedApi(page: Page) {
  await page.addInitScript(() => {
    sessionStorage.setItem('ejoi-mock-demo-logged-in', '1');
  });
  const profile = {
    id: 'c1',
    name: 'Luna',
    visualStyle: 'realista',
    gender: 'femenino',
    persona: 'Cálida',
    intensity: 'balanced',
    interests: ['Música', 'Cine y series', 'Arte y cultura'],
    boundaries: ['Política'],
    voiceKey: 'NORAH',
    hairColor: 'Castaño oscuro',
    age: 25,
    avatarUrl: 'https://example.com/old.jpg',
  };

  await page.route('**/api/**', async (route) => {
    const path = new URL(route.request().url()).pathname.replace(/^\/api/, '');
    const method = route.request().method();

    if (path.includes('/auth/refresh')) {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ accessToken: 'e2e-edit-sections' }),
      });
      return;
    }

    if (path.includes('/companion/me') && method === 'PATCH') {
      const patch = route.request().postDataJSON() as Record<string, unknown>;
      if (typeof patch.name === 'string') profile.name = patch.name;
      if (typeof patch.persona === 'string') profile.persona = patch.persona;
      if (typeof patch.hairColor === 'string') profile.hairColor = patch.hairColor;
      if (typeof patch.voiceKey === 'string') profile.voiceKey = patch.voiceKey;
      if (Array.isArray(patch.interests)) profile.interests = patch.interests as string[];
      if (Array.isArray(patch.boundaries)) profile.boundaries = patch.boundaries as string[];
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(profile),
      });
      return;
    }

    if (path.includes('/companion/me/profile') || (path.includes('/companion/me') && method === 'GET')) {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(profile),
      });
      return;
    }

    await route.fulfill({ status: 200, contentType: 'application/json', body: '{}' });
  });
}

test.describe('Editar eJoi — resumen por secciones', () => {
  test('diálogo devuelve el foco a la fila al cerrar con Esc', async ({ page }) => {
    await mockAuthedApi(page);
    await page.goto('/chat/editar');
    await page.getByTestId('edit-companion-page').waitFor();

    const row = page.getByTestId('edit-row-personality');
    await row.focus();
    await page.keyboard.press('Enter');
    await expect(page.getByTestId('edit-section-dialog')).toBeVisible();

    await page.keyboard.press('Escape');
    await expect(page.getByTestId('edit-section-dialog')).toBeHidden();
    await expect(row).toBeFocused();
  });

  test('guardar personalidad actualiza el valor en la fila', async ({ page }) => {
    await mockAuthedApi(page);
    await page.goto('/chat/editar');
    await page.getByTestId('edit-row-personality').click();
    await page.getByRole('radio', { name: 'Inteligente y curiosa' }).click();
    await page.getByTestId('edit-save-section').click();
    await expect(page.getByTestId('edit-row-personality')).toContainText('Inteligente y curiosa');
  });

  test('color de cabello visible en fila resumen', async ({ page }) => {
    await mockAuthedApi(page);
    await page.goto('/chat/editar');
    await expect(page.getByTestId('edit-row-hair')).toContainText('Castaño oscuro');
  });
});
