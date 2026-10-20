#!/usr/bin/env node
/* eslint-disable no-undef -- evaluate() corre en el navegador */
/**
 * Capturas de referencia (modo demo). Requiere `npm run build:demo` previo.
 * Uso: node scripts/shots.mjs [acceso|vista-2|vista-3|chat-creando|chat-listo|chat-error|editar]
 */
import { spawn } from 'node:child_process';
import { mkdirSync } from 'node:fs';
import { createServer } from 'node:net';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { chromium } from '@playwright/test';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const distDir = path.join(root, 'dist-demo');
const outDir = path.join(root, 'docs', 'screens');

const ALL = [
  'acceso',
  'vista-2',
  'vista-3',
  'chat-creando',
  'chat-listo',
  'chat-error',
  'editar',
];

const WIDTHS = [1440, 1280, 1024];
const VIEW_H = 900;

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

async function setTheme(page, theme) {
  await page.evaluate((t) => {
    localStorage.setItem('ejoi.theme', t);
    document.documentElement.dataset.theme = t;
  }, theme);
}

async function demoLogin(page) {
  await page.goto('/acceso');
  const btn = page.getByRole('button', { name: 'Entrar en modo demo' });
  if (await btn.isVisible().catch(() => false)) {
    await btn.click();
    await page.waitForURL(/\/(crear|chat)/, { timeout: 20_000 });
  }
}

async function prepareScreen(page, id) {
  switch (id) {
    case 'acceso':
      await page.goto('/acceso');
      break;
    case 'vista-2':
      await demoLogin(page);
      await page.goto('/crear/quien');
      await page.getByTestId('shell-header').waitFor({ timeout: 15_000 });
      break;
    case 'vista-3':
      await demoLogin(page);
      await page.goto('/crear/como');
      await page.getByTestId('shell-header').waitFor({ timeout: 15_000 });
      break;
    case 'chat-creando':
      await demoLogin(page);
      await page.goto('/chat');
      await page
        .getByTestId('chat-creating-panel')
        .waitFor({ timeout: 8000 })
        .catch(() => undefined);
      break;
    case 'chat-listo':
      await demoLogin(page);
      await page.goto('/chat');
      await page
        .getByTestId('chat-messages')
        .or(page.getByTestId('chat-creating-panel'))
        .waitFor({ timeout: 20_000 });
      break;
    case 'chat-error':
      await demoLogin(page);
      await page.goto('/chat');
      await page.getByTestId('chat-read').waitFor({ timeout: 15_000 });
      break;
    case 'editar':
      await demoLogin(page);
      await page.goto('/chat/editar');
      await page.getByTestId('edit-companion-page').waitFor({ timeout: 15_000 });
      break;
    default:
      throw new Error(`Pantalla desconocida: ${id}`);
  }
  await page.waitForTimeout(300);
}

async function main() {
  const picked = process.argv.slice(2).filter(Boolean);
  const screens = picked.length ? picked : ALL;
  for (const id of screens) {
    if (!ALL.includes(id)) {
      console.error(`Pantalla no válida: ${id}. Opciones: ${ALL.join(', ')}`);
      process.exit(1);
    }
  }

  mkdirSync(outDir, { recursive: true });

  const port = await freePort();
  const baseUrl = `http://127.0.0.1:${port}`;
  const preview = runPreview(port);
  try {
    await waitForServer(baseUrl);

    const browser = await chromium.launch();
    for (const screen of screens) {
      for (const theme of ['claro', 'oscuro']) {
        for (const width of WIDTHS) {
          const context = await browser.newContext({
            viewport: { width, height: VIEW_H },
            baseURL: baseUrl,
          });
          const page = await context.newPage();
          await setTheme(page, theme === 'oscuro' ? 'dark' : 'light');
          await prepareScreen(page, screen);
          const file = path.join(outDir, `${screen}-${theme}-${width}.png`);
          await page.screenshot({ path: file, fullPage: false });
          await context.close();
          console.log(`OK ${file}`);
        }
      }
    }
    await browser.close();
  } finally {
    preview.kill('SIGTERM');
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
