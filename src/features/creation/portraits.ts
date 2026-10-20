import type { Gender, VisualStyle } from '@/features/onboarding/types';

export function stylePortraitSrc(visualStyle: VisualStyle | '', gender: Gender | ''): string | null {
  if (!visualStyle || !gender || gender === 'neutro') return null;
  if (visualStyle === 'realista') {
    return gender === 'femenino'
      ? '/portraits/realista-femenino.webp'
      : '/portraits/realista-masculino.webp';
  }
  return gender === 'femenino'
    ? '/portraits/ilustrado-femenino.webp'
    : '/portraits/ilustrado-masculino.webp';
}

export function stylePortraitSrcForCard(visualStyle: VisualStyle, gender: 'femenino' | 'masculino'): string {
  return stylePortraitSrc(visualStyle, gender)!;
}
