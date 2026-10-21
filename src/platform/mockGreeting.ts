// ponytail: copia de eJoi-BE first-message.catalog.ts para la demo; si cambia allá, actualizar aquí

/** Claves alineadas con INTEREST_OPTIONS del frontend (SCRUM-102 / DP-29). */
export const INTEREST_CATALOG = [
  'Tecnología',
  'Arte y cultura',
  'Ciencia',
  'Deportes',
  'Música',
  'Literatura',
  'Cine y series',
  'Viajes',
  'Cocina',
  'Filosofía',
  'Psicología',
  'Historia',
  'Negocios',
  'Salud y bienestar',
  'Moda y estilo',
] as const;

export type CatalogInterest = (typeof INTEREST_CATALOG)[number];

export const INTEREST_QUICK_REPLIES: Record<CatalogInterest, readonly [string, string]> = {
  Tecnología: ['Te cuento en qué ando con la tecnología', '¿Qué invento te parece más increíble?'],
  'Arte y cultura': ['Quiero contarte de una obra que me gustó', '¿Qué tipo de arte te gusta?'],
  Ciencia: ['Te cuento un dato científico que me sorprendió', '¿Qué tema de ciencia te da curiosidad?'],
  Deportes: ['Te cuento qué deporte sigo', '¿Hablamos del último partido?'],
  Música: ['Te recomiendo una canción', '¿Qué música te gusta?'],
  Literatura: ['Te cuento qué estoy leyendo', '¿Me recomiendas un libro?'],
  'Cine y series': ['Te cuento qué serie estoy viendo', '¿Me recomiendas una película?'],
  Viajes: ['Te cuento de un viaje que me marcó', '¿A dónde te gustaría viajar?'],
  Cocina: ['Te cuento qué cociné hoy', '¿Me das una receta fácil?'],
  Filosofía: ['Tengo una pregunta que me da vueltas', '¿Qué es para ti la felicidad?'],
  Psicología: ['Quiero entender mejor algo que me pasa', '¿Hablamos de hábitos?'],
  Historia: ['Te cuento un hecho histórico que me encanta', '¿Qué época te parece más interesante?'],
  Negocios: ['Te cuento una idea que tengo', '¿Qué opinas de emprender?'],
  'Salud y bienestar': ['Te cuento cómo me he sentido', '¿Qué haces para descansar mejor?'],
  'Moda y estilo': ['Te cuento qué me gusta usar', '¿Qué estilo va contigo?'],
};

export function normalizeInterestText(value: string): string {
  return value
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .toLocaleLowerCase('es-CL');
}

export function resolveCatalogInterest(interest: string): CatalogInterest | null {
  const normalized = normalizeInterestText(interest);
  return INTEREST_CATALOG.find((label) => normalizeInterestText(label) === normalized) ?? null;
}

export function catalogInterestsFromSelection(interests: string[] | undefined): CatalogInterest[] {
  const out: CatalogInterest[] = [];
  for (const interest of interests ?? []) {
    const label = resolveCatalogInterest(interest);
    if (label && !out.includes(label)) out.push(label);
  }
  return out;
}

export function buildQuickReplies(interests: string[] | undefined): string[] {
  const replies: string[] = [];
  for (const label of catalogInterestsFromSelection(interests)) {
    replies.push(...INTEREST_QUICK_REPLIES[label]);
    if (replies.length >= 3) break;
  }
  return replies.slice(0, 3);
}

export function buildFirstMessageTemplate(companionName: string, interests: string[] | undefined): string {
  const labels = catalogInterestsFromSelection(interests);
  const lower = (s: string) => s.toLocaleLowerCase('es-CL');
  if (labels.length >= 2) {
    const [i1, i2] = labels;
    return `¡Hola! Soy ${companionName}. Vi que te interesan ${lower(i1)} y ${lower(i2)}, así que tengo curiosidad: ¿qué es lo que más te gusta de ${lower(i1)}?`;
  }
  if (labels.length === 1) {
    const [i1] = labels;
    return `¡Hola! Soy ${companionName}. Vi que te interesa ${lower(i1)}. ¿Qué es lo que más te gusta de eso?`;
  }
  return `¡Hola! Soy ${companionName}. Me alegra conocerte. ¿Cómo estuvo tu día?`;
}
