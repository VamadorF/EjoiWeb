// AUTO-SINCRONIZADO desde ejoiFE 9234854dc9f9992b39b7f61dfb0e02b768be467d@9234854dc9f9992b39b7f61dfb0e02b768be467d:src/features/onboarding/data/boundaryOptions.ts. No editar: npm run sync:app
/** Etiquetas canónicas de límites (onboarding, perfil y detección en chat). */
export const BOUNDARY_OPTIONS = [
  'No temas sexuales',
  'Mantener respeto',
  'No lenguaje ofensivo',
  'Conversaciones apropiadas',
  'Límites emocionales claros',
  'Evitar temas políticos',
  'No discusiones religiosas',
] as const;

/** Siempre activos en el wizard v2; el usuario no los desactiva. */
export const BASIC_BOUNDARIES = BOUNDARY_OPTIONS.slice(0, 4);

export type BoundaryOption = (typeof BOUNDARY_OPTIONS)[number];
