import { describe, expect, it } from 'vitest';

import '~/i18n';

import { buildCharacterAttributes, intensityLabelFromProfile } from './profileAttributes';

describe('profileAttributes', () => {
  it('mapea intensidad a etiqueta de tarjeta', () => {
    expect(intensityLabelFromProfile('balanced')).toBe('Equilibrada');
    expect(intensityLabelFromProfile(undefined)).toBe('Equilibrada');
  });

  it('arma atributos de carácter desde persona e intensidad', () => {
    const attrs = buildCharacterAttributes({
      id: 'c1',
      name: 'Luna',
      persona: 'Amigable',
      intensity: 'soft',
      gender: 'femenino',
    });
    expect(attrs.length).toBeGreaterThanOrEqual(2);
    expect(attrs.some((a) => a.includes('Suave'))).toBe(true);
  });
});
