const SHIM_PREFIX = '@/';

/** @typedef {{ spec: string, isTypeOnly: boolean }} ParsedImport */

/** @param {string} source */
export function parseImports(source) {
  /** @type {ParsedImport[]} */
  const out = [];
  const stripped = source
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/^\s*\/\/.*$/gm, '');

  const staticRe =
    /(?:import|export)\s+(type\s+)?(?:[\s\S]*?\sfrom\s+)['"]([^'"]+)['"]/g;
  let m;
  while ((m = staticRe.exec(stripped)) !== null) {
    out.push({ spec: m[2], isTypeOnly: Boolean(m[1]) });
  }

  const sideEffectRe = /import\s+['"]([^'"]+)['"]/g;
  while ((m = sideEffectRe.exec(stripped)) !== null) {
    out.push({ spec: m[1], isTypeOnly: false });
  }

  const dynRe = /import\s*\(\s*['"]([^'"]+)['"]\s*\)/g;
  while ((m = dynRe.exec(stripped)) !== null) {
    out.push({ spec: m[1], isTypeOnly: false });
  }

  const reqRe = /require\s*\(\s*['"]([^'"]+)['"]\s*\)/g;
  while ((m = reqRe.exec(stripped)) !== null) {
    out.push({ spec: m[1], isTypeOnly: false });
  }

  return out;
}

const EXT_TRY = ['.ts', '.tsx', '.json'];

/**
 * @param {string} spec
 * @param {string} fromPath repo-relative e.g. src/features/foo.ts
 */
export function resolveSpecifier(spec, fromPath) {
  if (spec.startsWith(SHIM_PREFIX)) {
    const base = `src/${spec.slice(SHIM_PREFIX.length)}`;
    return resolveWithExtensions(base);
  }
  if (spec.startsWith('.')) {
    const fromDir = fromPath.replace(/[/\\][^/\\]+$/, '');
    const joined = normalizePath(`${fromDir}/${spec}`);
    return resolveWithExtensions(joined);
  }
  return null;
}

/** @param {string} basePath */
function resolveWithExtensions(basePath) {
  const normalized = normalizePath(basePath);
  if (EXT_TRY.some((e) => normalized.endsWith(e))) {
    return normalized;
  }
  if (!normalized.includes('.')) {
    return `${normalized}.ts`;
  }
  return normalized;
}

/** @param {string} p */
function normalizePath(p) {
  const parts = p.replace(/\\/g, '/').split('/');
  /** @type {string[]} */
  const stack = [];
  for (const part of parts) {
    if (part === '' || part === '.') continue;
    if (part === '..') stack.pop();
    else stack.push(part);
  }
  return stack.join('/');
}

/**
 * @param {string} spec
 * @param {boolean} isTypeOnly
 * @param {{ shims: Record<string, string>, allowedPackages: string[], typeOnlyPackages: string[] }} config
 * @returns {{ status: 'ok' | 'shim' | 'prohibido', motivo?: string }}
 */
export function checkImport(spec, isTypeOnly, config) {
  if (spec in config.shims) {
    return { status: 'shim' };
  }
  if (spec.startsWith('.') || spec.startsWith(SHIM_PREFIX)) {
    return { status: 'ok' };
  }
  const pkg = spec.split('/')[0]?.startsWith('@')
    ? spec.split('/').slice(0, 2).join('/')
    : spec.split('/')[0];
  if (config.typeOnlyPackages.includes(pkg) || config.typeOnlyPackages.includes(spec)) {
    return isTypeOnly ? { status: 'ok' } : { status: 'prohibido', motivo: `${spec} solo import type` };
  }
  if (config.allowedPackages.includes(pkg) || config.allowedPackages.includes(spec)) {
    return { status: 'ok' };
  }
  if (
    /^react-native/.test(spec) ||
    spec === 'react-native' ||
    spec === 'expo' ||
    /^expo-/.test(spec) ||
    /^@react-native\//.test(spec)
  ) {
    return { status: 'prohibido', motivo: `React Native / Expo: ${spec}` };
  }
  return { status: 'prohibido', motivo: `paquete no permitido: ${spec}` };
}
