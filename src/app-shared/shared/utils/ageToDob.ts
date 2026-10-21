// AUTO-SINCRONIZADO desde ejoiFE b20f6d62a97a0266796ebfb82e772f0961ed9136@b20f6d62a97a0266796ebfb82e772f0961ed9136:src/shared/utils/ageToDob.ts. No editar: npm run sync:app
/**
 * Convierte una edad en años a una fecha de nacimiento ISO (YYYY-MM-DD).
 * Usa el 1 de enero del año correspondiente como convención estable.
 */
export function ageToDob(age: number): string {
  const birthYear = new Date().getFullYear() - age;
  return `${birthYear}-01-01`;
}
