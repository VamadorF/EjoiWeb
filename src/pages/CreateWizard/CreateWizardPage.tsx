import { useEffect, useId, useMemo, useRef, useState, type FormEvent, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { Navigate, useNavigate, useParams } from 'react-router';

import { LEGAL_DOCUMENTS_VERSION } from '@/features/auth/assets/legalDocuments';
import {
  BASIC_BOUNDARIES,
  BOUNDARY_OPTIONS,
} from '@/features/onboarding/data/boundaryOptions';
import { ETHNICITY_IDS } from '@/features/onboarding/data/companionNames';
import { getRandomCompanionName } from '@/features/onboarding/data/getRandomCompanionName';
import { INTEREST_OPTIONS, INTEREST_OPTION_ICONS } from '@/features/onboarding/data/interestOptions';
import {
  PERSONALITY_OPTION_ICONS,
  PERSONALITY_OPTIONS,
} from '@/features/onboarding/data/personalityOptions';
import type { CompanionIntensity, Gender, VisualStyle } from '@/features/onboarding/types';
import { COMPANION_MAX_AGE, COMPANION_MIN_AGE } from '@/features/onboarding/constants/onboardingSteps';

import { AppIcon } from '~/components/AppIcon';
import { logoutWeb } from '~/features/auth/api/auth.api';
import { CreationPreview } from '~/features/creation/CreationPreview';
import { canSubmitCreateForm, isValidCompanionName } from '~/features/creation/nameValidation';
import {
  buildGreetingPreviewBody,
  fetchGreetingPreview,
  startCreation,
} from '~/features/creation/startCreation';
import { DEFAULT_COMO_STEP, useCreationDraft } from '~/features/creation/useCreationDraft';
import { stylePortraitSrcForCard, visualStyleSelectorOptions } from '~/features/creation/portraits';
import {
  canAdvanceWizardStep,
  draftStepForWizardIndex,
  parseWizardRouteSlug,
  resolveAccessibleWizardIndex,
  webViewForWizardIndex,
  WIZARD_STEP_COUNT,
  wizardPath,
} from '~/features/creation/wizardSteps';
import { CAMPAIGN_LANDING_URL, ENABLE_AGE, ENABLE_ETHNICITY } from '~/platform/env';
import { CreationShellHeader, DesktopShell } from '~/layout/DesktopShell';
import { OptionGroup } from '~/layout/OptionGroup';
import { useDesktopShortcuts } from '~/layout/useDesktopShortcuts';

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

const ETHNICITY_LABELS: Record<(typeof ETHNICITY_IDS)[number], string> = {
  latina: 'Latina',
  caucasica: 'Caucásica',
  afrodescendiente: 'Afrodescendiente',
  asiatica: 'Asiática',
  arabe: 'Árabe',
  india: 'India',
  mixta: 'Mixta',
};

const PRESENCE: {
  id: CompanionIntensity;
  labelKey: 'create.presence_soft' | 'create.presence_balanced' | 'create.presence_intense';
  descKey: 'create.presence_desc_soft' | 'create.presence_desc_balanced' | 'create.presence_desc_intense';
  icon: string;
  recommended?: boolean;
}[] = [
  { id: 'soft', labelKey: 'create.presence_soft', descKey: 'create.presence_desc_soft', icon: 'leaf-outline' },
  {
    id: 'balanced',
    labelKey: 'create.presence_balanced',
    descKey: 'create.presence_desc_balanced',
    icon: 'pulse-outline',
    recommended: true,
  },
  { id: 'intense', labelKey: 'create.presence_intense', descKey: 'create.presence_desc_intense', icon: 'flash-outline' },
];

const OPTIONAL_BOUNDARIES = BOUNDARY_OPTIONS.filter(
  (option) => !(BASIC_BOUNDARIES as readonly string[]).includes(option),
);

const LEGAL_TERMS_URL = `${CAMPAIGN_LANDING_URL}/terminos`;
const LEGAL_PRIVACY_URL = `${CAMPAIGN_LANDING_URL}/privacidad`;
const GREETING_DEBOUNCE_MS = 400;
const WIZARD_TITLE_KEYS = ['wizard.s1_title', 'wizard.s2_title', 'wizard.s3_title', 'wizard.s4_title'] as const;
const WIZARD_SUB_KEYS = ['wizard.s1_sub', 'wizard.s2_sub', 'wizard.s3_sub', 'wizard.s4_sub'] as const;

function wizardMissingItems(stepIndex: number, data: { gender?: string; visualStyle?: string; persona?: string; interests: string[] }): string {
  if (stepIndex === 0) {
    const items: string[] = [];
    if (!data.gender) items.push('género');
    if (!data.persona) items.push('personalidad');
    if (!data.visualStyle) items.push('estilo visual');
    return items.join(', ');
  }
  if (stepIndex === 2 && data.interests.length < 3) return 'al menos 3 intereses';
  return '';
}

export default function CreateWizardPage() {
  const { wizardStep } = useParams();
  const stepIndex = parseWizardRouteSlug(wizardStep);
  if (stepIndex === null) return <Navigate to={wizardPath(0)} replace />;
  return <CreateWizardStep stepIndex={stepIndex} />;
}

function CreateWizardStep({ stepIndex }: { stepIndex: number }) {
  const mobile = useIsMobileLayout();
  const { t } = useTranslation('web');
  const { t: tApp } = useTranslation();
  const navigate = useNavigate();
  const missingId = useId();
  const otherBoundaryId = useId();
  const styleOptions = useMemo(() => visualStyleSelectorOptions(), []);

  const draftStep = draftStepForWizardIndex(stepIndex);
  const webView = webViewForWizardIndex(stepIndex);
  const {
    data,
    tagTimeline,
    loaded,
    setGender,
    setVisualStyle,
    setEthnicity,
    setAge,
    toggleInterest,
    setPersona,
    setIntensity,
    toggleBoundary,
    setCompanionName,
    patchData,
    saveWithWebView,
    flushSave,
  } = useCreationDraft({ webView, step: draftStep });

  const [adultConsent, setAdultConsent] = useState(false);
  const [legalConsent, setLegalConsent] = useState(false);
  const [otherBoundary, setOtherBoundary] = useState('');
  const [showOtherBoundary, setShowOtherBoundary] = useState(false);
  const [greeting, setGreeting] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const step2DefaultsApplied = useRef(false);

  useEffect(() => {
    if (!loaded) return;
    const allowed = resolveAccessibleWizardIndex(data, stepIndex);
    if (allowed !== stepIndex) navigate(wizardPath(allowed), { replace: true });
  }, [data, loaded, navigate, stepIndex]);

  useEffect(() => {
    if (!loaded || stepIndex !== 1 || step2DefaultsApplied.current) return;
    step2DefaultsApplied.current = true;
    if (!data.intensity) setIntensity('balanced');
    if (data.boundaries.length === 0) patchData({ boundaries: [...BASIC_BOUNDARIES] });
  }, [data.boundaries.length, data.intensity, loaded, patchData, setIntensity, stepIndex]);

  const displayName = data.companionName?.trim() ?? '';
  const canAdvance = canAdvanceWizardStep(stepIndex, data);
  const canSubmit = canSubmitCreateForm(data.companionName, {
    adult: adultConsent,
    termsAndPrivacy: legalConsent,
  });
  const missingItems = wizardMissingItems(stepIndex, data);
  const missingText = missingItems ? t('create.missing', { items: missingItems }) : '';

  useEffect(() => {
    if (!loaded || stepIndex !== 3 || !isValidCompanionName(displayName)) {
      setGreeting(null);
      return undefined;
    }
    const body = buildGreetingPreviewBody(data, displayName);
    const timer = setTimeout(() => {
      void fetchGreetingPreview(body)
        .then((res) => setGreeting(res.greeting))
        .catch(() => setGreeting(null));
    }, GREETING_DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [data, displayName, loaded, stepIndex]);

  const onSuggestName = () => {
    const suggested = getRandomCompanionName(data.ethnicity, data.gender, data.companionName);
    if (suggested) setCompanionName(suggested);
  };

  const onAddOtherBoundary = () => {
    const trimmed = otherBoundary.trim();
    if (!trimmed || trimmed.length > 60) return;
    if (!data.boundaries.includes(trimmed)) toggleBoundary(trimmed);
    setOtherBoundary('');
    if (!mobile) setShowOtherBoundary(false);
  };

  const onContinue = async () => {
    if (!canAdvance || !loaded) return;
    flushSave(webView);
    if (stepIndex === 2) await saveWithWebView('como');
    navigate(wizardPath(stepIndex + 1));
  };

  const onBack = () => {
    if (stepIndex > 0) navigate(wizardPath(stepIndex - 1));
    else void navigate('/acceso');
  };

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (!canSubmit || submitting) return;
    setSubmitting(true);
    try {
      await startCreation({ data, step: DEFAULT_COMO_STEP, webView: 'como' }, (path) => {
        void navigate(path);
      });
    } finally {
      setSubmitting(false);
    }
  };

  const onConfirmLeave = async () => {
    await saveWithWebView(webView);
    await logoutWeb();
    void navigate('/acceso');
  };

  useDesktopShortcuts({
    escapeEnabled: false,
    canContinue: stepIndex < 3 ? canAdvance && loaded : canSubmit && !submitting,
    onEnterContinue: () => {
      if (stepIndex < 3) void onContinue();
      else (document.getElementById('create-wizard-form') as HTMLFormElement | null)?.requestSubmit();
    },
  });

  const basicLimitsText = t('create.basic_limits', { limits: BASIC_BOUNDARIES.join(', ') });
  const wizardStepDisplay = stepIndex + 1;
  const titleKey = WIZARD_TITLE_KEYS[stepIndex];
  const subKey = WIZARD_SUB_KEYS[stepIndex];

  const stepIntro = (
    <header className="create-step__intro">
      <h1>{t(titleKey)}</h1>
      <p>{t(subKey)}</p>
    </header>
  );

  const step1Body = (desktop: boolean) => (
    <>
      {stepIntro}
      <section className="create-who__section" aria-labelledby="wizard-gender" data-testid="wizard-step-group">
        <h2 id="wizard-gender" className={desktop ? 'create-who__section-title' : 'create-who__label'}>
          Género
        </h2>
        <OptionGroup mode="radio" aria-labelledby="wizard-gender" cols={3}>
          {GENDERS.map(({ id, label, icon }) => (
            <button
              key={id}
              type="button"
              role="radio"
              aria-checked={data.gender === id}
              className={desktop ? 'opt opt--gender' : data.gender === id ? 'create-option create-option--selected' : 'create-option'}
              onClick={() => setGender(id)}
            >
              {desktop ? <AppIcon name={icon} /> : null}
              <span>{label}</span>
            </button>
          ))}
        </OptionGroup>
      </section>

      <section className="create-who__section" aria-labelledby="wizard-persona" data-testid="wizard-step-group">
        <h2 id="wizard-persona" className={desktop ? 'create-who__section-title' : 'create-who__label'}>
          Personalidad
        </h2>
        <OptionGroup mode="radio" aria-labelledby="wizard-persona" cols={desktop ? 4 : 4}>
          {PERSONALITY_OPTIONS.map((option) => (
            <button
              key={option}
              type="button"
              role="radio"
              aria-checked={data.persona === option}
              className={
                desktop
                  ? 'opt opt--personality'
                  : data.persona === option
                    ? 'create-option create-option--selected'
                    : 'create-option'
              }
              onClick={() => setPersona(option)}
            >
              {desktop ? (
                <span className="opt__icon-wrap">
                  <AppIcon name={PERSONALITY_OPTION_ICONS[option]} />
                </span>
              ) : (
                <AppIcon name={PERSONALITY_OPTION_ICONS[option]} />
              )}
              <span>{option}</span>
            </button>
          ))}
        </OptionGroup>
      </section>

      <section className="create-who__section" aria-labelledby="wizard-style" data-testid="wizard-step-group">
        <h2 id="wizard-style" className={desktop ? 'create-who__section-title' : 'create-who__label'}>
          Estilo visual
        </h2>
        <OptionGroup
          mode="radio"
          aria-labelledby="wizard-style"
          cols={desktop ? undefined : 3}
          layout={desktop ? 'inline' : undefined}
          className={desktop ? 'create-who__style-grid' : undefined}
        >
          {(desktop ? styleOptions : STYLES).map((item) => {
            const id = item.id;
            const label = desktop ? t(item.labelKey) : t(item.labelKey);
            return (
              <button
                key={id}
                type="button"
                role="radio"
                aria-checked={data.visualStyle === id}
                className={
                  desktop
                    ? 'opt opt--style'
                    : data.visualStyle === id
                      ? 'create-option create-option--selected'
                      : 'create-option'
                }
                onClick={() => setVisualStyle(id)}
              >
                <img className={desktop ? 'opt__thumb' : 'create-option__thumb'} src={stylePortraitSrcForCard(id, 'femenino')} alt="" />
                <span>{label}</span>
              </button>
            );
          })}
        </OptionGroup>
      </section>

      {ENABLE_ETHNICITY || ENABLE_AGE ? (
        <div className={ENABLE_ETHNICITY && ENABLE_AGE ? 'create-who__row create-who__row--split' : 'create-who__row'}>
          {ENABLE_ETHNICITY ? (
            <section className="create-who__section" aria-labelledby="wizard-ethnicity">
              <h2 id="wizard-ethnicity" className={desktop ? 'create-who__section-title' : 'create-who__label'}>
                Etnia <span className="create-who__optional">(opcional)</span>
              </h2>
              <OptionGroup mode="radio" aria-labelledby="wizard-ethnicity" cols={desktop ? undefined : 4} layout={desktop ? 'inline' : undefined} className={desktop ? 'create-who__chip-wrap' : undefined}>
                <button type="button" role="radio" aria-checked={!data.ethnicity} className={desktop ? 'chip' : !data.ethnicity ? 'create-option create-option--selected' : 'create-option'} onClick={() => setEthnicity(undefined)}>
                  Sin preferencia
                </button>
                {ETHNICITY_IDS.map((id) => (
                  <button
                    key={id}
                    type="button"
                    role="radio"
                    aria-checked={data.ethnicity === ETHNICITY_LABELS[id]}
                    className={desktop ? 'chip' : data.ethnicity === ETHNICITY_LABELS[id] ? 'create-option create-option--selected' : 'create-option'}
                    onClick={() => setEthnicity(ETHNICITY_LABELS[id])}
                  >
                    {ETHNICITY_LABELS[id]}
                  </button>
                ))}
              </OptionGroup>
            </section>
          ) : null}
          {ENABLE_AGE ? (
            <section className="create-who__section" aria-labelledby="wizard-age">
              <h2 id="wizard-age" className={desktop ? 'create-who__section-title' : 'create-who__label'}>
                Edad aparente <span className="create-who__optional">(opcional)</span>
              </h2>
              {desktop ? (
                <div className="create-who__age-row">
                  <div className="stepper" aria-labelledby="wizard-age">
                    <button type="button" className="btn btn--icon btn--secondary" aria-label="Reducir edad" disabled={(data.age ?? 28) <= COMPANION_MIN_AGE} onClick={() => setAge(Math.max(COMPANION_MIN_AGE, (data.age ?? 28) - 1))}>
                      <AppIcon name="remove-outline" />
                    </button>
                    <span className="stepper__value">{data.age ?? 28}</span>
                    <button type="button" className="btn btn--icon btn--secondary" aria-label="Aumentar edad" disabled={(data.age ?? 28) >= COMPANION_MAX_AGE} onClick={() => setAge(Math.min(COMPANION_MAX_AGE, (data.age ?? 28) + 1))}>
                      <AppIcon name="add-outline" />
                    </button>
                  </div>
                  <span className="create-who__age-unit">{t('create.age_unit')}</span>
                </div>
              ) : (
                <input className="create-who__age" type="number" min={COMPANION_MIN_AGE} max={COMPANION_MAX_AGE} value={data.age ?? ''} onChange={(e) => setAge(Number(e.target.value))} aria-labelledby="wizard-age" />
              )}
            </section>
          ) : null}
        </div>
      ) : null}
    </>
  );

  const step2Body = (desktop: boolean) => (
    <>
      {stepIntro}
      <section className="create-who__section" aria-labelledby="wizard-presence" data-testid="wizard-step-group">
        <h2 id="wizard-presence" className={desktop ? 'create-who__section-title' : 'create-who__label'}>
          Presencia
        </h2>
        <OptionGroup mode="radio" aria-labelledby="wizard-presence" cols={desktop ? 3 : undefined} layout={desktop ? undefined : 'inline'} className={desktop ? undefined : 'create-how__presence'}>
          {PRESENCE.map(({ id, labelKey, descKey, icon, recommended }) => (
            <button
              key={id}
              type="button"
              role="radio"
              aria-checked={data.intensity === id}
              className={desktop ? 'opt opt--presence' : data.intensity === id ? 'create-how__presence-btn create-how__presence-btn--selected' : 'create-how__presence-btn'}
              data-testid={`presence-${id}`}
              onClick={() => setIntensity(id)}
            >
              {desktop ? <AppIcon name={icon} className="opt--presence__icon" /> : null}
              <span className={desktop ? 'opt--presence__title' : undefined}>
                {t(labelKey)}
                {recommended ? <span className={desktop ? 'pill opt--presence__pill' : undefined}> {desktop ? t('create.recommended') : ''}</span> : null}
              </span>
              {desktop ? <span className="opt--presence__desc">{t(descKey)}</span> : null}
            </button>
          ))}
        </OptionGroup>
      </section>

      {desktop ? (
        <details className="create-step__avoid" data-testid="wizard-step-group">
          <summary id="wizard-avoid-toggle">{t('wizard.avoid_toggle')}</summary>
          <div className="create-step__avoid-body">
            <OptionGroup mode="toggle" aria-labelledby="wizard-avoid-toggle" cols={undefined} layout="inline" className="create-how__chip-row">
              {OPTIONAL_BOUNDARIES.map((option) => {
                const selected = data.boundaries.includes(option);
                return (
                  <button key={option} type="button" aria-pressed={selected} className="chip" onClick={() => toggleBoundary(option)}>
                    {option}
                  </button>
                );
              })}
              {!showOtherBoundary ? (
                <button type="button" className="chip chip--add" onClick={() => setShowOtherBoundary(true)}>
                  {t('create.avoid_other')}
                </button>
              ) : null}
            </OptionGroup>
            {showOtherBoundary ? (
              <div className="create-how__other-inline field">
                <label className="field__label" htmlFor={otherBoundaryId}>
                  {t('create.avoid_other')}
                </label>
                <div className="create-how__other-row">
                  <input id={otherBoundaryId} className="field__control" type="text" maxLength={60} value={otherBoundary} onChange={(e) => setOtherBoundary(e.target.value)} />
                  <button type="button" className="btn btn--secondary btn--m" onClick={onAddOtherBoundary} aria-label={`Añadir ${t('create.avoid_other').toLowerCase()}`}>
                    +
                  </button>
                </div>
              </div>
            ) : null}
          </div>
        </details>
      ) : (
        <section className="create-who__section" aria-labelledby="wizard-boundaries" data-testid="wizard-step-group">
          <h2 id="wizard-boundaries" className="create-who__label">
            Temas a evitar <span className="create-who__optional">(opcional)</span>
          </h2>
          <OptionGroup mode="toggle" aria-labelledby="wizard-boundaries" cols={3} className="create-how__chip-row">
            {OPTIONAL_BOUNDARIES.map((option) => {
              const selected = data.boundaries.includes(option);
              return (
                <button key={option} type="button" aria-pressed={selected} className={selected ? 'create-option create-option--selected' : 'create-option'} onClick={() => toggleBoundary(option)}>
                  {option}
                </button>
              );
            })}
          </OptionGroup>
          <div className="create-how__other-boundary">
            <label htmlFor={otherBoundaryId}>{t('create.avoid_other')}</label>
            <div className="create-how__other-row">
              <input id={otherBoundaryId} className="create-how__other-input" type="text" maxLength={60} value={otherBoundary} onChange={(e) => setOtherBoundary(e.target.value)} />
              <button type="button" className="create-how__other-add" onClick={onAddOtherBoundary} aria-label={`Añadir ${t('create.avoid_other').toLowerCase()}`}>
                +
              </button>
            </div>
          </div>
        </section>
      )}
      <p className={desktop ? 'banner--info' : 'create-how__basic-limits'} role="note">
        {desktop ? <AppIcon name="shield-checkmark-outline" /> : null}
        {basicLimitsText}
      </p>
    </>
  );

  const step3Body = (desktop: boolean) => (
    <>
      {stepIntro}
      <section className="create-who__section" aria-labelledby="wizard-interests" data-testid="wizard-step-group">
        <div className="create-who__interests-head">
          <h2 id="wizard-interests" className={desktop ? 'create-who__section-title' : 'create-who__label'}>
            Intereses
          </h2>
          <span className={data.interests.length >= 3 ? 'create-who__counter create-who__counter--ok' : 'create-who__counter'}>
            {t('create.interests_counter', { count: data.interests.length })}
          </span>
        </div>
        <OptionGroup mode="toggle" aria-labelledby="wizard-interests" cols={desktop ? 6 : 4} className={desktop ? 'create-who__interests-mosaic' : undefined}>
          {INTEREST_OPTIONS.map((interest) => {
            const selected = data.interests.includes(interest);
            return (
              <button key={interest} type="button" aria-pressed={selected} className={desktop ? 'opt opt--interest' : selected ? 'create-option create-option--selected' : 'create-option'} data-testid={desktop ? 'interest-tile' : undefined} onClick={() => toggleInterest(interest)}>
                <AppIcon name={INTEREST_OPTION_ICONS[interest]} className={desktop ? 'opt--interest__icon' : undefined} />
                <span className={desktop ? 'opt--interest__label' : undefined}>{interest}</span>
              </button>
            );
          })}
        </OptionGroup>
      </section>
    </>
  );

  const consentBlock = (
    <section className="create-who__section" aria-labelledby="wizard-consent" data-testid="wizard-step-group">
      <h2 id="wizard-consent" className="create-who__section-title">
        {tApp('companion.create.consent_title')}
      </h2>
      {mobile ? null : <p className="create-how__consent-hint">{tApp('companion.create.consent_cta_hint')}</p>}
      <label className={mobile ? 'create-how__consent' : 'check'}>
        <input className={mobile ? undefined : 'check__input'} type="checkbox" checked={adultConsent} onChange={(e) => setAdultConsent(e.target.checked)} />
        <span>{tApp('auth.login.age_gate')}</span>
      </label>
      <label className={mobile ? 'create-how__consent' : 'check'}>
        <input className={mobile ? undefined : 'check__input'} type="checkbox" checked={legalConsent} onChange={(e) => setLegalConsent(e.target.checked)} />
        <span>
          {tApp('auth.login.legal_gate_prefix')}{' '}
          <a className={mobile ? undefined : 'create-how__legal-link'} href={LEGAL_TERMS_URL} target="_blank" rel="noreferrer">
            {tApp('auth.login.terms_link')}
          </a>
          {tApp('auth.login.and_privacy')}
          <a className={mobile ? undefined : 'create-how__legal-link'} href={LEGAL_PRIVACY_URL} target="_blank" rel="noreferrer">
            {tApp('auth.login.privacy_link')}
          </a>
          {tApp('auth.login.legal_gate_suffix')}
        </span>
      </label>
      <input type="hidden" name="documentsVersion" value={LEGAL_DOCUMENTS_VERSION} readOnly aria-hidden tabIndex={-1} />
    </section>
  );

  const step4Body = (desktop: boolean) => (
    <>
      {stepIntro}
      <section className="create-who__section" aria-labelledby="wizard-name" data-testid="wizard-step-group">
        {desktop ? (
          <div className="field">
            <span id="wizard-name" className="field__label">
              Nombre
            </span>
            <div className="create-how__name-row">
              <input className="field__control" type="text" maxLength={20} value={data.companionName ?? ''} onChange={(e) => setCompanionName(e.target.value)} aria-labelledby="wizard-name" />
              <button type="button" className="btn btn--tonal btn--s" onClick={onSuggestName}>
                {t('create.suggest_name')}
              </button>
            </div>
          </div>
        ) : (
          <>
            <h3 id="wizard-name" className="create-who__label">
              Nombre
            </h3>
            <div className="create-how__name-row">
              <input className="create-how__name-input" type="text" maxLength={20} value={data.companionName ?? ''} onChange={(e) => setCompanionName(e.target.value)} aria-labelledby="wizard-name" />
              <button type="button" className="create-how__suggest" onClick={onSuggestName}>
                {t('create.suggest_name')}
              </button>
            </div>
          </>
        )}
      </section>
      {consentBlock}
    </>
  );

  const stepContent = (desktop: boolean): ReactNode => {
    if (stepIndex === 0) return step1Body(desktop);
    if (stepIndex === 1) return step2Body(desktop);
    if (stepIndex === 2) return step3Body(desktop);
    return step4Body(desktop);
  };

  if (mobile) {
    return (
      <div className="create-mobile" data-testid="create-wizard">
        <header className="create-mobile__header">
          <span data-testid="create-wizard-step">
            {t('create.step2')} · {wizardStepDisplay}/{WIZARD_STEP_COUNT}
          </span>
        </header>
        <main className="create-mobile__main">
          <div className="create-who">{stepIndex === 3 ? <form id="create-wizard-form" className="create-how" onSubmit={(e) => void onSubmit(e)}>{stepContent(false)}</form> : stepContent(false)}</div>
        </main>
        <footer className="create-mobile__footer">
          {missingText ? (
            <p id={missingId} className="create-mobile__missing" role="status">
              {missingText}
            </p>
          ) : null}
          <button type="button" className="create-mobile__back" onClick={onBack}>
            {stepIndex > 0 ? t('create.back') : 'Atrás'}
          </button>
          {stepIndex < 3 ? (
            <button type="button" className="create-mobile__continue" disabled={!canAdvance || !loaded} aria-describedby={missingText ? missingId : undefined} onClick={() => void onContinue()}>
              {t('create.continue')}
            </button>
          ) : (
            <button type="submit" form="create-wizard-form" className="create-mobile__continue" disabled={!canSubmit || !loaded || submitting}>
              {t('create.cta_create', { name: displayName || '…' })}
            </button>
          )}
        </footer>
      </div>
    );
  }

  const submitMissing =
    !displayName || !adultConsent || !legalConsent
      ? t('create.missing', { items: !displayName ? 'nombre y consentimiento' : 'consentimiento' })
      : '';

  return (
    <div data-testid="create-wizard">
      <DesktopShell
        header={
          <CreationShellHeader step={wizardStepDisplay as 1 | 2 | 3 | 4} onConfirmLeave={onConfirmLeave} />
        }
        preview={
          <CreationPreview
            data={data}
            tagTimeline={tagTimeline}
            companionName={stepIndex === 3 ? displayName : undefined}
            greeting={stepIndex === 3 ? greeting : null}
            showGreetingPreview={stepIndex === 3}
          />
        }
        footer={
          <div className="creation-shell-footer">
            <div className="creation-shell-footer__start">
              {stepIndex > 0 ? (
                <button type="button" className="btn btn--secondary btn--l" onClick={onBack}>
                  {t('create.back')}
                </button>
              ) : null}
            </div>
            <div className="creation-shell-footer__center">
              {stepIndex < 3 && missingText ? (
                <p id={missingId} className="creation-shell-footer__hint" role="status">
                  <AppIcon name="information-circle-outline" />
                  {missingText}
                </p>
              ) : stepIndex === 3 && !canSubmit ? (
                <p id={missingId} className="creation-shell-footer__hint" role="status">
                  <AppIcon name="information-circle-outline" />
                  {submitMissing}
                </p>
              ) : stepIndex === 2 && data.interests.length >= 3 ? (
                <p className="creation-shell-footer__counter" data-testid="interests-counter-done">
                  <AppIcon name="checkmark-circle" />
                  {t('create.interests_done', { count: data.interests.length })}
                </p>
              ) : null}
            </div>
            <div className="creation-shell-footer__actions">
              {stepIndex < 3 ? (
                <button type="button" className="btn btn--primary btn--l creation-shell-footer__primary" disabled={!canAdvance || !loaded} aria-describedby={missingText ? missingId : undefined} onClick={() => void onContinue()}>
                  {t('create.continue')}
                </button>
              ) : (
                <button type="submit" form="create-wizard-form" className="btn btn--primary btn--l creation-shell-footer__primary" disabled={!canSubmit || !loaded || submitting} aria-describedby={!canSubmit ? missingId : undefined}>
                  {t('create.cta_create', { name: displayName || '…' })}
                </button>
              )}
            </div>
          </div>
        }
      >
        {stepIndex === 3 ? (
          <form
            id="create-wizard-form"
            key={stepIndex}
            className="create-how create-who create-wizard-step-panel"
            data-create-wizard-main
            data-testid="wizard-step-panel"
            onSubmit={(e) => void onSubmit(e)}
          >
            {stepContent(true)}
          </form>
        ) : (
          <div key={stepIndex} className="create-who create-wizard-step-panel" data-create-wizard-main data-testid="wizard-step-panel">
            {stepContent(true)}
          </div>
        )}
      </DesktopShell>
    </div>
  );
}
