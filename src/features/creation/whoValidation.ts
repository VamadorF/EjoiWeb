import type { OnboardingData } from '@/features/onboarding/types';

export const WHO_MISSING_LABELS = {
  gender: 'género',
  visualStyle: 'estilo visual',
  interests: 'al menos 3 intereses',
} as const;

export function listWhoMissing(
  data: Pick<OnboardingData, 'gender' | 'visualStyle' | 'interests'>,
): string[] {
  const missing: string[] = [];
  if (!data.gender) missing.push(WHO_MISSING_LABELS.gender);
  if (!data.visualStyle) missing.push(WHO_MISSING_LABELS.visualStyle);
  if (data.interests.length < 3) missing.push(WHO_MISSING_LABELS.interests);
  return missing;
}

export function canContinueWho(
  data: Pick<OnboardingData, 'gender' | 'visualStyle' | 'interests'>,
): boolean {
  return listWhoMissing(data).length === 0;
}

export type PreviewTag = { id: string; label: string };

const GENDER_LABELS: Record<string, string> = {
  femenino: 'Femenino',
  masculino: 'Masculino',
  neutro: 'Neutro',
};

const STYLE_LABELS: Record<string, string> = {
  realista: 'Realista',
  anime: 'Ilustrado',
};

function resolvePreviewTag(id: string, data: OnboardingData): PreviewTag | null {
  if (id === 'gender' && data.gender) {
    return { id, label: GENDER_LABELS[data.gender] ?? data.gender };
  }
  if (id === 'style' && data.visualStyle) {
    return { id, label: STYLE_LABELS[data.visualStyle] ?? data.visualStyle };
  }
  if (id.startsWith('interest:')) {
    const interest = id.slice('interest:'.length);
    if (data.interests.includes(interest)) return { id, label: interest };
  }
  if (id === 'ethnicity' && data.ethnicity?.trim()) {
    return { id, label: data.ethnicity.trim() };
  }
  if (id === 'age' && typeof data.age === 'number') {
    return { id, label: `${data.age} años` };
  }
  return null;
}

export function buildPreviewTags(data: OnboardingData, tagTimeline: string[]): PreviewTag[] {
  return tagTimeline.flatMap((id) => {
    const tag = resolvePreviewTag(id, data);
    return tag ? [tag] : [];
  });
}

export function upsertTimelineId(timeline: string[], id: string): string[] {
  const without = timeline.filter((entry) => entry !== id);
  return [...without, id];
}

export function removeTimelineId(timeline: string[], id: string): string[] {
  return timeline.filter((entry) => entry !== id);
}
