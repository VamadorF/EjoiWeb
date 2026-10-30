import { describe, expect, it } from 'vitest';

import i18n from '~/i18n';

import { buildIcebreakerSuggestions } from './icebreakerSuggestions';

const t = i18n.getFixedT('es', 'web');
const tShared = i18n.getFixedT('es');

// Frases típicas de la voz del companion que nunca deben ofrecerse al usuario (SCRUM-190).
const COMPANION_VOICE = [/\bsoy\b/i, /en qué puedo ayudarte/i, /me alegra (mucho )?verte/i, /estoy aquí/i];

describe('buildIcebreakerSuggestions', () => {
  it('no presenta al usuario como el companion', () => {
    const out = buildIcebreakerSuggestions({ name: 'Wren', interests: [] }, t, tShared);
    expect(out.length).toBeGreaterThan(0);
    for (const line of out) {
      expect(line).not.toContain('Soy Wren');
      for (const re of COMPANION_VOICE) expect(line).not.toMatch(re);
    }
  });

  it('se dirige al companion por su nombre', () => {
    const out = buildIcebreakerSuggestions({ name: 'Wren', interests: [] }, t, tShared);
    expect(out[0]).toContain('Wren');
  });

  it('usa un interés del companion como tema', () => {
    const out = buildIcebreakerSuggestions({ name: 'Leo', interests: ['Música', 'Viajes'] }, t, tShared);
    expect(out.some((line) => line.includes('la música'))).toBe(true);
  });

  it('devuelve como máximo 3 sugerencias sin duplicados', () => {
    const out = buildIcebreakerSuggestions({ name: 'Leo', interests: ['Cocina'] }, t, tShared);
    expect(out.length).toBeLessThanOrEqual(3);
    expect(new Set(out).size).toBe(out.length);
  });

  it('sin nombre sigue devolviendo sugerencias en voz del usuario', () => {
    const out = buildIcebreakerSuggestions({ name: '', interests: [] }, t, tShared);
    expect(out.length).toBeGreaterThan(0);
    for (const line of out) expect(line).not.toMatch(/\bsoy\b/i);
  });
});
