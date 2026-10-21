import type { TFunction } from 'i18next';

import { getIntensityConfig } from '@/features/onboarding/data/companionIntensity';
import type { CompanionIntensity, Gender } from '@/features/onboarding/types';
import { formatGenderedTrait } from '@/shared/utils/genderedText';
import { formatEthnicityByGender } from '@/shared/utils/ethnicityLabel';

import type { CompanionProfile } from '~/features/chat/useProfile';

export function intensityLabelFromProfile(intensity?: string | null): string {
  const id: CompanionIntensity =
    intensity === 'soft' || intensity === 'intense' || intensity === 'balanced' ? intensity : 'balanced';
  return getIntensityConfig(id).label;
}

export function buildCharacterAttributes(profile: CompanionProfile | null | undefined): string[] {
  if (!profile) return [];
  const genderKey = (profile.gender || '') as Gender;
  const attrs: string[] = [];
  if (profile.persona?.trim()) {
    attrs.push(formatGenderedTrait(profile.persona, genderKey));
  }
  if (profile.intensity) {
    attrs.push(intensityLabelFromProfile(profile.intensity));
  }
  return attrs;
}

export type PhysicalAttribute = { label: string; color?: string };

export function buildPhysicalAttributes(
  profile: CompanionProfile | null | undefined,
  t: TFunction,
): PhysicalAttribute[] {
  if (!profile) return [];
  const attrs: PhysicalAttribute[] = [];

  if (profile.visualStyle) {
    attrs.push({
      label:
        profile.visualStyle === 'realista'
          ? t('home.profile.physical_realistic')
          : t('home.profile.physical_anime'),
    });
  }

  if (profile.gender) {
    attrs.push({
      label:
        profile.gender === 'femenino'
          ? t('home.profile.gender_feminine')
          : profile.gender === 'neutro'
            ? t('home.profile.gender_neutral')
            : t('home.profile.gender_masculine'),
    });
  }

  const formattedEthnicity = formatEthnicityByGender(profile.ethnicity ?? undefined, profile.gender);
  if (formattedEthnicity) {
    attrs.push({ label: t('home.profile.ethnicity_prefix', { value: formattedEthnicity }) });
  }

  if (typeof profile.age === 'number') {
    attrs.push({ label: t('home.profile.age_prefix', { age: profile.age }) });
  }

  const hair = profile.hairColor?.trim();
  if (hair) {
    attrs.push({ label: hair });
  }

  return attrs;
}
