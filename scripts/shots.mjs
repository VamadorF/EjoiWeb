#!/usr/bin/env node
/* eslint-disable no-undef -- evaluate() corre en el navegador */
/**
 * Capturas de referencia (modo demo). Requiere `npm run build:demo` previo.
 * Uso: node scripts/shots.mjs [inicio|acceso|vista-2|vista-3|chat-creando|chat-listo|chat-error|editar]
 */
import { createHash } from 'node:crypto';
import { spawn } from 'node:child_process';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { createServer } from 'node:net';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { chromium } from '@playwright/test';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const distDir = path.join(root, 'dist-demo');
const outDir = path.join(root, 'docs', 'screens');

const ALL = [
  'inicio',
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
const ASSERT_MS = 10_000;

/** @type {Record<string, { url: RegExp; testIds: string[] }>} */
const SCREEN_ASSERT = {
  inicio: { url: /\/\/[^/]+\/?(\?.*)?$/, testIds: ['page-inicio'] },
  acceso: { url: /\/acceso\/?(\?.*)?$/, testIds: ['page-acceso'] },
  'vista-2': { url: /\/crear\/paso-1\/?(\?.*)?$/, testIds: ['create-wizard'] },
  'vista-3': { url: /\/crear\/paso-4\/?(\?.*)?$/, testIds: ['create-wizard'] },
  'chat-creando': { url: /\/chat\/?(\?.*)?$/, testIds: ['chat-creating-panel'] },
  'chat-listo': { url: /\/chat\/?(\?.*)?$/, testIds: ['chat-messages', 'chat-conv-header'] },
  'chat-error': { url: /\/chat\/?(\?.*)?$/, testIds: ['chat-error-banner'] },
  editar: { url: /\/chat\/editar\/?(\?.*)?$/, testIds: ['edit-companion-page'] },
};

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

async function demoLogin(page) {
  await page.goto('/acceso');
  await page.getByRole('button', { name: 'Entrar en modo demo' }).click();
  await page.waitForURL(/\/(crear|chat)/, { timeout: 20_000 });
}

async function fillWhoStep(page) {
  await page.goto('/crear/paso-1');
  await page.getByRole('radio', { name: 'Femenino' }).click();
  await page.getByRole('radio', { name: 'Realista' }).click();
  for (const label of ['Música', 'Cine y series', 'Viajes']) {
    await page.getByRole('button', { name: label }).click();
  }
  await page.getByRole('button', { name: 'Continuar' }).click();
  await page.waitForURL(/\/crear\/como/, { timeout: 15_000 });
}

async function fillHowAndCreate(page, { demoFailCreate = false } = {}) {
  if (demoFailCreate) {
    await page.goto('/crear/paso-4?demoFail=create');
  }
  await page.getByRole('radio', { name: 'Amigable y empática' }).click();
  await page.getByRole('radio', { name: 'Equilibrada' }).click();
  await page.locator('#create-wizard-form .field__control').first().fill('Luna');
  await page.locator('.check__input').nth(0).check();
  await page.locator('.check__input').nth(1).check();
  await page.getByRole('button', { name: /Crear a Luna/ }).click();
  await page.waitForURL(/\/chat/, { timeout: 20_000 });
}

async function completeDemoCreation(page, options = {}) {
  await fillWhoStep(page);
  await fillHowAndCreate(page, options);
}

async function assertScreen(page, screenId) {
  const spec = SCREEN_ASSERT[screenId];
  if (!spec) throw new Error(`Sin verificación para pantalla: ${screenId}`);
  await page.waitForURL(spec.url, { timeout: ASSERT_MS });
  for (const testId of spec.testIds) {
    await page.getByTestId(testId).waitFor({ state: 'visible', timeout: ASSERT_MS });
  }
}

async function prepareScreen(page, id) {
  switch (id) {
    case 'inicio':
      await page.goto('/');
      break;
    case 'acceso':
      await page.goto('/acceso');
      break;
    case 'vista-2':
      await demoLogin(page);
      await page.goto('/crear/paso-1');
      break;
    case 'vista-3':
      await demoLogin(page);
      await page.goto('/crear/paso-4');
      break;
    case 'chat-creando':
      await demoLogin(page);
      await fillWhoStep(page);
      await page.getByRole('radio', { name: 'Amigable y empática' }).click();
      await page.getByRole('radio', { name: 'Equilibrada' }).click();
      await page.locator('#create-wizard-form .field__control').first().fill('Luna');
      await page.locator('.check__input').nth(0).check();
      await page.locator('.check__input').nth(1).check();
      await page.getByRole('button', { name: /Crear a Luna/ }).click();
      await page.waitForURL(/\/chat/, { timeout: 20_000 });
      break;
    case 'chat-listo':
      await demoLogin(page);
      await completeDemoCreation(page);
      await page.getByTestId('chat-read').waitFor({ timeout: 20_000 });
      await page.getByTestId('chat-messages').waitFor({ state: 'visible', timeout: 20_000 });
      break;
    case 'chat-error':
      await demoLogin(page);
      await completeDemoCreation(page, { demoFailCreate: true });
      break;
    case 'editar':
      await demoLogin(page);
      await completeDemoCreation(page);
      await page.goto('/chat/editar');
      break;
    default:
      throw new Error(`Pantalla desconocida: ${id}`);
  }
  await assertScreen(page, id);
  await page.waitForTimeout(300);
}

function sha256File(filePath) {
  return createHash('sha256').update(readFileSync(filePath)).digest('hex');
}

function assertUniquePngs(entries) {
  /** @type {Map<string, string[]>} */
  const byHash = new Map();
  for (const { file, screen, theme, width } of entries) {
    const hash = sha256File(file);
    const label = `${screen} (${theme}, ${width}px)`;
    const list = byHash.get(hash) ?? [];
    list.push(label);
    byHash.set(hash, list);
  }
  const dupPairs = [];
  for (const labels of byHash.values()) {
    if (labels.length > 1) dupPairs.push(labels.join(' = '));
  }
  if (dupPairs.length) {
    throw new Error(`Capturas duplicadas (sha256):\n${dupPairs.join('\n')}`);
  }
}

function writeGalleryIndex(entries) {
  const rows = entries
    .map(({ screen, theme, width, file }) => {
      const rel = path.basename(file);
      return `<tr><td>${screen}</td><td>${theme}</td><td>${width}</td><td><a href="${rel}"><img src="${rel}" alt="${rel}" width="320" loading="lazy" /></a></td></tr>`;
    })
    .join('\n');

  const html = `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="utf-8" />
  <title>eJoi Web — capturas de referencia</title>
  <style>
    body { font-family: system-ui, sans-serif; margin: 24px; }
    table { border-collapse: collapse; width: 100%; }
    th, td { border: 1px solid #ccc; padding: 8px; vertical-align: top; }
    th { text-align: left; background: #f5f5f5; }
  </style>
</head>
<body>
  <h1>Capturas de referencia (demo)</h1>
  <p>Generado por <code>npm run shots</code>. Revisar paridad UX antes de merge.</p>
  <table>
    <thead><tr><th>Pantalla</th><th>Tema</th><th>Ancho</th><th>Vista previa</th></tr></thead>
    <tbody>
${rows}
    </tbody>
  </table>
</body>
</html>
`;
  writeFileSync(path.join(outDir, 'index.html'), html, 'utf8');
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
  /** @type {{ file: string; screen: string; theme: string; width: number }[]} */
  const captured = [];

  try {
    await waitForServer(baseUrl);

    const browser = await chromium.launch();
    for (const screen of screens) {
      for (const theme of ['claro', 'oscuro']) {
        for (const width of WIDTHS) {
          const themeStorage = theme === 'oscuro' ? 'dark' : 'light';
          const context = await browser.newContext({
            viewport: { width, height: VIEW_H },
            baseURL: baseUrl,
            colorScheme: theme === 'oscuro' ? 'dark' : 'light',
          });
          await context.addInitScript((t) => {
            localStorage.setItem('ejoi.theme', t);
          }, themeStorage);
          const page = await context.newPage();
          await prepareScreen(page, screen);
          const file = path.join(outDir, `${screen}-${theme}-${width}.png`);
          await page.screenshot({ path: file, fullPage: false });
          captured.push({ file, screen, theme, width });
          await context.close();
          console.log(`OK ${file}`);
        }
      }
    }
    await browser.close();

    if (screens.length === ALL.length) {
      assertUniquePngs(captured);
      writeGalleryIndex(captured);
      console.log(`Galería: ${path.join(outDir, 'index.html')}`);
    }
  } finally {
    preview.kill('SIGTERM');
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
