import { describe, expect, it } from 'vitest';

import { UxV2 } from '@/shared/theme/tokens';

import { buildCssVarsText, colorVarName } from './cssVars';

describe('cssVars', () => {
  it('expone cada color de UxV2.light como variable CSS', () => {
    const css = buildCssVarsText();
    for (const key of Object.keys(UxV2.light)) {
      expect(css).toContain(`${colorVarName(key)}:`);
    }
  });

  it('expone cada color de UxV2.dark como variable CSS', () => {
    const css = buildCssVarsText();
    for (const key of Object.keys(UxV2.dark)) {
      expect(css).toContain(`${colorVarName(key)}:`);
    }
  });

  it('incluye packs de la app y temas web', () => {
    const css = buildCssVarsText();
    expect(css).toContain('[data-theme-id="romantic"]');
    expect(css).toContain('#fff8f3');
    expect(css).toContain('[data-theme-id="minimal"]');
    expect(css).toContain('[data-theme-id="kawaii"]');
    expect(css).toContain('#fff0f5');
    expect(css).toContain('[data-theme-id="aurora"]');
    expect(css).toContain('var(--theme-aurora-bg)');
    expect(css).toContain('[data-theme-id="pulse"]');
    expect(css).toContain('var(--theme-pulse-brand)');
    expect(css).toContain('[data-theme-id="liquid"]');
    expect(css).toContain('#172033');
    expect(css).not.toContain('cyber');
  });
});
