import { describe, expect, it } from 'vitest';

type RawModule = Record<string, string>;

const sources = import.meta.glob<string>('../**/*.{ts,tsx,json}', {
  eager: true,
  query: '?raw',
  import: 'default',
}) as RawModule;

function relPath(key: string): string {
  return key.replace(/^\.\.\//, 'src/').replace(/\\/g, '/');
}

const GENDER_AT = /(?:compañer|list)@/i;
const GENDER_SLASH = /\b(?:un|el|la)\/(?:a|la|lo)\b/i;

describe('genderGuard', () => {
  it('no expone literales de género @ ni /a fuera de app-shared', () => {
    const hits: string[] = [];

    for (const [key, text] of Object.entries(sources)) {
      const file = relPath(key);
      if (file.includes('/app-shared/')) continue;
      if (file.endsWith('genderGuard.test.ts')) continue;

      for (const [lineIndex, line] of text.split('\n').entries()) {
        if (GENDER_AT.test(line) || GENDER_SLASH.test(line)) {
          hits.push(`${file}:${lineIndex + 1}: ${line.trim()}`);
        }
      }
    }

    expect(hits).toEqual([]);
  });
});
