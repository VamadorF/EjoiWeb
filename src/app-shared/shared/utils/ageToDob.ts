// AUTO-SINCRONIZADO desde ejoiFE 9234854dc9f9992b39b7f61dfb0e02b768be467d@9234854dc9f9992b39b7f61dfb0e02b768be467d:src/shared/utils/ageToDob.ts. No editar: npm run sync:app
/**
 * Convierte una edad en años a una fecha de nacimiento ISO (YYYY-MM-DD).
 * Usa el 1 de enero del año correspondiente como convención estable.
 */
export function ageToDob(age: number): string {
  const birthYear = new Date().getFullYear() - age;
  return `${birthYear}-01-01`;
}
