// AUTO-SINCRONIZADO desde ejoiFE a1e61e3d072b6cc9e8b074adda33480eb1d3a1f2@a1e61e3d072b6cc9e8b074adda33480eb1d3a1f2:src/features/onboarding/data/boundaryOptions.ts. No editar: npm run sync:app
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
