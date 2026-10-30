import { describe, expect, it } from 'vitest';

import { buildHairColorEditPrompt } from './hairEditPrompt';

describe('buildHairColorEditPrompt', () => {
  it('pide cambiar solo el cabello y conservar ojos, outfit y escena', () => {
    const prompt = buildHairColorEditPrompt('Rubio', 'realista');
    expect(prompt).toContain('natural blonde hair');
    expect(prompt).toContain('eye color');
    expect(prompt).toContain('outfit and clothing colors');
    expect(prompt).toContain('background');
    expect(prompt).not.toContain('anime');
  });

  it('en anime pide conservar el estilo anime', () => {
    expect(buildHairColorEditPrompt('Pelirrojo', 'anime')).toContain('Keep the same anime illustration style.');
  });

  it('devuelve null para un color desconocido', () => {
    expect(buildHairColorEditPrompt('Morado', 'realista')).toBeNull();
  });
});
