#!/usr/bin/env node
/** Cronómetro demo: Inicio → primer mensaje visible (SCRUM-116 / FLOW-WEB-06). Requiere build:demo. */
import { spawn } from 'node:child_process';
import { createServer } from 'node:net';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { chromium } from '@playwright/test';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const distDir = path.join(root, 'dist-demo');

function freePort() {
  return new Promise((resolve, reject) => {
    const srv = createServer();
    srv.listen(0, '127.0.0.1', () => {
      const { port } = srv.address();
      srv.close(() => resolve(port));
    });
    srv.on('error', reject);
  });
}

function runPreview(port) {
  return spawn('npx', ['vite', 'preview', '--host', '127.0.0.1', '--port', String(port), '--outDir', distDir], {
    cwd: root,
    stdio: 'ignore',
    shell: true,
  });
}

async function waitForServer(baseUrl, attempts = 40) {
  for (let i = 0; i < attempts; i += 1) {
    try {
      const res = await fetch(baseUrl);
      if (res.ok) return;
    } catch {
      /* retry */
    }
    await new Promise((r) => setTimeout(r, 250));
  }
  throw new Error(`Preview no respondió en ${baseUrl}`);
}

async function fillWizardThroughStep3(page) {
  await page.goto('/crear/paso-1');
  await page.getByRole('radio', { name: 'Femenino' }).click();
  await page.getByRole('radio', { name: 'Amigable y empática' }).click();
  await page.getByRole('radio', { name: 'Realista' }).click();
  await page.getByRole('button', { name: 'Continuar' }).click();
  await page.waitForURL(/\/crear\/paso-2/, { timeout: 15_000 });
  await page.getByRole('button', { name: 'Continuar' }).click();
  await page.waitForURL(/\/crear\/paso-3/, { timeout: 15_000 });
  for (const label of ['Música', 'Cine y series', 'Viajes']) {
    await page.getByRole('button', { name: label }).click();
  }
  await page.getByRole('button', { name: 'Continuar' }).click();
  await page.waitForURL(/\/crear\/paso-4/, { timeout: 15_000 });
}

async function main() {
  const port = await freePort();
  const baseUrl = `http://127.0.0.1:${port}`;
  const preview = runPreview(port);
  const started = Date.now();

  try {
    await waitForServer(baseUrl);
    const browser = await chromium.launch();
    const page = await browser.newPage({ baseURL: baseUrl, viewport: { width: 1440, height: 900 } });

    await page.goto('/');
    await page.getByRole('link', { name: 'Crear mi eJoi' }).first().click();
    await page.getByTestId('page-bienvenida').waitFor({ state: 'visible', timeout: 15_000 });
    await page.getByRole('button', { name: 'Entrar en modo demo' }).click();
    await page.waitForURL(/\/(crear|chat)/, { timeout: 20_000 });
    await fillWizardThroughStep3(page);
    await page.getByRole('textbox', { name: 'Nombre' }).fill('Luna');
    await page.locator('.check__input').nth(0).check();
    await page.locator('.check__input').nth(1).check();
    await page.getByRole('button', { name: /Crear a Luna/ }).click();
    await page.waitForURL(/\/chat/, { timeout: 20_000 });
    await page.getByTestId('chat-messages').waitFor({ state: 'visible', timeout: 30_000 });
    await page.getByTestId('chat-read').waitFor({ timeout: 30_000 });

    const elapsedMs = Date.now() - started;
    await browser.close();
    console.log(
      JSON.stringify({
        elapsedMs,
        path: 'inicio-crear-mi-ejoi-primer-mensaje',
        viewport: '1440x900',
      }),
    );
  } finally {
    preview.kill('SIGTERM');
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
