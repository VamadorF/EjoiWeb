import { describe, expect, it } from 'vitest';

import syncManifest from '@/SYNC.json';

import {
  listAvailableVisualStyles,
  stylePortraitSrc,
  visualStyleSelectorOptions,
} from './portraits';

describe('portraits', () => {
  it('expone ambos estilos cuando el manifiesto incluye los cuatro retratos', () => {
    expect(listAvailableVisualStyles()).toEqual(['realista', 'anime']);
    expect(visualStyleSelectorOptions()).toHaveLength(2);
  });

  it('no ofrece ilustrado si faltan assets en el manifiesto', () => {
    const withoutAnime = {
      ...syncManifest,
      assets: syncManifest.assets.filter((entry) => !entry.path.includes('ilustrado')),
    };
    expect(listAvailableVisualStyles(withoutAnime)).toEqual(['realista']);
    expect(visualStyleSelectorOptions(withoutAnime).map((o) => o.id)).toEqual(['realista']);
  });

  it('resuelve rutas de muestra por estilo y género', () => {
    expect(stylePortraitSrc('anime', 'femenino')).toContain('ilustrado-femenino');
    expect(stylePortraitSrc('realista', 'masculino')).toContain('realista-masculino');
    expect(stylePortraitSrc('realista', 'neutro')).toContain('realista-neutro');
    expect(stylePortraitSrc('anime', 'neutro')).toContain('ilustrado-neutro');
  });
});
