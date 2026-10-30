import { toPatchCompanionDto } from '@/features/companion/adapters/companion.adapter';
import type { UpdateCompanionRequest } from '@/features/companion/types';
import { getIntensityConfig } from '@/features/onboarding/data/companionIntensity';
import type { CompanionIntensity, Gender, VisualStyle } from '@/features/onboarding/types';
import { ageToDob } from '@/shared/utils/ageToDob';
import { COMPANION_MAX_AGE, COMPANION_MIN_AGE } from '@/features/onboarding/constants/onboardingSteps';

import { DEFAULT_HAIR_COLOR } from '~/theme/hairSwatches';
import { ENABLE_AGE, ENABLE_ETHNICITY } from '~/platform/env';

import type { CompanionProfile } from '~/features/chat/useProfile';
import { toPersistedAvatarUrl } from '~/features/companion/avatarUrl';

export type EditConversationalSection = 'personality' | 'presence' | 'interests' | 'boundaries' | 'voice';

export type EditFormSnapshot = {
  companionName: string;
  visualStyle: VisualStyle;
  gender: Gender;
  ethnicity?: string;
  hairColor?: string;
  age: number;
  persona: string;
  intensity: CompanionIntensity;
  interests: string[];
  boundaries: string[];
  voiceKey: string;
};

export const DEFAULT_EDIT_AGE = 25;

export function profileToEditForm(profile: CompanionProfile): EditFormSnapshot {
  const age =
    typeof profile.age === 'number' && profile.age >= COMPANION_MIN_AGE && profile.age <= COMPANION_MAX_AGE
      ? profile.age
      : DEFAULT_EDIT_AGE;

  return {
    companionName: profile.name?.trim() ?? '',
    visualStyle: profile.visualStyle === 'anime' ? 'anime' : 'realista',
    gender:
      profile.gender === 'masculino' || profile.gender === 'neutro' ? profile.gender : 'femenino',
    ethnicity: profile.ethnicity?.trim() || undefined,
    hairColor: profile.hairColor?.trim() || DEFAULT_HAIR_COLOR,
    age,
    persona: profile.persona?.trim() ?? '',
    intensity:
      profile.intensity === 'soft' || profile.intensity === 'intense' ? profile.intensity : 'balanced',
    interests: [...(profile.interests ?? [])],
    boundaries: [...(profile.boundaries ?? [])],
    voiceKey: (profile.voiceKey?.trim() || 'NORAH').toUpperCase(),
  };
}

export function hasAppearanceChanges(baseline: EditFormSnapshot, current: EditFormSnapshot): boolean {
  if (baseline.visualStyle !== current.visualStyle) return true;
  if (baseline.gender !== current.gender) return true;
  if (ENABLE_ETHNICITY && (baseline.ethnicity ?? '') !== (current.ethnicity ?? '')) return true;
  if (ENABLE_AGE && baseline.age !== current.age) return true;
  if ((baseline.hairColor ?? '') !== (current.hairColor ?? '')) return true;
  return false;
}

/** Solo cambió el color de cabello: el retrato se edita en vez de regenerarse (SCRUM-192). */
export function isHairOnlyChange(baseline: EditFormSnapshot, current: EditFormSnapshot): boolean {
  if ((baseline.hairColor ?? '') === (current.hairColor ?? '')) return false;
  return !hasAppearanceChanges(baseline, { ...current, hairColor: baseline.hairColor });
}

export function hasConversationalChanges(baseline: EditFormSnapshot, current: EditFormSnapshot): boolean {
  if (baseline.companionName !== current.companionName) return true;
  if (baseline.persona !== current.persona) return true;
  if (baseline.intensity !== current.intensity) return true;
  if (baseline.voiceKey !== current.voiceKey) return true;
  if (baseline.interests.join('|') !== current.interests.join('|')) return true;
  if (baseline.boundaries.join('|') !== current.boundaries.join('|')) return true;
  return false;
}

function arraysEqual(a: string[], b: string[]): boolean {
  return a.length === b.length && a.every((value, index) => value === b[index]);
}

/** Cuerpo PATCH solo con campos conversacionales que cambiaron (C14). */
export function buildConversationalPatchBody(
  baseline: EditFormSnapshot,
  current: EditFormSnapshot,
): Record<string, unknown> {
  const partial: UpdateCompanionRequest = {};

  if (baseline.companionName !== current.companionName) {
    partial.name = current.companionName.trim();
  }
  if (baseline.persona !== current.persona) {
    partial.persona = current.persona;
  }
  if (!arraysEqual(baseline.interests, current.interests)) {
    partial.interests = [...current.interests];
  }
  if (!arraysEqual(baseline.boundaries, current.boundaries)) {
    partial.boundaries = [...current.boundaries];
  }

  const body: Record<string, unknown> = { ...toPatchCompanionDto(partial) };

  if (baseline.intensity !== current.intensity) {
    const config = getIntensityConfig(current.intensity);
    body.intensity = config.id;
    if (config.psychologicalRule) {
      body.intensityRule = config.psychologicalRule;
    }
  }
  if (baseline.voiceKey !== current.voiceKey) {
    body.voiceKey = current.voiceKey.toUpperCase();
  }

  return body;
}

/** Cuerpo PATCH de apariencia (+ avatar opcional) para aplicar tras regeneración. */
export function buildAppearancePatchBody(
  baseline: EditFormSnapshot,
  current: EditFormSnapshot,
  avatar?: { fileUrl: string; storagePath?: string },
): Record<string, unknown> {
  const partial: UpdateCompanionRequest = {};

  if (baseline.visualStyle !== current.visualStyle) {
    partial.visualStyle = current.visualStyle;
  }
  if (baseline.gender !== current.gender) {
    partial.gender = current.gender;
  }
  if (ENABLE_ETHNICITY && (baseline.ethnicity ?? '') !== (current.ethnicity ?? '')) {
    partial.ethnicity = current.ethnicity?.trim() || '';
  }
  if (ENABLE_AGE && baseline.age !== current.age) {
    partial.dob = ageToDob(current.age);
  }

  if (avatar) {
    partial.avatarUrl = toPersistedAvatarUrl(avatar.fileUrl);
    if (avatar.storagePath) {
      partial.avatarStoragePath = avatar.storagePath;
    }
  }

  const body: Record<string, unknown> = { ...toPatchCompanionDto(partial) };
  if ((baseline.hairColor ?? '') !== (current.hairColor ?? '')) {
    body.hairColor = (current.hairColor ?? '').trim();
  }

  return body;
}

/** PATCH de una sección conversacional (sin regenerar retrato). */
export function buildConversationalSectionPatchBody(
  baseline: EditFormSnapshot,
  current: EditFormSnapshot,
  section: EditConversationalSection,
): Record<string, unknown> {
  const full = buildConversationalPatchBody(baseline, current);
  const allowed: Record<EditConversationalSection, string[]> = {
    personality: ['name', 'persona'],
    presence: ['intensity', 'intensityRule'],
    interests: ['interests'],
    boundaries: ['boundaries'],
    voice: ['voiceKey'],
  };
  const keys = new Set(allowed[section]);
  return Object.fromEntries(Object.entries(full).filter(([key]) => keys.has(key)));
}

/**
 * Color de cabello para el prompt del retrato (SCRUM-192). Si el perfil nunca guardó color y el usuario
 * no lo cambió, el formulario muestra el valor por defecto: no se fuerza en la imagen.
 */
export function resolvePromptHairColor(
  baseline: EditFormSnapshot,
  current: EditFormSnapshot,
  profile: Pick<CompanionProfile, 'hairColor'> | null,
): string | undefined {
  if (profile?.hairColor?.trim() || (baseline.hairColor ?? '') !== (current.hairColor ?? '')) {
    return current.hairColor;
  }
  return undefined;
}

export function editFormToOnboardingData(form: EditFormSnapshot, hairColor?: string) {
  return {
    visualStyle: form.visualStyle,
    gender: form.gender,
    persona: form.persona,
    tone: '',
    interactionStyle: '',
    conversationDepth: '',
    interests: [...form.interests],
    boundaries: [...form.boundaries],
    companionName: form.companionName,
    ethnicity: form.ethnicity,
    hairColor,
    age: form.age,
    intensity: form.intensity,
  };
}

export function toProfilePanelDraft(form: EditFormSnapshot) {
  return {
    companionName: form.companionName,
    persona: form.persona,
    intensity: form.intensity,
    interests: form.interests,
    boundaries: form.boundaries,
    visualStyle: form.visualStyle,
    gender: form.gender,
    ethnicity: form.ethnicity,
    hairColor: form.hairColor,
    age: form.age,
  };
}
