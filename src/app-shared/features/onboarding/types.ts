// AUTO-SINCRONIZADO desde ejoiFE a1e61e3d072b6cc9e8b074adda33480eb1d3a1f2@a1e61e3d072b6cc9e8b074adda33480eb1d3a1f2:src/features/onboarding/types.ts. No editar: npm run sync:app
/**
 * Tipos para feature Onboarding
 */

export type VisualStyle = 'realista' | 'anime';
export type Gender = 'femenino' | 'masculino' | 'neutro';
export type CompanionArchetypeId =
  | 'hostess'
  | 'executive_female'
  | 'muse'
  | 'hype_friend'
  | 'executive_male'
  | 'craftsman'
  | 'intellectual'
  | 'protector';
export type CompanionIntensity = 'soft' | 'balanced' | 'intense';

export interface ArchetypePreset {
  persona: string;
  tone: string;
  interactionStyle: string;
  conversationDepth: string;
  interests: string[];
  boundaries: string[];
  description?: string;
  physicalRules?: string;
  psychologicalRules?: string;
}

export interface ArchetypeImagePreset {
  archetypePromptKey: CompanionArchetypeId;
  visualIdentity: string;
  environment: string;
  clothing: string;
  mood: string;
  composition: string;
  avoidances?: string[];
}

export interface CompanionArchetype {
  id: CompanionArchetypeId;
  label: string;
  subtitle?: string;
  gender: Gender;
  description: string;
  preset: ArchetypePreset;
  imagePreset: ArchetypeImagePreset;
}

export interface OnboardingData {
  visualStyle: VisualStyle | '';
  gender: Gender | '';
  persona: string;
  tone: string;
  interactionStyle: string;
  conversationDepth: string;
  interests: string[];
  boundaries: string[];
  companionName?: string;
  avatar?: string;
  ethnicity?: string;
  /** Color de cabello elegido (valor en español). Tiene prioridad sobre el implícito de la etnia. */
  hairColor?: string;
  description?: string;
  physicalRules?: string;
  psychologicalRules?: string;
  archetypeId?: CompanionArchetypeId;
  intensity?: CompanionIntensity;
  /** Edad aparente del companion (18–76). Se convierte a `dob` al crear. */
  age?: number;
}

