// AUTO-SINCRONIZADO desde ejoiFE b20f6d62a97a0266796ebfb82e772f0961ed9136@b20f6d62a97a0266796ebfb82e772f0961ed9136:src/features/onboarding/utils/wizardPreviewCrumbs.ts. No editar: npm run sync:app
import type { TFunction } from 'i18next';
import { INTENSITY_OPTIONS } from '../data/companionIntensity';
import { ONBOARDING_STEPS } from '../constants/onboardingSteps';
import type { OnboardingData } from '../types';

export type WizardPreviewCrumb = {
  step: number;
  label: string;
};

/** Etiquetas del asistente v2, en orden de decisión (sin edad/etnia). */
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
    crumbs.push({ step: ONBOARDING_STEPS.persona, label: data.persona });
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
