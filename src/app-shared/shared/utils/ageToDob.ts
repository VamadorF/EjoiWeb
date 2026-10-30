// AUTO-SINCRONIZADO desde ejoiFE a1e61e3d072b6cc9e8b074adda33480eb1d3a1f2@a1e61e3d072b6cc9e8b074adda33480eb1d3a1f2:src/shared/utils/ageToDob.ts. No editar: npm run sync:app
/**
 * Convierte una edad en años a una fecha de nacimiento ISO (YYYY-MM-DD).
 * Usa el 1 de enero del año correspondiente como convención estable.
 */
export function ageToDob(age: number): string {
  const birthYear = new Date().getFullYear() - age;
  return `${birthYear}-01-01`;
}
