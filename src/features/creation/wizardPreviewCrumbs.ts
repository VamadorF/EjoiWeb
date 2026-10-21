import type { TFunction } from 'i18next';
import { INTENSITY_OPTIONS } from '@/features/onboarding/data/companionIntensity';
import { ONBOARDING_STEPS } from '@/features/onboarding/constants/onboardingSteps';
import type { OnboardingData } from '@/features/onboarding/types';

import { formatGenderedTrait } from '@/shared/utils/genderedText';

export type WizardPreviewCrumb = {
  step: number;
  label: string;
};

export function buildWizardV2PreviewCrumbs(
  data: OnboardingData,
  t: TFunction,
): WizardPreviewCrumb[] {
  const crumbs: WizardPreviewCrumb[] = [];

  if (data.gender) {
    crumbs.push({
      step: ONBOARDING_STEPS.gender,
      label: t(`onboarding.preview.gender_${data.gender}`),
    });
  }
  if (data.persona) {
    crumbs.push({
      step: ONBOARDING_STEPS.persona,
      label: formatGenderedTrait(data.persona, data.gender),
    });
  }
  if (data.visualStyle) {
    crumbs.push({
      step: ONBOARDING_STEPS.visualStyle,
      label: t(`onboarding.preview.style_${data.visualStyle}`),
    });
  }
  if (data.intensity) {
    const intensityLabel = INTENSITY_OPTIONS.find((o) => o.id === data.intensity)?.label;
    if (intensityLabel) {
      crumbs.push({ step: ONBOARDING_STEPS.intensity, label: intensityLabel });
    }
  }
  if (data.interests.length > 0) {
    crumbs.push({
      step: ONBOARDING_STEPS.interests,
      label:
        data.interests.length >= 3
          ? t('onboarding.v2.preview_interests_count', { count: data.interests.length })
          : data.interests.join(', '),
    });
  }

  return crumbs;
}
