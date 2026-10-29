import { useEffect, useId, useMemo, useRef, useState, type ReactNode } from 'react';
import type { TFunction } from 'i18next';
import { useTranslation } from 'react-i18next';
import { Navigate, useNavigate, useParams, useSearchParams } from 'react-router';

import {
  BASIC_BOUNDARIES,
  BOUNDARY_OPTIONS,
} from '@/features/onboarding/data/boundaryOptions';
import { INTENSITY_OPTIONS } from '@/features/onboarding/data/companionIntensity';
import { getRandomCompanionName } from '@/features/onboarding/data/getRandomCompanionName';
import { INTEREST_OPTIONS, INTEREST_OPTION_ICONS } from '@/features/onboarding/data/interestOptions';
import {
  PERSONALITY_OPTION_ICONS,
  PERSONALITY_OPTIONS,
} from '@/features/onboarding/data/personalityOptions';
import { ONBOARDING_STEPS } from '@/features/onboarding/constants/onboardingSteps';
import type { CompanionIntensity, Gender, VisualStyle } from '@/features/onboarding/types';
import { validators } from '@/shared/utils/validators';

import { AppIcon } from '~/components/AppIcon';
import { logoutWeb } from '~/features/auth/api/auth.api';
import { useWebSession } from '~/features/auth/useWebSession';
import { CreationPreviewCrumbsStrip, WizardChoicePills } from '~/features/creation/CreationPreview';
import { useGenderedTextWith } from '~/features/gender/useGenderedText';
import { useCreationDraft } from '~/features/creation/useCreationDraft';
import { stylePortraitSrcForCard, visualStyleSelectorOptions } from '~/features/creation/portraits';
import type { ReviewLocationState } from '~/features/creation/reviewHelpers';
import {
  canProceedWizardScreen,
  getV2WizardGroupIndex,
  getV2WizardProgress,
  legacyWizardRedirect,
  nextWizardStep,
  parseWizardRoute,
  previousWizardStep,
  resolveAccessibleOnboardingStep,
  webViewForOnboardingStep,
  wizardPathForStep,
} from '~/features/creation/wizardSteps';
import { CreationShellHeader, DesktopShell } from '~/layout/DesktopShell';
import { OptionGroup } from '~/layout/OptionGroup';
import { useDesktopShortcuts } from '~/layout/useDesktopShortcuts';
import { CRYSTAL_BALL_GENDER_COLORS } from '~/theme/crystalBallColors';

import GenderWaves from './GenderWaves';
import { useIsMobileLayout } from './useIsMobileLayout';

import './CreateWizardWho.css';
import './CreateWizardHow.css';
import './CreateWizardMobile.css';
import './CreateWizardLayout.css';

const GENDERS: { id: Gender; label: string; icon: string }[] = [
  { id: 'femenino', label: 'Femenino', icon: 'female-outline' },
  { id: 'masculino', label: 'Masculino', icon: 'male-outline' },
  { id: 'neutro', label: 'Neutro', icon: 'male-female-outline' },
];

const STYLES: { id: VisualStyle; labelKey: 'create.style_realistic' | 'create.style_illustrated' }[] = [
  { id: 'realista', labelKey: 'create.style_realistic' },
  { id: 'anime', labelKey: 'create.style_illustrated' },
];

const BALL_COLOR: Record<Gender, string> = CRYSTAL_BALL_GENDER_COLORS;

function WizardWaves({ color }: { color: string }) {
  return (
    <div className="create-wizard-glow" aria-hidden>
      <GenderWaves color={color} />
    </div>
  );
}

function portraitGenderForCard(gender: Gender | ''): Gender {
  if (gender === 'masculino' || gender === 'neutro') return gender;
  return 'femenino';
}

function stepDisabledReason(step: number, t: TFunction): string {
  switch (step) {
    case ONBOARDING_STEPS.gender:
      return 'Elige el género';
    case ONBOARDING_STEPS.persona:
      return 'Elige su personalidad';
    case ONBOARDING_STEPS.visualStyle:
      return 'Elige el estilo visual';
    case ONBOARDING_STEPS.intensity:
      return 'Ajusta su presencia';
    case ONBOARDING_STEPS.interests:
      return 'Elige intereses';
    default:
      return t('onboarding.v2.cta_disabled_reason', { reason: 'este paso' });
  }
}

export default function CreateWizardPage() {
  const { wizardStep, screen } = useParams();
  const legacy = legacyWizardRedirect(wizardStep, screen);
  if (legacy) return <Navigate to={legacy} replace />;

  const onboardingStep = parseWizardRoute(wizardStep, screen);
  if (onboardingStep === null) {
    return <Navigate to={wizardPathForStep(ONBOARDING_STEPS.gender)} replace />;
  }

  return <CreateWizardScreen onboardingStep={onboardingStep} />;
}

function CreateWizardScreen({ onboardingStep }: { onboardingStep: number }) {
  const mobile = useIsMobileLayout();
  const { t } = useTranslation();
  const { t: tWeb } = useTranslation('web');
  const navigate = useNavigate();
  const { markLoggedOut } = useWebSession();
  const [searchParams] = useSearchParams();
  const returnToRevision = searchParams.get('volver') === 'revision';
  const disabledHintId = useId();
  const [hintPhase, setHintPhase] = useState<'hidden' | 'in' | 'out'>('hidden');
  const styleOptions = useMemo(() => visualStyleSelectorOptions(), []);

  const webView = webViewForOnboardingStep(onboardingStep);
  const {
    data,
    loaded,
    setGender,
    setVisualStyle,
    setPersona,
    setIntensity,
    toggleBoundary,
    toggleInterest,
    setCompanionName,
    patchData,
    saveWithWebView,
    flushSave,
  } = useCreationDraft({ webView, step: onboardingStep });

  const [adultConsent, setAdultConsent] = useState(false);
  const [nameTouched, setNameTouched] = useState(false);
  const [nameSuggestPulse, setNameSuggestPulse] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const submittingRef = useRef(false);
  const [saveError, setSaveError] = useState(false);
  const gendered = useGenderedTextWith(data.gender);
  const defaultsApplied = useRef(false);

  const wizardGroup = getV2WizardGroupIndex(onboardingStep) as 1 | 2 | 3 | 4;
  const progress = getV2WizardProgress(onboardingStep);
  const showBuildingPreview = Boolean(data.gender);
  const showBack = onboardingStep !== ONBOARDING_STEPS.gender;

  useEffect(() => {
    if (!loaded) return;
    const allowed = resolveAccessibleOnboardingStep(data, onboardingStep);
    if (allowed !== onboardingStep) {
      navigate(wizardPathForStep(allowed), { replace: true });
    }
  }, [data, loaded, navigate, onboardingStep]);

  // La pantalla no se remonta entre pasos: un error del paso anterior no aplica al nuevo.
  useEffect(() => {
    setSaveError(false);
  }, [onboardingStep]);

  useEffect(() => {
    if (!loaded || defaultsApplied.current) return;
    if (onboardingStep === ONBOARDING_STEPS.intensity && !data.intensity) {
      setIntensity('balanced');
    }
    if (
      onboardingStep === ONBOARDING_STEPS.boundaries &&
      data.boundaries.length === 0
    ) {
      patchData({ boundaries: [...BASIC_BOUNDARIES] });
    }
    if (onboardingStep === ONBOARDING_STEPS.intensity || onboardingStep === ONBOARDING_STEPS.boundaries) {
      defaultsApplied.current = true;
    }
  }, [
    data.boundaries.length,
    data.intensity,
    loaded,
    onboardingStep,
    patchData,
    setIntensity,
  ]);

  const displayName = data.companionName?.trim() ?? '';
  const canProceed = canProceedWizardScreen(onboardingStep, data, {
    adultConfirmed: adultConsent,
    editFromRevision: returnToRevision,
  });

  const navigateToStep = (step: number) => {
    navigate(wizardPathForStep(step));
  };

  const onSuggestName = () => {
    const suggested = getRandomCompanionName(data.ethnicity, data.gender, data.companionName);
    if (suggested) {
      setCompanionName(suggested);
      setNameSuggestPulse(true);
      window.setTimeout(() => setNameSuggestPulse(false), 450);
    }
  };

  const onContinue = async () => {
    if (!canProceed || !loaded || submittingRef.current) return;

    if (onboardingStep === ONBOARDING_STEPS.name) {
      submittingRef.current = true;
      setSubmitting(true);
      setSaveError(false);
      try {
        try {
          await saveWithWebView('revision');
        } catch {
          // eJoi-BE puede rechazar `revision`; basta con que el borrador tenga el nombre.
          await saveWithWebView(webView);
        }
        const state: ReviewLocationState = { adultConfirmed: true };
        navigate('/crear/revision', { state });
      } catch {
        setSaveError(true);
      } finally {
        submittingRef.current = false;
        setSubmitting(false);
      }
      return;
    }

    flushSave(webView);
    if (onboardingStep === ONBOARDING_STEPS.interests) {
      try {
        await saveWithWebView('como');
      } catch {
        /* el autosave reintenta; no bloquear el avance */
      }
    }

    const next = nextWizardStep(onboardingStep);
    if (next != null) navigate(wizardPathForStep(next));
  };

  const onBack = () => {
    const prev = previousWizardStep(onboardingStep);
    if (prev != null) navigate(wizardPathForStep(prev));
  };

  const onConfirmLeave = async () => {
    await saveWithWebView(webView);
    await logoutWeb();
    markLoggedOut();
    navigate('/', { replace: true });
  };

  const ctaLabel =
    onboardingStep === ONBOARDING_STEPS.name
      ? returnToRevision
        ? 'Guardar y volver'
        : 'Crear'
      : 'Siguiente';

  useDesktopShortcuts({
    escapeEnabled: false,
    canContinue: canProceed && loaded && !submitting,
    onEnterContinue: () => void onContinue(),
  });

  const disabledHint =
    !canProceed && onboardingStep === ONBOARDING_STEPS.interests
      ? t('onboarding.v2.interests_min_hint')
      : !canProceed && onboardingStep === ONBOARDING_STEPS.name && !adultConsent
        ? t('onboarding.v2.adult_confirm_label')
        : !canProceed
          ? t('onboarding.v2.cta_disabled_reason', {
              reason: stepDisabledReason(onboardingStep, t),
            })
          : '';

  const stepIntro = (
    title: ReactNode,
    subtitle?: ReactNode,
    layout: 'visual' | 'form' = 'form',
  ) => (
    <header
      className={
        layout === 'visual' ? 'create-step__intro create-step__intro--visual' : 'create-step__intro'
      }
    >
      <h1>{title}</h1>
      {subtitle ? <p>{subtitle}</p> : null}
    </header>
  );

  const genderTitle =
    data.gender === '' ? (
      tWeb('wizard.choose_neutral')
    ) : (
      <>
        Elige tu <span className="brand-text">{gendered.companion()}</span>
      </>
    );

  const genderBody = (
    <>
      {stepIntro(genderTitle, undefined, 'visual')}
      <section className="create-who__section" aria-labelledby="wizard-gender" data-testid="wizard-step-group">
        <h2 id="wizard-gender" className="visually-hidden">
          Género
        </h2>
        <div className="create-circle-grid" role="radiogroup" aria-labelledby="wizard-gender">
          {GENDERS.map(({ id, label, icon }) => (
            <button
              key={id}
              type="button"
              role="radio"
              aria-checked={data.gender === id}
              className={
                data.gender === id ? 'create-circle-opt create-circle-opt--selected' : 'create-circle-opt'
              }
              onClick={() => setGender(id)}
            >
              <span className="create-circle-opt__ring">
                <AppIcon name={icon} />
              </span>
              <span className="create-circle-opt__label">{label}</span>
            </button>
          ))}
        </div>
      </section>
    </>
  );

  const personalityBody = (
    <>
      {stepIntro(
        'Elige su personalidad',
        'Selecciona cómo quieres que sea tu compañía',
      )}
      <section
        className="create-who__section"
        aria-labelledby="wizard-persona"
        data-testid="wizard-step-group"
      >
        <h2 id="wizard-persona" className="visually-hidden">
          Personalidad
        </h2>
        <OptionGroup
          mode="radio"
          aria-labelledby="wizard-persona"
          cols={4}
          className="create-personality-grid"
        >
          {PERSONALITY_OPTIONS.map((option) => {
            const label = gendered.trait(option);
            return (
              <button
                key={option}
                type="button"
                role="radio"
                aria-checked={data.persona === option}
                className={data.persona === option ? 'opt opt--personality opt--selected' : 'opt opt--personality'}
                onClick={() => setPersona(option)}
              >
                <span className="opt__icon-wrap">
                  <AppIcon name={PERSONALITY_OPTION_ICONS[option]} />
                </span>
                <span>{label}</span>
                {data.persona === option ? (
                  <AppIcon name="checkmark" className="opt__check" />
                ) : null}
              </button>
            );
          })}
        </OptionGroup>
      </section>
    </>
  );

  const styleBody = (desktop: boolean) => (
    <>
      {stepIntro(
        data.gender ? (
          <>
            Elige el estilo de tu <span className="brand-text">{gendered.companion()}</span>
          </>
        ) : (
          'Elige su estilo visual'
        ),
        undefined,
        'visual',
      )}
      <section className="create-who__section" aria-labelledby="wizard-style" data-testid="wizard-step-group">
        <h2 id="wizard-style" className="visually-hidden">
          Estilo visual
        </h2>
        {desktop ? (
          <div className="create-circle-grid" role="radiogroup" aria-labelledby="wizard-style">
            {styleOptions.map((item) => (
              <button
                key={item.id}
                type="button"
                role="radio"
                aria-checked={data.visualStyle === item.id}
                className={
                  data.visualStyle === item.id
                    ? 'create-circle-opt create-circle-opt--selected'
                    : 'create-circle-opt'
                }
                onClick={() => setVisualStyle(item.id)}
              >
                <span className="create-circle-opt__ring">
                  <img
                    className="create-circle-opt__thumb"
                    src={stylePortraitSrcForCard(item.id, portraitGenderForCard(data.gender))}
                    alt=""
                  />
                </span>
                <span className="create-circle-opt__label">{tWeb(item.labelKey)}</span>
              </button>
            ))}
          </div>
        ) : (
          <OptionGroup mode="radio" aria-labelledby="wizard-style" cols={4}>
            {STYLES.map(({ id, labelKey }) => (
              <button
                key={id}
                type="button"
                role="radio"
                aria-checked={data.visualStyle === id}
                className={data.visualStyle === id ? 'create-option create-option--selected' : 'create-option'}
                onClick={() => setVisualStyle(id)}
              >
                <img
                  className="create-option__thumb"
                  src={stylePortraitSrcForCard(id, portraitGenderForCard(data.gender))}
                  alt=""
                />
                <span>{tWeb(labelKey)}</span>
              </button>
            ))}
          </OptionGroup>
        )}
      </section>
    </>
  );

  const presenceBody = (
    <>
      {stepIntro(
        'Ajusta su presencia',
        'Esto ajusta cómo se siente su personalidad y la energía de su imagen.',
      )}
      <section
        className="create-who__section"
        aria-labelledby="wizard-presence"
        data-testid="wizard-step-group"
      >
        <h2 id="wizard-presence" className="visually-hidden">
          Presencia
        </h2>
        <div className="create-presence-segmented" role="radiogroup" aria-labelledby="wizard-presence">
          {INTENSITY_OPTIONS.map((option) => (
            <button
              key={option.id}
              type="button"
              role="radio"
              aria-checked={data.intensity === option.id}
              data-testid={`presence-${option.id}`}
              className={
                data.intensity === option.id
                  ? 'create-presence-segmented__btn create-presence-segmented__btn--selected'
                  : 'create-presence-segmented__btn'
              }
              onClick={() => setIntensity(option.id as CompanionIntensity)}
            >
              {option.label}
            </button>
          ))}
        </div>
        {data.intensity ? (
          <p className="create-who__section-desc">
            {INTENSITY_OPTIONS.find((o) => o.id === data.intensity)?.description}
          </p>
        ) : null}
      </section>
    </>
  );

  const boundariesBody = (
    <>
      {stepIntro('Agrega tus límites', t('onboarding.v2.boundaries_basic'))}
      <section
        className="create-who__section"
        aria-labelledby="wizard-boundaries"
        data-testid="wizard-step-group"
      >
        <h2 id="wizard-boundaries" className="visually-hidden">
          Límites
        </h2>
        <OptionGroup mode="toggle" aria-labelledby="wizard-boundaries" layout="inline" className="create-how__chip-row">
          {BOUNDARY_OPTIONS.map((option) => {
            const isBasic = (BASIC_BOUNDARIES as readonly string[]).includes(option);
            const selected = data.boundaries.includes(option);
            return (
              <button
                key={option}
                type="button"
                aria-pressed={selected}
                aria-disabled={isBasic || undefined}
                disabled={isBasic}
                className={selected ? 'chip create-boundary-chip chip--selected' : 'chip create-boundary-chip'}
                onClick={() => {
                  if (!isBasic) toggleBoundary(option);
                }}
              >
                {option}
                {isBasic ? <AppIcon name="lock-closed-outline" className="create-boundary-chip__lock" /> : null}
                {selected && !isBasic ? <AppIcon name="checkmark" /> : null}
              </button>
            );
          })}
        </OptionGroup>
      </section>
    </>
  );

  const interestsBody = (
    <>
      {stepIntro('Tus intereses', t('onboarding.v2.interests_need', { count: 3, selected: data.interests.length }))}
      <section
        className="create-who__section"
        aria-labelledby="wizard-interests"
        data-testid="wizard-step-group"
      >
        <h2 id="wizard-interests" className="visually-hidden">
          Intereses
        </h2>
        <OptionGroup
          mode="toggle"
          aria-labelledby="wizard-interests"
          cols={mobile ? 4 : 6}
          className={mobile ? undefined : 'create-who__interests-mosaic'}
        >
          {INTEREST_OPTIONS.map((interest) => {
            const selected = data.interests.includes(interest);
            return (
              <button
                key={interest}
                type="button"
                aria-pressed={selected}
                className={selected ? 'opt opt--interest opt--selected' : 'opt opt--interest'}
                data-testid="interest-tile"
                onClick={() => toggleInterest(interest)}
              >
                <AppIcon name={INTEREST_OPTION_ICONS[interest]} className="opt--interest__icon" />
                <span className="opt--interest__label">{interest}</span>
              </button>
            );
          })}
        </OptionGroup>
      </section>
    </>
  );

  const nameError =
    nameTouched && displayName.length > 0 ? validators.getNameError(data.companionName ?? '') : null;
  const nameInvalid = Boolean(nameError);

  const nameBody = (
    <>
      {stepIntro(t('onboarding.name.title'))}
      <section className="create-who__section" aria-labelledby="wizard-name" data-testid="wizard-step-group">
        <div className="field">
          <label id="wizard-name" className="field__label" htmlFor="companion-name-input">
            Nombre
          </label>
          <div className="create-how__name-row">
            <input
              id="companion-name-input"
              className={`field__control${nameInvalid ? ' field__control--error' : ''}`}
              type="text"
              maxLength={20}
              value={data.companionName ?? ''}
              placeholder={t(`onboarding.name.placeholder_${data.gender || 'femenino'}`)}
              aria-invalid={nameInvalid || undefined}
              onChange={(e) => setCompanionName(e.target.value)}
              onBlur={() => setNameTouched(true)}
            />
            <button
              type="button"
              className={`btn btn--tonal btn--s${nameSuggestPulse ? ' create-how__suggest--pulse' : ''}`}
              onClick={onSuggestName}
            >
              {t('onboarding.name.generate')}
            </button>
          </div>
          {nameError ? (
            <p className="field__error" role="alert">
              {nameError}
            </p>
          ) : (
            <p className="field__hint">{t('onboarding.name.helper')}</p>
          )}
        </div>
        <label className="check">
          <input
            className="check__input"
            type="checkbox"
            checked={adultConsent}
            onChange={(e) => setAdultConsent(e.target.checked)}
          />
          <span>{t('onboarding.v2.adult_consent')}</span>
        </label>
      </section>
    </>
  );

  const stepContent = (): ReactNode => {
    switch (onboardingStep) {
      case ONBOARDING_STEPS.gender:
        return genderBody;
      case ONBOARDING_STEPS.persona:
        return personalityBody;
      case ONBOARDING_STEPS.visualStyle:
        return styleBody(!mobile);
      case ONBOARDING_STEPS.intensity:
        return presenceBody;
      case ONBOARDING_STEPS.boundaries:
        return boundariesBody;
      case ONBOARDING_STEPS.interests:
        return interestsBody;
      case ONBOARDING_STEPS.name:
        return nameBody;
      default:
        return null;
    }
  };

  useEffect(() => {
    if (!disabledHint) {
      setHintPhase('hidden');
      return undefined;
    }
    setHintPhase('in');
    const leave = window.setTimeout(() => setHintPhase('out'), 2000);
    const hide = window.setTimeout(() => setHintPhase('hidden'), 2320);
    return () => {
      window.clearTimeout(leave);
      window.clearTimeout(hide);
    };
  }, [disabledHint, onboardingStep]);

  const hintToast =
    hintPhase !== 'hidden' && disabledHint ? (
      <p
        id={disabledHintId}
        className={`wizard-hint-toast wizard-hint-toast--${hintPhase}`}
        role="status"
      >
        <AppIcon name="information-circle-outline" />
        {disabledHint}
      </p>
    ) : null;

  const footerHint =
    onboardingStep === ONBOARDING_STEPS.interests && data.interests.length >= 3 ? (
      <p className="creation-shell-footer__counter" data-testid="interests-counter-done">
        <AppIcon name="checkmark-circle" />
        {tWeb('create.interests_done', { count: data.interests.length })}
      </p>
    ) : null;

  const saveErrorNotice = saveError ? (
    <p className="field__error" role="alert">
      {tWeb('create.save_failed')}
    </p>
  ) : null;

  const waves = <WizardWaves color={data.gender ? BALL_COLOR[data.gender] : BALL_COLOR.femenino} />;

  if (mobile) {
    return (
      <div className="create-mobile" data-testid="create-wizard">
        {waves}
        {hintToast}
        <header className="create-mobile__header">
          <span data-testid="create-wizard-step">
            {t('onboarding.v2.step_hint', {
              step: wizardGroup,
              total: 4,
              seconds: [15, 15, 20, 10][wizardGroup - 1],
            })}
          </span>
        </header>
        <main className="create-mobile__main">
          <div className="create-wizard-stage">
            {showBuildingPreview ? (
              <CreationPreviewCrumbsStrip
                data={data}
                currentStep={onboardingStep}
                onNavigateToStep={navigateToStep}
              />
            ) : null}
            <div className="create-who">{stepContent()}</div>
          </div>
        </main>
        <footer className="create-mobile__footer">
          {footerHint}
          {saveErrorNotice}
          {showBack ? (
            <button type="button" className="create-mobile__back" onClick={onBack}>
              {tWeb('create.back')}
            </button>
          ) : null}
          <button
            type="button"
            className="create-mobile__continue"
            disabled={!canProceed || !loaded || submitting}
            aria-describedby={hintPhase !== 'hidden' && disabledHint ? disabledHintId : undefined}
            onClick={() => void onContinue()}
          >
            {ctaLabel}
          </button>
        </footer>
      </div>
    );
  }

  return (
    <div data-testid="create-wizard">
      {waves}
      {hintToast}
      <DesktopShell
        header={
          <CreationShellHeader
            step={wizardGroup}
            progress={progress}
            showBack={showBack}
            onBack={onBack}
            onConfirmLeave={onConfirmLeave}
            crumbs={
              <WizardChoicePills
                data={data}
                currentStep={onboardingStep}
                onNavigateToStep={navigateToStep}
              />
            }
          />
        }
        footer={
          <div className="creation-shell-footer creation-shell-footer--cta">
            {footerHint}
            {saveErrorNotice}
            <button
              type="button"
              className="btn btn--primary btn--l creation-shell-footer__primary"
              disabled={!canProceed || !loaded || submitting}
              aria-describedby={hintPhase !== 'hidden' && disabledHint ? disabledHintId : undefined}
              onClick={() => void onContinue()}
            >
              {ctaLabel}
            </button>
          </div>
        }
      >
        <div className="create-wizard-stage">
          <div
            key={onboardingStep}
            className="create-who create-wizard-step-panel"
            data-create-wizard-main
            data-testid="wizard-step-panel"
          >
            {stepContent()}
          </div>
        </div>
      </DesktopShell>
    </div>
  );
}
