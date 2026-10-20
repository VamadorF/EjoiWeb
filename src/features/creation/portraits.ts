import syncManifest from '@/SYNC.json';
import type { Gender, VisualStyle } from '@/features/onboarding/types';

type PortraitManifestEntry = { path: string };
type PortraitManifest = { files?: PortraitManifestEntry[]; assets?: PortraitManifestEntry[] };

const PORTRAIT_PREFIX = 'public/portraits/';

const STYLE_PORTRAIT_PATHS: Record<VisualStyle, readonly [string, string]> = {
  realista: ['/portraits/realista-femenino.webp', '/portraits/realista-masculino.webp'],
  anime: ['/portraits/ilustrado-femenino.webp', '/portraits/ilustrado-masculino.webp'],
};

export type VisualStyleSelectorOption = {
  id: VisualStyle;
  labelKey: 'create.style_realistic' | 'create.style_illustrated';
};

export const VISUAL_STYLE_SELECTOR_OPTIONS: VisualStyleSelectorOption[] = [
  { id: 'realista', labelKey: 'create.style_realistic' },
  { id: 'anime', labelKey: 'create.style_illustrated' },
];

function portraitPathsFromManifest(manifest: PortraitManifest): Set<string> {
  const entries = [...(manifest.files ?? []), ...(manifest.assets ?? [])];
  return new Set(
    entries
      .filter((entry) => entry.path.startsWith(PORTRAIT_PREFIX))
      .map((entry) => entry.path.slice('public'.length)),
  );
}

export function listAvailableVisualStyles(manifest: PortraitManifest = syncManifest): VisualStyle[] {
  const paths = portraitPathsFromManifest(manifest);
  return (Object.keys(STYLE_PORTRAIT_PATHS) as VisualStyle[]).filter((style) =>
    STYLE_PORTRAIT_PATHS[style].every((path) => paths.has(path)),
  );
}

export function visualStyleSelectorOptions(
  manifest: PortraitManifest = syncManifest,
): VisualStyleSelectorOption[] {
  const available = new Set(listAvailableVisualStyles(manifest));
  return VISUAL_STYLE_SELECTOR_OPTIONS.filter((option) => available.has(option.id));
}

export function stylePortraitSrc(visualStyle: VisualStyle | '', gender: Gender | ''): string | null {
  if (!visualStyle || !gender || gender === 'neutro') return null;
  if (visualStyle === 'realista') {
    return gender === 'femenino'
      ? STYLE_PORTRAIT_PATHS.realista[0]
      : STYLE_PORTRAIT_PATHS.realista[1];
  }
  return gender === 'femenino' ? STYLE_PORTRAIT_PATHS.anime[0] : STYLE_PORTRAIT_PATHS.anime[1];
}

export function stylePortraitSrcForCard(visualStyle: VisualStyle, gender: 'femenino' | 'masculino'): string {
  return stylePortraitSrc(visualStyle, gender)!;
}
