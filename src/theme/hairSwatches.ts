/** ponytail: colores de muestra provisionales; único hex permitido para cabello (DU-13). */
export const HAIR_COLOR_OPTIONS = [
  { value: 'Negro', labelKey: 'edit.hair_black', swatch: '#1F1B18' },
  { value: 'Castaño oscuro', labelKey: 'edit.hair_dark_brown', swatch: '#4A2E1F' },
  { value: 'Castaño claro', labelKey: 'edit.hair_light_brown', swatch: '#8B5E3C' },
  { value: 'Rubio', labelKey: 'edit.hair_blonde', swatch: '#D9B26F' },
  { value: 'Pelirrojo', labelKey: 'edit.hair_red', swatch: '#A23E1C' },
  { value: 'Canoso', labelKey: 'edit.hair_gray', swatch: '#BDB8B2' },
] as const;

export type HairColorValue = (typeof HAIR_COLOR_OPTIONS)[number]['value'];

export const DEFAULT_HAIR_COLOR: HairColorValue = 'Castaño oscuro';

export function hairColorLabelKey(value: string | undefined | null): string | null {
  const match = HAIR_COLOR_OPTIONS.find((o) => o.value === value?.trim());
  return match?.labelKey ?? null;
}
