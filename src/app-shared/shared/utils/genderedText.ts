// AUTO-SINCRONIZADO desde ejoiFE 9234854dc9f9992b39b7f61dfb0e02b768be467d@9234854dc9f9992b39b7f61dfb0e02b768be467d:src/shared/utils/genderedText.ts. No editar: npm run sync:app
/**
 * Utilidad para textos con género dinámico
 * Transforma textos según el género del compañero seleccionado
 */

import { Gender } from '@/features/onboarding/types';

export type GenderKey = Gender | '';

type GenderedTraitVariants = Record<Gender, string>;

/**
 * Diccionario de términos con variaciones de género
 */
const GENDERED_TERMS: Record<string, { femenino: string; masculino: string; neutro: string }> = {
  'compañer@': { femenino: 'compañera', masculino: 'compañero', neutro: 'compañere' },
  'compañero/a': { femenino: 'compañera', masculino: 'compañero', neutro: 'compañere' },
  'list@': { femenino: 'lista', masculino: 'listo', neutro: 'liste' },
  'listo/a': { femenino: 'lista', masculino: 'listo', neutro: 'liste' },
  'un/a': { femenino: 'una', masculino: 'un', neutro: 'une' },
  'el/la': { femenino: 'la', masculino: 'el', neutro: 'le' },
  'la/lo': { femenino: 'la', masculino: 'lo', neutro: 'le' },
  'tu': { femenino: 'tu', masculino: 'tu', neutro: 'tu' },
  'virtual': { femenino: 'virtual', masculino: 'virtual', neutro: 'virtual' },
};

const GENDERED_TRAITS: Record<string, GenderedTraitVariants> = {
  afectuoso: {
    femenino: 'Afectuosa',
    masculino: 'Afectuoso',
    neutro: 'Afectuose',
  },
  'claro y motivador': {
    femenino: 'Clara y motivadora',
    masculino: 'Claro y motivador',
    neutro: 'Clare y motivadore',
  },
  'poetico y cercano': {
    femenino: 'Po\u00e9tica y cercana',
    masculino: 'Po\u00e9tico y cercano',
    neutro: 'Po\u00e9tique y cercane',
  },
  entusiasta: {
    femenino: 'Entusiasta',
    masculino: 'Entusiasta',
    neutro: 'Entusiasta',
  },
  'profesional y sereno': {
    femenino: 'Profesional y serena',
    masculino: 'Profesional y sereno',
    neutro: 'Profesional y serene',
  },
  'tranquilo y cercano': {
    femenino: 'Tranquila y cercana',
    masculino: 'Tranquilo y cercano',
    neutro: 'Tranquile y cercane',
  },
  'calmo y analitico': {
    femenino: 'Calma y anal\u00edtica',
    masculino: 'Calmo y anal\u00edtico',
    neutro: 'Calme y anal\u00edtique',
  },
  'seguro y contenedor': {
    femenino: 'Segura y contenedora',
    masculino: 'Seguro y contenedor',
    neutro: 'Segure y contenedore',
  },
  'casual y relajado': {
    femenino: 'Casual y relajada',
    masculino: 'Casual y relajado',
    neutro: 'Casual y relajade',
  },
  'formal y profesional': {
    femenino: 'Formal y profesional',
    masculino: 'Formal y profesional',
    neutro: 'Formal y profesional',
  },
  'carinoso y cercano': {
    femenino: 'Cari\u00f1osa y cercana',
    masculino: 'Cari\u00f1oso y cercano',
    neutro: 'Cari\u00f1ose y cercane',
  },
  'divertido y jugueton': {
    femenino: 'Divertida y juguetona',
    masculino: 'Divertido y juguet\u00f3n',
    neutro: 'Divertide y juguetone',
  },
  'serio y directo': {
    femenino: 'Seria y directa',
    masculino: 'Serio y directo',
    neutro: 'Serie y directe',
  },
  'inspirador y positivo': {
    femenino: 'Inspiradora y positiva',
    masculino: 'Inspirador y positivo',
    neutro: 'Inspiradore y positive',
  },
  'coloquial y natural': {
    femenino: 'Coloquial y natural',
    masculino: 'Coloquial y natural',
    neutro: 'Coloquial y natural',
  },
  'elegante y sofisticado': {
    femenino: 'Elegante y sofisticada',
    masculino: 'Elegante y sofisticado',
    neutro: 'Elegante y sofisticade',
  },

  // --- Personalidades (persona). Las opciones se guardan en femenino como clave canónica. ---
  'amigable y empatica': {
    femenino: 'Amigable y empática',
    masculino: 'Amigable y empático',
    neutro: 'Amigable y empátique',
  },
  'divertida y desenfadada': {
    femenino: 'Divertida y desenfadada',
    masculino: 'Divertido y desenfadado',
    neutro: 'Divertide y desenfadade',
  },
  'inteligente y curiosa': {
    femenino: 'Inteligente y curiosa',
    masculino: 'Inteligente y curioso',
    neutro: 'Inteligente y curiose',
  },
  'carinosa y comprensiva': {
    femenino: 'Cariñosa y comprensiva',
    masculino: 'Cariñoso y comprensivo',
    neutro: 'Cariñose y comprensive',
  },
  'energetica y motivadora': {
    femenino: 'Energética y motivadora',
    masculino: 'Energético y motivador',
    neutro: 'Energétique y motivadore',
  },
  'tranquila y reflexiva': {
    femenino: 'Tranquila y reflexiva',
    masculino: 'Tranquilo y reflexivo',
    neutro: 'Tranquile y reflexive',
  },
  'analitica y logica': {
    femenino: 'Analítica y lógica',
    masculino: 'Analítico y lógico',
    neutro: 'Analítique y lógique',
  },
  'creativa y artistica': {
    femenino: 'Creativa y artística',
    masculino: 'Creativo y artístico',
    neutro: 'Creative y artístique',
  },

  // --- Estilos de interacción (presets de arquetipos, descriptores del companion). ---
  contenedor: {
    femenino: 'Contenedora',
    masculino: 'Contenedor',
    neutro: 'Contenedore',
  },
  'directo y estructurado': {
    femenino: 'Directa y estructurada',
    masculino: 'Directo y estructurado',
    neutro: 'Directe y estructurade',
  },
  reflexivo: {
    femenino: 'Reflexiva',
    masculino: 'Reflexivo',
    neutro: 'Reflexive',
  },
  motivador: {
    femenino: 'Motivadora',
    masculino: 'Motivador',
    neutro: 'Motivadore',
  },
  directo: {
    femenino: 'Directa',
    masculino: 'Directo',
    neutro: 'Directe',
  },
  practico: {
    femenino: 'Práctica',
    masculino: 'Práctico',
    neutro: 'Práctique',
  },
  profundo: {
    femenino: 'Profunda',
    masculino: 'Profundo',
    neutro: 'Profunde',
  },
  estable: {
    femenino: 'Estable',
    masculino: 'Estable',
    neutro: 'Estable',
  },

  // --- Estilos de interacción (onboarding manual). ---
  'conversacion profunda': {
    femenino: 'Conversación profunda',
    masculino: 'Conversación profunda',
    neutro: 'Conversación profunda',
  },
  'charla ligera y casual': {
    femenino: 'Charla ligera y casual',
    masculino: 'Charla ligera y casual',
    neutro: 'Charla ligera y casual',
  },
  'apoyo emocional': {
    femenino: 'Apoyo emocional',
    masculino: 'Apoyo emocional',
    neutro: 'Apoyo emocional',
  },
  'compania y entretenimiento': {
    femenino: 'Compañía y entretenimiento',
    masculino: 'Compañía y entretenimiento',
    neutro: 'Compañía y entretenimiento',
  },
  'aprendizaje y crecimiento': {
    femenino: 'Aprendizaje y crecimiento',
    masculino: 'Aprendizaje y crecimiento',
    neutro: 'Aprendizaje y crecimiento',
  },
  'motivacion y coaching': {
    femenino: 'Motivación y coaching',
    masculino: 'Motivación y coaching',
    neutro: 'Motivación y coaching',
  },
  'amistad y complicidad': {
    femenino: 'Amistad y complicidad',
    masculino: 'Amistad y complicidad',
    neutro: 'Amistad y complicidad',
  },
  'mentoria y guia': {
    femenino: 'Mentoría y guía',
    masculino: 'Mentoría y guía',
    neutro: 'Mentoría y guía',
  },

  // --- Profundidad de conversación (onboarding manual y arquetipos). ---
  'superficial y ligera': {
    femenino: 'Superficial y ligera',
    masculino: 'Superficial y ligero',
    neutro: 'Superficial y ligere',
  },
  'moderada y equilibrada': {
    femenino: 'Moderada y equilibrada',
    masculino: 'Moderado y equilibrado',
    neutro: 'Moderade y equilibrade',
  },
  'profunda y reflexiva': {
    femenino: 'Profunda y reflexiva',
    masculino: 'Profundo y reflexivo',
    neutro: 'Profunde y reflexive',
  },
  'muy profunda y filosofica': {
    femenino: 'Muy profunda y filosófica',
    masculino: 'Muy profundo y filosófico',
    neutro: 'Muy profunde y filosófique',
  },
  emocional: {
    femenino: 'Emocional',
    masculino: 'Emocional',
    neutro: 'Emocional',
  },
  medio: {
    femenino: 'Medio',
    masculino: 'Medio',
    neutro: 'Medio',
  },
  'ligero a medio': {
    femenino: 'Ligero a medio',
    masculino: 'Ligero a medio',
    neutro: 'Ligere a medio',
  },
  'medio a profundo': {
    femenino: 'Medio a profundo',
    masculino: 'Medio a profundo',
    neutro: 'Medio a profunde',
  },

  // --- Rasgos individuales (usados como fallback de "Más sobre mí"). ---
  empatica: {
    femenino: 'Empática',
    masculino: 'Empático',
    neutro: 'Empátique',
  },
  atenta: {
    femenino: 'Atenta',
    masculino: 'Atento',
    neutro: 'Atente',
  },
  reflexiva: {
    femenino: 'Reflexiva',
    masculino: 'Reflexivo',
    neutro: 'Reflexive',
  },
  divertida: {
    femenino: 'Divertida',
    masculino: 'Divertido',
    neutro: 'Divertide',
  },
  carinosa: {
    femenino: 'Cariñosa',
    masculino: 'Cariñoso',
    neutro: 'Cariñose',
  },
  aventurera: {
    femenino: 'Aventurera',
    masculino: 'Aventurero',
    neutro: 'Aventurere',
  },
};

const normalizeGenderedTraitKey = (value: string): string =>
  value
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');

const capitalizeFirstLetter = (value: string): string => {
  const trimmed = value.trim();
  if (!trimmed) return '';

  return `${trimmed.charAt(0).toUpperCase()}${trimmed.slice(1)}`;
};

/**
 * Reemplaza términos con @ o / por su variación de género
 * @param text - Texto con términos neutros (ej: "tu compañer@")
 * @param gender - Género seleccionado ('femenino' | 'masculino' | 'neutro' | '')
 * @returns Texto con género aplicado
 */
export const applyGender = (text: string, gender: GenderKey): string => {
  if (!gender) return text;
  
  let result = text;
  
  Object.entries(GENDERED_TERMS).forEach(([term, variants]) => {
    const regex = new RegExp(term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi');
    result = result.replace(regex, variants[gender]);
  });
  
  return result;
};

export const formatGenderedTrait = (value: string, gender: GenderKey): string => {
  const fallback = capitalizeFirstLetter(value);
  if (!fallback) return '';
  if (!gender) return fallback;

  const normalized = normalizeGenderedTraitKey(value);
  return GENDERED_TRAITS[normalized]?.[gender] ?? fallback;
};

/**
 * Genera el artículo correcto según el género
 * @param gender - Género del compañero
 * @param type - Tipo de artículo ('el' | 'un')
 */
export const getArticle = (gender: GenderKey, type: 'el' | 'un' = 'el'): string => {
  if (!gender) return type === 'el' ? 'el/la' : 'un/a';
  if (gender === 'neutro') return type === 'el' ? 'le' : 'une';
  return type === 'el' 
    ? (gender === 'femenino' ? 'la' : 'el')
    : (gender === 'femenino' ? 'una' : 'un');
};

/**
 * Genera "compañero" o "compañera" o "compañere" según el género
 */
export const getCompanionWord = (gender: GenderKey): string => {
  if (!gender) return 'compañer@';
  if (gender === 'neutro') return 'compañere';
  return gender === 'femenino' ? 'compañera' : 'compañero';
};

/**
 * Genera sufijo de género para adjetivos (-o/-a/-e)
 */
export const getGenderSuffix = (gender: GenderKey): string => {
  if (!gender) return '@';
  if (gender === 'neutro') return 'e';
  return gender === 'femenino' ? 'a' : 'o';
};

/**
 * Hook helper para crear textos con género
 * Retorna un objeto con funciones útiles para generar texto
 */
export const createGenderedTextHelper = (gender: GenderKey) => ({
  /** Aplica género a un texto con términos neutros */
  t: (text: string) => applyGender(text, gender),
  
  /** Obtiene el artículo correcto */
  article: (type: 'el' | 'un' = 'el') => getArticle(gender, type),
  
  /** Obtiene "compañero" o "compañera" o "compañere" */
  companion: () => getCompanionWord(gender),
  
  /** Obtiene el sufijo de género */
  suffix: () => getGenderSuffix(gender),
  trait: (value: string) => formatGenderedTrait(value, gender),
  
  /** El género actual */
  gender,
  
  /** Si hay un género seleccionado */
  hasGender: !!gender,
});
