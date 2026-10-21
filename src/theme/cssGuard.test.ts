import { describe, expect, it } from 'vitest';

import { buildCssVarsText, definedCssVarNames } from './cssVars';

type RawModule = Record<string, string>;

const cssRaw = import.meta.glob<string>('../**/*.css', {
  eager: true,
  query: '?raw',
  import: 'default',
}) as RawModule;

const tsxRaw = import.meta.glob<string>('../**/*.tsx', {
  eager: true,
  query: '?raw',
  import: 'default',
}) as RawModule;

function relPath(key: string): string {
  return key.replace(/^\.\.\//, 'src/').replace(/\\/g, '/');
}

function isAppShared(path: string): boolean {
  return path.includes('/app-shared/');
}

function isTheme(path: string): boolean {
  return path.includes('/theme/');
}

function collectDeclaredCssVars(): Set<string> {
  const declared = new Set<string>();
  for (const [key, text] of Object.entries(cssRaw)) {
    if (isAppShared(relPath(key))) continue;
    for (const m of text.matchAll(/(--[a-z0-9-]+)\s*:/g)) {
      declared.add(m[1]!);
    }
  }
  return declared;
}

function scanUsageAndLiterals(): { missingVars: { file: string; name: string }[]; colorLiterals: string[] } {
  const fromBuild = definedCssVarNames();
  const declaredInCss = collectDeclaredCssVars();
  const allowed = new Set([...fromBuild, ...declaredInCss]);
  const missingVars: { file: string; name: string }[] = [];
  const colorLiterals: string[] = [];

  const hexRe = /#[0-9a-fA-F]{3,8}\b/;
  const rgbRe = /\brgba?\(/;
  const hslRe = /\bhsla?\(/;

  const scanText = (rel: string, text: string, checkColors: boolean) => {
    for (const m of text.matchAll(/var\(\s*(--[a-z0-9-]+)/g)) {
      const name = m[1]!;
      if (!allowed.has(name)) {
        missingVars.push({ file: rel, name });
      }
    }
    if (!checkColors) return;
    text.split('\n').forEach((line: string, i: number) => {
      if (line.includes('#root')) return;
      if (hexRe.test(line) || rgbRe.test(line) || hslRe.test(line)) {
        colorLiterals.push(`${rel}:${i + 1}: ${line.trim()}`);
      }
    });
  };

  for (const [key, text] of Object.entries(cssRaw)) {
    const rel = relPath(key);
    if (isAppShared(rel) || isTheme(rel)) continue;
    scanText(rel, text, true);
  }

  for (const [key, text] of Object.entries(tsxRaw)) {
    const rel = relPath(key);
    if (isAppShared(rel) || isTheme(rel)) continue;
    scanText(rel, text, true);
  }

  return { missingVars, colorLiterals };
}

describe('cssGuard', () => {
  it('buildCssVarsText define tokens web 2.1', () => {
    const css = buildCssVarsText();
    expect(css).toContain('--font-title1:');
    expect(css).toContain('--gutter: 32px');
    expect(css).toContain('--c-on-brand:');
    expect(css).toMatch(/\[data-theme="dark"\][\s\S]*--elev-1: none/);
  });

  it('no multiplica tokens CSS que ya incluyen unidad (calc var * Npx)', () => {
    const bad =
      /calc\s*\(\s*var\(\s*--(?:radius|border|size|motion)-[^)]+\)\s*\*\s*[\d.]+(?:px|ms)\s*\)/;
    const hits: string[] = [];
    for (const [key, text] of Object.entries(cssRaw)) {
      const rel = relPath(key);
      if (isAppShared(rel)) continue;
      text.split('\n').forEach((line, i) => {
        if (bad.test(line)) hits.push(`${rel}:${i + 1}: ${line.trim()}`);
      });
    }
    for (const [key, text] of Object.entries(tsxRaw)) {
      const rel = relPath(key);
      if (isAppShared(rel) || isTheme(rel)) continue;
      text.split('\n').forEach((line, i) => {
        if (bad.test(line)) hits.push(`${rel}:${i + 1}: ${line.trim()}`);
      });
    }
    expect(hits, hits.join('\n') || undefined).toEqual([]);
  });

  it('no usa variables CSS inexistentes ni literales de color fuera de src/theme/', () => {
    const { missingVars, colorLiterals } = scanUsageAndLiterals();
    const missingMsg = missingVars.map((v) => `${v.file}: ${v.name}`).join('\n');
    const colorMsg = colorLiterals.join('\n');
    expect(missingVars, missingMsg || undefined).toEqual([]);
    expect(colorLiterals, colorMsg || undefined).toEqual([]);
  });
});
