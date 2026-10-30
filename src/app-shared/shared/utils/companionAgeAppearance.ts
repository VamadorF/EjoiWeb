// AUTO-SINCRONIZADO desde ejoiFE a1e61e3d072b6cc9e8b074adda33480eb1d3a1f2@a1e61e3d072b6cc9e8b074adda33480eb1d3a1f2:src/shared/utils/companionAgeAppearance.ts. No editar: npm run sync:app
import {
  COMPANION_DEFAULT_AGE,
  COMPANION_MAX_AGE,
  COMPANION_MIN_AGE,
} from '@/features/onboarding/constants/onboardingSteps';
import { logger } from '@/shared/utils/logger';

export type CompanionAgeSource = 'age' | 'dob' | 'default';

const APPARENT_AGE_IN_PHYSICAL_RULES = /Edad aparente:\s*(\d{1,3})/i;

/** Extrae edad aparente compilada en `physicalRules` del backend (sin `dob` en columna). */
export function parseApparentAgeFromPhysicalRules(physicalRules?: string | null): number | undefined {
  const text = physicalRules?.trim();
  if (!text) return undefined;

  const match = text.match(APPARENT_AGE_IN_PHYSICAL_RULES);
  if (!match) return undefined;

  const age = Number.parseInt(match[1], 10);
  if (!Number.isFinite(age) || age < COMPANION_MIN_AGE || age > COMPANION_MAX_AGE) {
    return undefined;
  }
  return age;
}

/** Edad para UI de perfil: `dob` de API o fallback en reglas físicas. */
export function resolveCompanionApparentAgeForProfile(data: {
  dob?: string;
  physicalRules?: string;
}): number | undefined {
  const fromDob = data.dob?.trim() ? dobToAge(data.dob) : undefined;
  if (fromDob !== undefined) return fromDob;
  return parseApparentAgeFromPhysicalRules(data.physicalRules);
}

export function dobToAge(dob: string): number | undefined {
  const trimmed = dob?.trim();
  if (!trimmed) return undefined;

  const parsed = new Date(trimmed);
  if (Number.isNaN(parsed.getTime())) return undefined;

  const today = new Date();
  let age = today.getFullYear() - parsed.getFullYear();
  const monthDiff = today.getMonth() - parsed.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < parsed.getDate())) {
    age -= 1;
  }

  if (age < COMPANION_MIN_AGE || age > COMPANION_MAX_AGE) return undefined;
  return age;
}

export function resolveCompanionAge(data: { age?: number; dob?: string }): number {
  if (typeof data.age === 'number' && data.age >= COMPANION_MIN_AGE && data.age <= COMPANION_MAX_AGE) {
    return data.age;
  }

  const fromDob = data.dob ? dobToAge(data.dob) : undefined;
  if (fromDob !== undefined) return fromDob;

  return COMPANION_DEFAULT_AGE;
}

export function getCompanionAgeSource(data: { age?: number; dob?: string }): CompanionAgeSource {
  if (typeof data.age === 'number' && data.age >= COMPANION_MIN_AGE && data.age <= COMPANION_MAX_AGE) {
    return 'age';
  }
  if (data.dob?.trim() && dobToAge(data.dob) !== undefined) {
    return 'dob';
  }
  return 'default';
}

/** @deprecated Usa resolveCompanionAge; se mantiene por compatibilidad. */
export function getCompanionAge(data: { age?: number; dob?: string }): number {
  return resolveCompanionAge(data);
}

export function logCompanionAge(
  context: string,
  data: { age?: number; dob?: string },
  extra?: Record<string, unknown>,
): number {
  const resolvedAge = resolveCompanionAge(data);
  const source = getCompanionAgeSource(data);

  logger.info(`[CompanionAge][${context}]`, {
    age: resolvedAge,
    dob: data.dob?.trim() || undefined,
    inputAge: data.age,
    source,
    ...extra,
  });

  return resolvedAge;
}

function getAgeLifeStage(age: number): string {
  if (age < 26) return 'young adult';
  if (age < 36) return 'adult';
  if (age < 46) return 'mature adult';
  if (age < 56) return 'middle-aged adult';
  return 'senior adult';
}

export function buildRealisticAgeAppearance(gender: string, age: number): string {
  const lifeStage = getAgeLifeStage(age);

  if (gender === 'woman') {
    return [
      `She is ${age} years old.`,
      `Natural age-appropriate facial features for a ${lifeStage} woman.`,
      `Her appearance should clearly reflect being ${age}, not younger or older.`,
    ].join(' ');
  }

  if (gender === 'man') {
    return [
      `He is ${age} years old.`,
      `Natural age-appropriate facial features for a ${lifeStage} man.`,
      `His appearance should clearly reflect being ${age}, not younger or older.`,
    ].join(' ');
  }

  return [
    `This person is ${age} years old.`,
    `Natural age-appropriate facial features for a ${lifeStage} person.`,
    `Their appearance should clearly reflect being ${age}, not younger or older.`,
  ].join(' ');
}

export function buildAnimeAgeDescriptor(gender: string, age: number): string {
  if (age <= 25) {
    return `young ${age}-year-old ${gender} with youthful anime features`;
  }
  if (age <= 35) {
    return `${age}-year-old ${gender} with refined young-adult anime features`;
  }
  if (age <= 45) {
    return `${age}-year-old ${gender} with mature adult anime features`;
  }
  if (age <= 55) {
    return `${age}-year-old ${gender} with distinguished middle-aged anime features`;
  }
  return `${age}-year-old ${gender} with distinguished senior anime features`;
}
