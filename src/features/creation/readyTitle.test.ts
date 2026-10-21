import { describe, expect, it } from 'vitest';

import { readyTitleI18nKey } from './readyTitle';

describe('readyTitleI18nKey', () => {
  it('elige la clave por género', () => {
    expect(readyTitleI18nKey('femenino')).toBe('companion.ready.title_feminine');
    expect(readyTitleI18nKey('masculino')).toBe('companion.ready.title_masculine');
    expect(readyTitleI18nKey('neutro')).toBe('companion.ready.title_neutral');
    expect(readyTitleI18nKey('')).toBe('companion.ready.title_default');
  });
});
