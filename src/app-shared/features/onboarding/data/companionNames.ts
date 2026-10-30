// AUTO-SINCRONIZADO desde ejoiFE a1e61e3d072b6cc9e8b074adda33480eb1d3a1f2@a1e61e3d072b6cc9e8b074adda33480eb1d3a1f2:src/features/onboarding/data/companionNames.ts. No editar: npm run sync:app
import raw from './companionNames.json';

export type GenderId = 'femenino' | 'masculino' | 'neutro';

/** IDs de etnia del onboarding (ETHNICITY_OPTIONS). */
export type EthnicityId =
  | 'latina'
  | 'caucasica'
  | 'afrodescendiente'
  | 'asiatica'
  | 'arabe'
  | 'india'
  | 'mixta';

export type NamesBucket = {
  femenino: string[];
  masculino: string[];
  neutro: string[];
};

export type NamesByEthnicity = Record<EthnicityId, NamesBucket>;

export const FALLBACK_ETHNICITY: EthnicityId = 'mixta';

export const ETHNICITY_IDS: readonly EthnicityId[] = [
  'latina',
  'caucasica',
  'afrodescendiente',
  'asiatica',
  'arabe',
  'india',
  'mixta',
] as const;

export const GENDER_IDS: readonly GenderId[] = ['femenino', 'masculino', 'neutro'] as const;

export const NAMES_PER_GENDER = 30;

export const NAMES_BY_ETHNICITY = raw as NamesByEthnicity;

const GENDERS = new Set<string>(GENDER_IDS);

const ETHNICITY_ALIASES: Record<string, EthnicityId> = {
  latina: 'latina',
  latino: 'latina',
  latine: 'latina',
  caucasica: 'caucasica',
  caucasico: 'caucasica',
  caucasique: 'caucasica',
  afrodescendiente: 'afrodescendiente',
  asiatica: 'asiatica',
  asiatico: 'asiatica',
  asiatique: 'asiatica',
  arabe: 'arabe',
  india: 'india',
  indio: 'india',
  mixta: 'mixta',
  mixto: 'mixta',
  mixte: 'mixta',
};

function stripAccents(value: string): string {
  return value.normalize('NFD').replace(/\p{M}/gu, '');
}

export function resolveEthnicityId(ethnicity?: string | null): EthnicityId | null {
  if (!ethnicity) return null;
  const key = stripAccents(ethnicity.trim().toLowerCase());
  return ETHNICITY_ALIASES[key] ?? null;
}

export function resolveGenderId(gender?: string | null): GenderId | null {
  if (!gender) return null;
  const key = gender.trim().toLowerCase();
  return GENDERS.has(key) ? (key as GenderId) : null;
}

export function getCompanionNamePool(
  ethnicity: string | undefined | null,
  gender: GenderId | string | undefined | null,
): string[] {
  const genderId = resolveGenderId(gender);
  if (!genderId) return [];

  const ethnicityId = resolveEthnicityId(ethnicity) ?? FALLBACK_ETHNICITY;
  return NAMES_BY_ETHNICITY[ethnicityId][genderId];
}
