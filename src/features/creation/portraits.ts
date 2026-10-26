import syncManifest from '@/SYNC.json';
import type { Gender, VisualStyle } from '@/features/onboarding/types';

type PortraitManifestEntry = { path: string };
type PortraitManifest = { files?: PortraitManifestEntry[]; assets?: PortraitManifestEntry[] };

const PORTRAIT_PREFIX = 'public/portraits/';

const STYLE_PORTRAIT_PATHS: Record<
  VisualStyle,
  Record<'femenino' | 'masculino' | 'neutro', string>
> = {
  realista: {
    femenino: '/portraits/realista-femenino.webp',
    masculino: '/portraits/realista-masculino.webp',
    neutro: '/portraits/realista-neutro.webp',
  },
  anime: {
    femenino: '/portraits/ilustrado-femenino.webp',
    masculino: '/portraits/ilustrado-masculino.webp',
    neutro: '/portraits/ilustrado-neutro.webp',
  },
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
    Object.values(STYLE_PORTRAIT_PATHS[style]).every((path) => paths.has(path)),
  );
}

export function visualStyleSelectorOptions(
  manifest: PortraitManifest = syncManifest,
): VisualStyleSelectorOption[] {
  const available = new Set(listAvailableVisualStyles(manifest));
  return VISUAL_STYLE_SELECTOR_OPTIONS.filter((option) => available.has(option.id));
}

export function stylePortraitSrc(visualStyle: VisualStyle | '', gender: Gender | ''): string | null {
  if (!visualStyle || !gender) return null;
  const style = visualStyle === 'anime' ? 'anime' : 'realista';
  if (gender !== 'femenino' && gender !== 'masculino' && gender !== 'neutro') return null;
  return STYLE_PORTRAIT_PATHS[style][gender];
}

export function stylePortraitSrcForCard(visualStyle: VisualStyle, gender: Gender): string {
  return stylePortraitSrc(visualStyle, gender)!;
}
