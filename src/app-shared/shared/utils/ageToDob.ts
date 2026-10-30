// AUTO-SINCRONIZADO desde ejoiFE 64d4aac4c69dbe3ca4d58a65271d9b91a96b60b7@64d4aac4c69dbe3ca4d58a65271d9b91a96b60b7:src/shared/utils/ageToDob.ts. No editar: npm run sync:app
/**
 * Convierte una edad en años a una fecha de nacimiento ISO (YYYY-MM-DD).
 * Usa el 1 de enero del año correspondiente como convención estable.
 */
export function ageToDob(age: number): string {
  const birthYear = new Date().getFullYear() - age;
  return `${birthYear}-01-01`;
}
