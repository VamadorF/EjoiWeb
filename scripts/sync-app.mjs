#!/usr/bin/env node
import { createHash } from 'node:crypto';
import { execSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';
import { checkImport, parseImports, portraitPipeline, resolveSpecifier } from './sync-lib.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.join(__dirname, '..');
const configPath = path.join(rootDir, 'sync.config.json');
const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
const isCheck = process.argv.includes('--check');
const noFetch = process.argv.includes('--no-fetch');

const appDir = path.resolve(rootDir, config.appDir);
const appSharedDir = path.join(rootDir, 'src', 'app-shared');
const syncManifestPath = path.join(appSharedDir, 'SYNC.json');

function sha256Buffer(buf) {
  return createHash('sha256').update(buf).digest('hex');
}

function sha256File(filePath) {
  return sha256Buffer(fs.readFileSync(filePath));
}

function git(appArgs) {
  return execSync(`git ${appArgs}`, { cwd: appDir, encoding: 'utf8' }).trim();
}

function gitBuffer(ref, repoPath) {
  return execSync(`git show ${ref}:${repoPath}`, { cwd: appDir, maxBuffer: 50 * 1024 * 1024 });
}

function tryReadAtRef(ref, repoPath) {
  const candidates = candidatePaths(repoPath);
  for (const c of candidates) {
    try {
      execSync(`git cat-file -e ${ref}:${c}`, { cwd: appDir, stdio: 'pipe' });
      return { path: c, content: gitBuffer(ref, c) };
    } catch {
      /* try next */
    }
  }
  return null;
}

function candidatePaths(repoPath) {
  const n = repoPath.replace(/\\/g, '/');
  if (/\.(ts|tsx|json)$/.test(n)) return [n];
  return [
    n,
    `${n}.ts`,
    `${n}.tsx`,
    `${n}.json`,
    `${n}/index.ts`,
    `${n}/index.tsx`,
  ];
}

function toAppSharedPath(repoPath) {
  const n = repoPath.replace(/\\/g, '/');
  if (n.startsWith('src/')) return n.slice('src/'.length);
  return n;
}

function headerLine(ref, sha, repoPath) {
  return `// AUTO-SINCRONIZADO desde ejoiFE ${ref}@${sha}:${repoPath}. No editar: npm run sync:app\n`;
}

function collectClosure(ref) {
  /** @type {Map<string, string>} repoPath -> content utf8 or binary marker */
  const files = new Map();
  /** @type {string[]} */
  const queue = [...config.entries];
  /** @type {Map<string, string[]>} */
  const chains = new Map();

  while (queue.length) {
    const repoPath = queue.shift();
    if (files.has(repoPath)) continue;

    const read = tryReadAtRef(ref, repoPath);
    if (!read) {
      throw new Error(`No se encontró en ${ref}: ${repoPath}`);
    }
    const contentStr = read.path.endsWith('.json')
      ? read.content.toString('utf8')
      : read.content.toString('utf8');
    files.set(read.path, contentStr);

    if (!read.path.endsWith('.json')) {
      const imports = parseImports(contentStr);
      for (const { spec, isTypeOnly } of imports) {
        const checked = checkImport(spec, isTypeOnly, config);
        if (checked.status === 'shim') continue;
        if (checked.status === 'prohibido') {
          const chain = chains.get(read.path) ?? [read.path];
          throw new Error(
            `Import prohibido: ${chain.join(' → ')} → '${spec}' (${checked.motivo})`,
          );
        }
        if (checked.status === 'ok' && (spec.startsWith('.') || spec.startsWith('@/'))) {
          const resolved = resolveSpecifier(spec, read.path);
          if (resolved) {
            const resolvedRead = tryReadAtRef(ref, resolved);
            const target = resolvedRead?.path ?? resolved;
            if (!files.has(target)) queue.push(target);
            chains.set(target, [...(chains.get(read.path) ?? [read.path]), spec]);
          }
        }
      }
    }
  }
  return files;
}

async function processAsset(ref, sha, asset) {
  const raw = gitBuffer(ref, asset.from);
  const pipeline = portraitPipeline(asset);
  if (!pipeline) {
    return raw;
  }

  const render = (quality) => {
    let img = sharp(raw);
    if (pipeline.kind === 'crop') {
      img = img.extract(pipeline.extract).resize(pipeline.outputSize, pipeline.outputSize);
    } else {
      img = img.resize(pipeline.resize, pipeline.resize, { fit: 'cover', position: 'attention' });
    }
    return img.webp({ quality }).toBuffer();
  };

  let quality = 80;
  let out = await render(quality);
  while (out.length > 120 * 1024 && quality > 60) {
    quality -= 5;
    out = await render(quality);
  }
  if (out.length > 120 * 1024) {
    throw new Error(`${asset.to} supera 120 KB (${out.length} bytes)`);
  }
  return out;
}

function runCheck() {
  if (!fs.existsSync(syncManifestPath)) {
    console.error('Falta src/app-shared/SYNC.json — ejecuta npm run sync:app');
    process.exit(1);
  }
  const manifest = JSON.parse(fs.readFileSync(syncManifestPath, 'utf8'));

  for (const { path: relPath, sha256: expected } of manifest.files) {
    const full = path.join(appSharedDir, relPath);
    if (!fs.existsSync(full)) {
      console.error(`Falta archivo sincronizado: ${relPath}`);
      process.exit(1);
    }
    const hash = sha256File(full);
    if (hash !== expected) {
      console.error(`Hash distinto en ${relPath}: esperado ${expected}, actual ${hash}`);
      process.exit(1);
    }
  }

  for (const f of walkFiles(appSharedDir)) {
    const rel = path.relative(appSharedDir, f).replace(/\\/g, '/');
    if (rel === 'SYNC.json') continue;
    if (!manifest.files.some((x) => x.path === rel)) {
      console.error(`Archivo sobrante en app-shared: ${rel}`);
      process.exit(1);
    }
  }

  for (const { path: assetPath, sha256: expected } of manifest.assets) {
    const full = path.join(rootDir, assetPath);
    if (!fs.existsSync(full)) {
      console.error(`Falta asset: ${assetPath}`);
      process.exit(1);
    }
    const hash = sha256File(full);
    if (hash !== expected) {
      console.error(`Hash distinto en asset ${assetPath}`);
      process.exit(1);
    }
  }

  console.log('sync:check OK');
}

function walkFiles(dir) {
  /** @type {string[]} */
  const out = [];
  if (!fs.existsSync(dir)) return out;
  for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, ent.name);
    if (ent.isDirectory()) out.push(...walkFiles(p));
    else out.push(p);
  }
  return out;
}

async function runSync() {
  try {
    git('rev-parse --is-inside-work-tree');
  } catch {
    console.error('appDir no es un repositorio git');
    process.exit(1);
  }

  if (!noFetch) {
    git('fetch origin');
  }

  const ref = config.ref;
  const sha = git(`rev-parse ${ref}`);
  const repo = path.basename(path.dirname(appDir));

  const closure = collectClosure(ref);

  if (fs.existsSync(appSharedDir)) {
    fs.rmSync(appSharedDir, { recursive: true, force: true });
  }
  fs.mkdirSync(appSharedDir, { recursive: true });

  /** @type {{ path: string, sha256: string }[]} */
  const fileManifest = [];

  for (const [repoPath, contentStr] of closure) {
    const rel = toAppSharedPath(repoPath);
    const dest = path.join(appSharedDir, rel);
    fs.mkdirSync(path.dirname(dest), { recursive: true });

    let body;
    if (repoPath.endsWith('.json')) {
      body = Buffer.from(contentStr, 'utf8');
    } else {
      body = Buffer.from(headerLine(ref, sha, repoPath) + contentStr, 'utf8');
    }
    fs.writeFileSync(dest, body);
    fileManifest.push({ path: rel.replace(/\\/g, '/'), sha256: sha256Buffer(body) });
  }

  fileManifest.sort((a, b) => a.path.localeCompare(b.path));

  /** @type {{ path: string, sha256: string }[]} */
  const assetManifest = [];
  for (const asset of config.assets) {
    const buf = await processAsset(ref, sha, asset);
    const dest = path.join(rootDir, asset.to);
    fs.mkdirSync(path.dirname(dest), { recursive: true });
    fs.writeFileSync(dest, buf);
    assetManifest.push({ path: asset.to.replace(/\\/g, '/'), sha256: sha256Buffer(buf) });
  }
  assetManifest.sort((a, b) => a.path.localeCompare(b.path));

  const syncedAt = git(`show -s --format=%cI ${sha}`);
  const manifest = {
    repo,
    ref,
    sha,
    syncedAt,
    files: fileManifest,
    assets: assetManifest,
  };
  fs.writeFileSync(syncManifestPath, `${JSON.stringify(manifest, null, 2)}\n`, 'utf8');

  console.log(`sync:app OK — ${fileManifest.length} archivos, ${assetManifest.length} assets @ ${sha.slice(0, 7)}`);
}

if (isCheck) {
  runCheck();
} else {
  runSync().catch((err) => {
    console.error(err.message || err);
    process.exit(1);
  });
}
