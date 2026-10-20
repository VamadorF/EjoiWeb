import { describe, expect, it } from 'vitest';

import { buildConversationalPatchBody, profileToEditForm } from './editPatch';

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
});
