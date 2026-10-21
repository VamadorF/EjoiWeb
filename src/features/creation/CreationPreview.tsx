import { useTranslation } from 'react-i18next';

import type { Gender, OnboardingData } from '@/features/onboarding/types';

import { useGenderedTextWith } from '~/features/gender/useGenderedText';

import { stylePortraitSrc, stylePortraitSrcForCard } from './portraits';
import { buildWizardV2PreviewCrumbs } from './wizardPreviewCrumbs';
import { wizardPathForStep } from './wizardSteps';

import './CreationPreview.css';

export type CreationPreviewProps = {
  data: OnboardingData;
  currentStep: number;
  companionName?: string;
  greeting?: string | null;
  showGreetingPreview?: boolean;
  onNavigateToStep?: (step: number) => void;
};

function cardPortraitGender(gender?: Gender): 'femenino' | 'masculino' {
  return gender === 'masculino' ? 'masculino' : 'femenino';
}

function PreviewEmptyState({ gender }: { gender?: Gender }) {
  const { t } = useTranslation('web');
  const g = cardPortraitGender(gender);
  return (
    <div className="creation-preview__empty" data-testid="creation-preview-empty">
      <div className="creation-preview__empty-portraits" aria-hidden="true">
        <img
          className="creation-preview__empty-portrait"
          src={stylePortraitSrcForCard('realista', g)}
          alt=""
        />
        <img
          className="creation-preview__empty-portrait"
          src={stylePortraitSrcForCard('anime', g)}
          alt=""
        />
      </div>
      <p className="creation-preview__empty-text">{t('wizard.preview_empty')}</p>
    </div>
  );
}

export function CreationPreview({
  data,
  companionName,
  greeting,
  showGreetingPreview = false,
}: CreationPreviewProps) {
  const { t } = useTranslation();
  const { t: tWeb } = useTranslation('web');
  const gendered = useGenderedTextWith(data.gender);
  const portraitSrc = stylePortraitSrc(data.visualStyle, data.gender);
  const displayName = companionName?.trim() || data.companionName?.trim();
  const previewTitle = gendered.tg('onboarding.v2.preview_title');

  return (
    <article className="creation-preview-shell card" data-testid="creation-preview-card">
      <h2 className="creation-preview-shell__title">{previewTitle}</h2>
      <div className="creation-preview">
        {portraitSrc ? (
          <div className="creation-preview__portrait-wrap">
            <img
              className="avatar avatar--96 creation-preview__portrait"
              src={portraitSrc}
              alt=""
              data-testid="creation-portrait"
            />
          </div>
        ) : data.gender ? (
          <PreviewEmptyState gender={data.gender} />
        ) : null}
        {displayName ? (
          <p className="creation-preview__name">{displayName}</p>
        ) : null}
        {showGreetingPreview ? (
          <div className="creation-preview__card" data-testid="creation-preview-greeting">
            <p className="label creation-preview__card-label">{tWeb('create.preview_card')}</p>
            {greeting ? (
              <p className="bubble--ai creation-preview__greeting">{greeting}</p>
            ) : displayName ? (
              <p className="bubble--ai creation-preview__greeting">
                {t('onboarding.v2.greeting_preview', { name: displayName })}
              </p>
            ) : null}
          </div>
        ) : null}
      </div>
    </article>
  );
}

/** Tags de lo ya elegido. En desktop van bajo la barra de progreso. */
export function WizardChoicePills({
  data,
  currentStep,
  onNavigateToStep,
}: Pick<CreationPreviewProps, 'data' | 'currentStep' | 'onNavigateToStep'>) {
  const { t } = useTranslation();
  const crumbs = buildWizardV2PreviewCrumbs(data, t);
  const lastCrumbStep = crumbs.length > 0 ? crumbs[crumbs.length - 1]!.step : null;

  if (crumbs.length === 0) return null;

  return (
    <ul className="creation-shell-header__crumbs" data-testid="wizard-choice-pills">
      {crumbs.map((crumb) => {
        const isLast = crumb.step === lastCrumbStep;
        const canNav = crumb.step < currentStep && onNavigateToStep;
        return (
          <li key={crumb.step}>
            {canNav ? (
              <button
                type="button"
                className={
                  isLast
                    ? 'pill pill--last creation-preview__crumb-btn'
                    : 'pill creation-preview__crumb-btn'
                }
                onClick={() => onNavigateToStep(crumb.step)}
                aria-label={t('onboarding.v2.preview_crumb_a11y', { label: crumb.label })}
              >
                {crumb.label}
              </button>
            ) : (
              <span className={isLast ? 'pill pill--last' : 'pill'} aria-current={isLast ? 'step' : undefined}>
                {crumb.label}
              </span>
            )}
          </li>
        );
      })}
    </ul>
  );
}

/** Migas compactas para franja móvil (< 1024). */
export function CreationPreviewCrumbsStrip({
  data,
  currentStep,
  onNavigateToStep,
}: Pick<CreationPreviewProps, 'data' | 'currentStep' | 'onNavigateToStep'>) {
  const { t } = useTranslation();
  const portraitSrc = stylePortraitSrc(data.visualStyle, data.gender);
  const crumbs = buildWizardV2PreviewCrumbs(data, t);
  const lastCrumbStep = crumbs.length > 0 ? crumbs[crumbs.length - 1]!.step : null;

  if (!data.gender) return null;

  return (
    <div className="creation-preview-strip" data-testid="creation-preview-strip">
      {portraitSrc ? (
        <img className="avatar avatar--48 creation-preview-strip__avatar" src={portraitSrc} alt="" />
      ) : null}
      <ul className="creation-preview-strip__crumbs">
        {crumbs.map((crumb) => {
          const isLast = crumb.step === lastCrumbStep;
          const canNav = crumb.step < currentStep && onNavigateToStep;
          return (
            <li key={crumb.step}>
              {canNav ? (
                <button
                  type="button"
                  className={isLast ? 'pill pill--last' : 'pill'}
                  onClick={() => onNavigateToStep(crumb.step)}
                >
                  {crumb.label}
                </button>
              ) : (
                <span className={isLast ? 'pill pill--last' : 'pill'}>{crumb.label}</span>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}

export { wizardPathForStep };
