import { describe, expect, it } from 'vitest';

import { generateCompanionImagePrompt } from '@/shared/utils/companionImagePrompt';

import {
  buildAppearancePatchBody,
  buildConversationalPatchBody,
  editFormToOnboardingData,
  isHairOnlyChange,
  profileToEditForm,
  resolvePromptHairColor,
} from './editPatch';

describe('editPatch', () => {
  const profile = {
    id: 'c1',
    name: 'Luna',
    visualStyle: 'realista',
    gender: 'femenino',
    persona: 'Cálida',
    intensity: 'balanced',
    interests: ['Música'],
    boundaries: ['Política'],
    voiceKey: 'NORAH',
    age: 25,
  };

  it('PATCH conversacional envía solo campos cambiados', () => {
    const baseline = profileToEditForm(profile);
    const current = { ...baseline, persona: 'Intelectual', voiceKey: 'CRISTINA' };
    const body = buildConversationalPatchBody(baseline, current);
    expect(body).toEqual({
      persona: 'Intelectual',
      voiceKey: 'CRISTINA',
    });
  });

  it('sin cambios conversacionales el cuerpo queda vacío', () => {
    const baseline = profileToEditForm(profile);
    expect(buildConversationalPatchBody(baseline, baseline)).toEqual({});
  });

  it('PATCH de apariencia incluye hairColor', () => {
    const baseline = profileToEditForm({ ...profile, hairColor: 'Negro' });
    const current = { ...baseline, hairColor: 'Rubio' };
    const body = buildAppearancePatchBody(baseline, current);
    expect(body.hairColor).toBe('Rubio');
  });

  it('el prompt generado desde el formulario incluye el color elegido (SCRUM-192)', () => {
    const baseline = profileToEditForm({ ...profile, hairColor: 'Castaño oscuro' });
    const current = { ...baseline, hairColor: 'Rubio' };
    const data = editFormToOnboardingData(
      current,
      resolvePromptHairColor(baseline, current, { hairColor: 'Castaño oscuro' }),
    );
    expect(data.hairColor).toBe('Rubio');
    expect(generateCompanionImagePrompt(data, 'avatar')).toContain('natural blonde hair');
  });

  it('perfil sin color guardado y sin cambio de cabello: no se fuerza el color por defecto', () => {
    const baseline = profileToEditForm(profile);
    const current = { ...baseline, visualStyle: 'anime' as const };
    expect(resolvePromptHairColor(baseline, current, { hairColor: null })).toBeUndefined();
  });

  it('perfil con color guardado y cambio solo de estilo: conserva el color', () => {
    const baseline = profileToEditForm({ ...profile, hairColor: 'Pelirrojo' });
    const current = { ...baseline, visualStyle: 'anime' as const };
    expect(resolvePromptHairColor(baseline, current, { hairColor: 'Pelirrojo' })).toBe('Pelirrojo');
  });

  it('isHairOnlyChange: solo cabello es true; cabello + estilo, solo estilo o sin cambios es false', () => {
    const baseline = profileToEditForm({ ...profile, hairColor: 'Negro' });
    expect(isHairOnlyChange(baseline, { ...baseline, hairColor: 'Rubio' })).toBe(true);
    expect(isHairOnlyChange(baseline, { ...baseline, hairColor: 'Rubio', visualStyle: 'anime' })).toBe(false);
    expect(isHairOnlyChange(baseline, { ...baseline, visualStyle: 'anime' })).toBe(false);
    expect(isHairOnlyChange(baseline, baseline)).toBe(false);
  });
});
