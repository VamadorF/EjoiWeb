// AUTO-SINCRONIZADO desde ejoiFE b20f6d62a97a0266796ebfb82e772f0961ed9136@b20f6d62a97a0266796ebfb82e772f0961ed9136:src/shared/utils/companionImagePrompt.ts. No editar: npm run sync:app
/**
 * Generador de prompts para gpt-image-1 basado en datos del onboarding.
 *
 * Este archivo es el orquestador publico: selecciona el estilo visual y arma
 * el prompt final con composicion, anatomia, personalidad, fondo y arquetipo.
 */
import { getArchetypeById } from '../../features/onboarding/data/companionArchetypes';
import { getIntensityConfig } from '../../features/onboarding/data/companionIntensity';
import type { CompanionArchetypeId, OnboardingData, VisualStyle } from '../../features/onboarding/types';
import { getCompanionAge, logCompanionAge } from './companionAgeAppearance';
import {
  ANIME_ANATOMY_RULES,
  ANIME_ARCHETYPE_COMPOSITION_RULES,
  ANIME_COMPOSITION_RULES,
  ANIME_DEFAULT_BACKGROUND,
  ANIME_IMAGE_STYLE_CONFIG,
  ANIME_INTEREST_TO_BACKGROUND,
  ANIME_MODE_TO_PROMPT,
  ANIME_TONE_TO_VISUAL,
} from './companionImagePrompt.anime';
import {
  REALISTA_IMAGE_STYLE_CONFIG,
  REALISTIC_ANATOMY_RULES,
  REALISTIC_ARCHETYPE_COMPOSITION_RULES,
  REALISTIC_COMPOSITION_RULES,
  REALISTIC_DEFAULT_BACKGROUND,
  REALISTIC_INTEREST_TO_BACKGROUND,
  REALISTIC_MODE_TO_PROMPT,
  REALISTIC_TONE_TO_VISUAL,
} from './companionImagePrompt.realista';

const MAX_IMAGE_PROMPT_LENGTH = 4000;
const PROMPT_SAFETY_SUFFIX = ' No text. No logos. No collage. One person only.';

export type CompanionImagePromptMode = 'avatar' | 'send_pic';

export type ArchetypeStylePrompt = {
  identity: string;
  scene: string;
  wardrobe: string;
  props: string;
  mood: string;
  composition: string;
  avoidances: string[];
};

export type CompanionImageStyleConfig = {
  buildPrompt: (gender: string, ethnicity: string, toneKey?: string, age?: number) => string;
  avoidances: string;
  quality: string;
  archetypePrompts: Partial<Record<CompanionArchetypeId, ArchetypeStylePrompt>>;
};

type PromptStyleRules = {
  styleConfig: CompanionImageStyleConfig;
  compositionRules: string;
  archetypeCompositionRules: string;
  anatomyRules: string;
  toneToVisual: Record<string, string>;
  interestToBackground: Record<string, string>;
  defaultBackground: string;
  modeToPrompt: Record<CompanionImagePromptMode, string>;
};

const PROMPT_RULES_BY_STYLE: Record<VisualStyle, PromptStyleRules> = {
  realista: {
    styleConfig: REALISTA_IMAGE_STYLE_CONFIG,
    compositionRules: REALISTIC_COMPOSITION_RULES,
    archetypeCompositionRules: REALISTIC_ARCHETYPE_COMPOSITION_RULES,
    anatomyRules: REALISTIC_ANATOMY_RULES,
    toneToVisual: REALISTIC_TONE_TO_VISUAL,
    interestToBackground: REALISTIC_INTEREST_TO_BACKGROUND,
    defaultBackground: REALISTIC_DEFAULT_BACKGROUND,
    modeToPrompt: REALISTIC_MODE_TO_PROMPT,
  },
  anime: {
    styleConfig: ANIME_IMAGE_STYLE_CONFIG,
    compositionRules: ANIME_COMPOSITION_RULES,
    archetypeCompositionRules: ANIME_ARCHETYPE_COMPOSITION_RULES,
    anatomyRules: ANIME_ANATOMY_RULES,
    toneToVisual: ANIME_TONE_TO_VISUAL,
    interestToBackground: ANIME_INTEREST_TO_BACKGROUND,
    defaultBackground: ANIME_DEFAULT_BACKGROUND,
    modeToPrompt: ANIME_MODE_TO_PROMPT,
  },
};

function getPromptRules(styleKey: VisualStyle): PromptStyleRules {
  return PROMPT_RULES_BY_STYLE[styleKey] ?? PROMPT_RULES_BY_STYLE.realista;
}

function clampImagePrompt(prompt: string): string {
  if (prompt.length <= MAX_IMAGE_PROMPT_LENGTH) return prompt;

  const maxBodyLength = MAX_IMAGE_PROMPT_LENGTH - PROMPT_SAFETY_SUFFIX.length;
  const trimmedBody = prompt.slice(0, maxBodyLength).trimEnd();
  const lastSentenceEnd = Math.max(
    trimmedBody.lastIndexOf('.'),
    trimmedBody.lastIndexOf(';'),
  );
  const body = lastSentenceEnd > 3000
    ? trimmedBody.slice(0, lastSentenceEnd + 1)
    : trimmedBody;

  return `${body}${PROMPT_SAFETY_SUFFIX}`.slice(0, MAX_IMAGE_PROMPT_LENGTH);
}

const GENDER_TO_ENGLISH: Record<string, string> = {
  femenino: 'woman',
  masculino: 'man',
  neutro: 'androgynous person',
};

const UNIVERSAL_AVOIDANCES = [
  'No duplicate faces.',
  'No extra eyes.',
  'No malformed eyes.',
  'No asymmetrical facial distortion.',
  'No warped anatomy.',
  'No distorted shoulders.',
  'No elongated neck.',
  'No extra limbs.',
  'No cropped extra body parts.',
  'No framing marks.',
  'No guide lines.',
  'No crop marks.',
  'No UI elements.',
  'No interface overlay.',
  'No white bars.',
  'No text.',
  'No collage.',
  'No side panels.',
].join(' ');

const ETHNICITY_TO_DESCRIPTION: Record<string, string> = {
  Latina: 'This person is Latin American with warm olive to brown skin, dark brown or black hair, and natural Latin American facial features. The skin tone should be visibly olive or tan, not pale.',
  'Caucásica': 'This person is Caucasian/European with light or fair skin, light to medium colored hair, and natural European facial features.',
  Afrodescendiente: 'This person is Black/of African descent with deep dark brown or rich dark skin tone, natural Black textured hair such as afro, coils, locs, or braids, and natural African facial features. The skin tone should be visibly dark brown or deep brown, not light or medium.',
  'Asiática': 'This person is East Asian with light to medium skin tone, dark straight black hair, and natural East Asian facial features such as monolid or hooded eyes.',
  Árabe: 'This person is Arab/Middle Eastern with olive to tan skin tone, dark hair, and natural Middle Eastern facial features. The skin tone should be visibly olive or tan.',
  India: 'This person is South Asian/Indian with medium to deep brown skin tone, dark black hair, and natural South Asian facial features. The skin tone should be visibly brown, not pale.',
  Mixta: 'This person is mixed-race with ambiguous ethnic features, warm medium skin tone, and a natural blend of facial features from multiple ethnicities.',
};

const PERSONA_TO_VISUAL: Record<string, string> = {
  friendly:     'with a warm relaxed smile, approachable, candid expression',
  professional: 'with a calm natural expression, composed but not posed, relaxed confidence',
  playful:      'with a genuine candid laugh, not exaggerated, naturally caught mid-moment',
  calm:         'with a soft thoughtful expression, natural gaze, quietly at ease',
  energetic:    'with a lively expression, natural and spontaneous, caught in an unscripted moment',
  'Amigable y empática': 'with a warm relaxed smile, approachable, candid expression',
  'Divertida y desenfadada': 'with a genuine candid laugh, not exaggerated, naturally caught mid-moment',
  'Inteligente y curiosa': 'with an alert thoughtful expression, curious gaze, and natural focus',
  'Cariñosa y comprensiva': 'with a gentle caring expression, soft gaze, and emotionally warm presence',
  'Energética y motivadora': 'with a lively expression, natural and spontaneous, caught in an unscripted moment',
  'Tranquila y reflexiva': 'with a soft thoughtful expression, natural gaze, quietly at ease',
  'Analítica y lógica': 'with a calm focused expression, composed but not posed, relaxed confidence',
  'Creativa y artística': 'with an expressive imaginative look, relaxed warmth, and natural curiosity',
};

const INTEREST_PRIORITY: Record<string, number> = {
  Tecnología: 3,
  'Arte y cultura': 5,
  Ciencia: 3,
  Deportes: 3,
  Música: 4,
  Literatura: 4,
  'Cine y series': 4,
  Viajes: 4,
  Cocina: 3,
  Filosofía: 3,
  Psicología: 3,
  Historia: 3,
  Negocios: 3,
  'Salud y bienestar': 4,
  'Moda y estilo': 4,
};

function buildContextFromInterests(interests: string[], styleKey: VisualStyle): string {
  const { defaultBackground, interestToBackground } = getPromptRules(styleKey);

  if (!interests.length) return defaultBackground;

  let topInterest = '';
  let topWeight = -1;

  for (const interest of interests) {
    const weight = INTEREST_PRIORITY[interest] ?? 1;
    if (weight > topWeight) {
      topWeight = weight;
      topInterest = interest;
    }
  }

  return interestToBackground[topInterest] ?? defaultBackground;
}

function buildArchetypeVisualDetails(
  onboardingData: OnboardingData,
  styleConfig: CompanionImageStyleConfig,
): string | null {
  const archetype = getArchetypeById(onboardingData.archetypeId);
  if (!archetype) return null;

  const intensityConfig = getIntensityConfig(onboardingData.intensity);
  const stylePrompt = styleConfig.archetypePrompts[archetype.id];

  if (!stylePrompt) return null;

  const sections = [
    `Archetype visual identity: ${stylePrompt.identity}.`,
    `Archetype scene replaces the interest-based background for this image: ${stylePrompt.scene}.`,
    `Archetype wardrobe has priority over generic clothing guidance: ${stylePrompt.wardrobe}.`,
    stylePrompt.props ? `Allowed archetype props: ${stylePrompt.props}.` : '',
    `Archetype mood: ${stylePrompt.mood}.`,
    `Archetype composition: ${stylePrompt.composition}.`,
    `Companion intensity: ${intensityConfig.visual}.`,
    ...stylePrompt.avoidances,
  ];

  return clampImagePrompt(sections.filter(Boolean).join(' '));
}

/**
 * Genera un prompt basado en los datos del companion.
 * Retorna un solo string — gpt-image-1 no tiene parámetro de negative prompt,
 * las instrucciones de qué evitar van directamente en el prompt.
 *
 * Uso recomendado:
 * - generateCompanionImagePrompt(onboardingData, 'avatar') para imagen base/perfil.
 * - generateCompanionImagePrompt(onboardingData, 'send_pic') para una foto espontanea del companion.
 */
export function generateCompanionImagePrompt(onboardingData: OnboardingData, mode: CompanionImagePromptMode = 'avatar'): string {
  const gender = GENDER_TO_ENGLISH[onboardingData.gender as string] || 'person';
  const styleKey: VisualStyle = onboardingData.visualStyle === 'anime' ? 'anime' : 'realista';
  const promptRules = getPromptRules(styleKey);
  const { styleConfig } = promptRules;

  const ethnicityDesc = ETHNICITY_TO_DESCRIPTION[onboardingData.ethnicity || ''] || '';

  const personaKey = onboardingData.persona || 'friendly';
  const toneKey = onboardingData.tone || 'warm';
  const personaVisual = PERSONA_TO_VISUAL[personaKey] ?? PERSONA_TO_VISUAL.friendly;
  const toneVisual = promptRules.toneToVisual[toneKey] ?? promptRules.toneToVisual.warm;

  const interests = onboardingData.interests ?? [];
  const age = getCompanionAge(onboardingData);
  logCompanionAge('CompanionImagePrompt.build', onboardingData, {
    visualStyle: styleKey,
    mode,
    gender: onboardingData.gender,
  });
  const archetypeVisualDetails = buildArchetypeVisualDetails(onboardingData, styleConfig);
  const compositionRules = archetypeVisualDetails
    ? promptRules.archetypeCompositionRules
    : promptRules.compositionRules;
  const background = archetypeVisualDetails ? '' : buildContextFromInterests(interests, styleKey);
  const modeInstruction = promptRules.modeToPrompt[mode] ?? promptRules.modeToPrompt.avatar;

  const sections = [
    'Generate one finished image only.',
    compositionRules,
    promptRules.anatomyRules,
    styleConfig.buildPrompt(gender, ethnicityDesc, toneKey, age),
    `The person is ${personaVisual}.`,
    toneVisual,
    background,
    archetypeVisualDetails,
    modeInstruction,
    styleConfig.quality,
    UNIVERSAL_AVOIDANCES,
    styleConfig.avoidances,
  ];

  return clampImagePrompt(sections.filter(Boolean).join(' '));
}
