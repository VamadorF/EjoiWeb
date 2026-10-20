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
});
