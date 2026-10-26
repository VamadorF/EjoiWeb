// AUTO-SINCRONIZADO desde ejoiFE 9234854dc9f9992b39b7f61dfb0e02b768be467d@9234854dc9f9992b39b7f61dfb0e02b768be467d:src/features/onboarding/data/getRandomCompanionName.ts. No editar: npm run sync:app
import {
  GenderId,
  getCompanionNamePool,
  resolveGenderId,
} from './companionNames';

export type RandomFn = () => number;

const pickRandom = <T,>(arr: T[], random: RandomFn): T | null => {
  if (!arr || arr.length === 0) return null;
  const index = Math.floor(random() * arr.length);
  return arr[index] ?? null;
};

/**
 * Sugiere un nombre del catálogo ethnicity × gender.
 * Sin etnia (u etnia desconocida) usa el pool mixto.
 * Evita repetir `currentName` cuando hay alternativas.
 */
export function getRandomCompanionName(
  ethnicity: string | undefined | null,
  gender: GenderId | string | undefined | null,
  currentName?: string | null,
  random: RandomFn = Math.random,
): string | null {
  if (!resolveGenderId(gender)) return null;

  const pool = getCompanionNamePool(ethnicity, gender);
  if (pool.length === 0) return null;

  const current = currentName?.trim().toLocaleLowerCase('es');
  const candidates = current
    ? pool.filter((name) => name.toLocaleLowerCase('es') !== current)
    : pool;

  return pickRandom(candidates.length > 0 ? candidates : pool, random);
}
