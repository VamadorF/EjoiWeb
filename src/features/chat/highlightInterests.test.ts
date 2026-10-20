import { describe, expect, it } from 'vitest';

import { splitInterestHighlights } from './highlightInterests';

describe('splitInterestHighlights', () => {
  it('resalta intereses con distinta capitalización y tildes', () => {
    const text =
      'Vi que te interesan música y viajes, así que tengo curiosidad: ¿qué es lo que más te gusta de música?';
    const segments = splitInterestHighlights(text, ['Música', 'Viajes']);
    const highlighted = segments.filter((s) => s.highlight).map((s) => s.text);
    expect(highlighted).toContain('música');
    expect(highlighted).toContain('viajes');
    expect(highlighted.filter((h) => h === 'música')).toHaveLength(2);
  });

  it('resalta "musica" sin tilde cuando el catálogo dice Música', () => {
    const segments = splitInterestHighlights('Te gusta musica?', ['Música']);
    expect(segments.some((s) => s.highlight && s.text === 'musica')).toBe(true);
  });
});
