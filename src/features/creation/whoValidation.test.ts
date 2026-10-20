import { describe, expect, it } from 'vitest';

import { buildPreviewTags, listWhoMissing } from './whoValidation';

describe('listWhoMissing', () => {
  it('lista 3 faltantes con formulario vacío', () => {
    expect(listWhoMissing({ gender: '', visualStyle: '', interests: [] })).toEqual([
      'género',
      'estilo visual',
      'al menos 3 intereses',
    ]);
  });

  it('lista 2 faltantes sin género', () => {
    expect(
      listWhoMissing({ gender: '', visualStyle: 'realista', interests: ['Arte y cultura'] }),
    ).toEqual(['género', 'al menos 3 intereses']);
  });

  it('lista 1 faltante con solo intereses incompletos', () => {
    expect(
      listWhoMissing({
        gender: 'femenino',
        visualStyle: 'anime',
        interests: ['Arte y cultura', 'Música'],
      }),
    ).toEqual(['al menos 3 intereses']);
  });
});

describe('buildPreviewTags', () => {
  it('destaca la última etiqueta en el orden de intereses', () => {
    const tags = buildPreviewTags(
      {
        visualStyle: 'realista',
        gender: 'femenino',
        persona: '',
        tone: '',
        interactionStyle: '',
        conversationDepth: '',
        interests: ['Arte y cultura', 'Música'],
        boundaries: [],
      },
      ['gender', 'style', 'interest:Arte y cultura', 'interest:Música'],
    );
    expect(tags.at(-1)?.label).toBe('Música');
  });
});
