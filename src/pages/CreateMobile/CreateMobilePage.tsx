import { useEffect, useId, useRef, useState, type FormEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router';

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
import { canSubmitCreateForm } from '~/features/creation/nameValidation';
import { stylePortraitSrcForCard } from '~/features/creation/portraits';
import { startCreation } from '~/features/creation/startCreation';
import { DEFAULT_WHO_STEP } from '~/features/creation/onboardingDraft.api';
import { DEFAULT_COMO_STEP, useCreationDraft } from '~/features/creation/useCreationDraft';
import { listWhoMissing } from '~/features/creation/whoValidation';
import { CAMPAIGN_LANDING_URL, ENABLE_AGE, ENABLE_ETHNICITY } from '~/platform/env';
import { OptionGroup } from '~/layout/OptionGroup';

import '../CreateWho/CreateWhoPage.css';
import '../CreateHow/CreateHowPage.css';
import './CreateMobilePage.css';

const GENDERS: { id: Gender; label: string }[] = [
  { id: 'femenino', label: 'Femenino' },
  { id: 'masculino', label: 'Masculino' },
  { id: 'neutro', label: 'Neutro' },
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
}[] = [
  { id: 'soft', labelKey: 'create.presence_soft' },
  { id: 'balanced', labelKey: 'create.presence_balanced' },
  { id: 'intense', labelKey: 'create.presence_intense' },
];

const OPTIONAL_BOUNDARIES = BOUNDARY_OPTIONS.filter(
  (option) => !(BASIC_BOUNDARIES as readonly string[]).includes(option),
);

const LEGAL_TERMS_URL = `${CAMPAIGN_LANDING_URL}/terminos`;
const LEGAL_PRIVACY_URL = `${CAMPAIGN_LANDING_URL}/privacidad`;

const MOBILE_STEPS = 4;

export type CreateMobilePageProps = {
  entryStep?: number;
};

function canAdvanceMobileStep(
  step: number,
  data: { gender?: string; visualStyle?: string; interests: string[] },
): boolean {
  if (step === 0) return Boolean(data.gender && data.visualStyle);
  if (step === 1) return data.interests.length >= 3;
  return true;
}

export default function CreateMobilePage({ entryStep = 0 }: CreateMobilePageProps) {
  const { t } = useTranslation('web');
  const { t: tApp } = useTranslation();
  const navigate = useNavigate();
  const missingId = useId();
  const otherBoundaryId = useId();
  const [step, setStep] = useState(() => Math.min(MOBILE_STEPS - 1, Math.max(0, entryStep)));
  const webView = step <= 1 ? 'quien' : 'como';
  const {
    data,
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
  } = useCreationDraft({
    webView,
    step: step <= 1 ? DEFAULT_WHO_STEP : DEFAULT_COMO_STEP,
  });

  const [adultConsent, setAdultConsent] = useState(false);
  const [legalConsent, setLegalConsent] = useState(false);
  const [otherBoundary, setOtherBoundary] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const defaultsApplied = useRef(false);

  useEffect(() => {
    if (!loaded || defaultsApplied.current || step < 2) return;
    defaultsApplied.current = true;
    if (!data.persona) setPersona(PERSONALITY_OPTIONS[0]);
    if (!data.intensity) setIntensity('balanced');
    if (data.boundaries.length === 0) {
      patchData({ boundaries: [...BASIC_BOUNDARIES] });
    }
  }, [data.boundaries.length, data.intensity, data.persona, loaded, patchData, setIntensity, setPersona, step]);

  const displayName = data.companionName?.trim() ?? '';
  const canSubmit = canSubmitCreateForm(data.companionName, {
    adult: adultConsent,
    termsAndPrivacy: legalConsent,
  });
  const canAdvance = canAdvanceMobileStep(step, data);
  const whoMissing = listWhoMissing(data);
  const missingText =
    step === 0 && !canAdvance
      ? t('create.missing', {
          items: whoMissing.filter((item) => item !== 'al menos 3 intereses').join(', ') || 'género, estilo visual',
        })
      : step === 1 && !canAdvance
        ? t('create.missing', { items: 'al menos 3 intereses' })
        : '';

  const onSuggestName = () => {
    const suggested = getRandomCompanionName(data.ethnicity, data.gender, data.companionName);
    if (suggested) setCompanionName(suggested);
  };

  const onAddOtherBoundary = () => {
    const trimmed = otherBoundary.trim();
    if (!trimmed || trimmed.length > 60) return;
    if (!data.boundaries.includes(trimmed)) toggleBoundary(trimmed);
    setOtherBoundary('');
  };

  const onContinue = async () => {
    if (!canAdvance || !loaded) return;
    if (step === 1) {
      await saveWithWebView('como');
      setStep(2);
      return;
    }
    if (step < MOBILE_STEPS - 1) {
      setStep((s) => s + 1);
    }
  };

  const onBack = () => {
    if (step > entryStep) setStep((s) => s - 1);
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

  const basicLimitsText = t('create.basic_limits', { limits: BASIC_BOUNDARIES.join(', ') });

  return (
    <div className="create-mobile" data-testid="create-mobile">
      <header className="create-mobile__header">
        <span data-testid="create-mobile-step">
          {t('create.step2')} · {step + 1}/{MOBILE_STEPS}
        </span>
      </header>

      <main className="create-mobile__main">
        {step === 0 ? (
          <div className="create-who">
            <section className="create-who__section" aria-labelledby="mobile-gender">
              <h3 id="mobile-gender" className="create-who__label">
                Género
              </h3>
              <OptionGroup mode="radio" aria-labelledby="mobile-gender" cols={3}>
                {GENDERS.map(({ id, label }) => (
                  <button
                    key={id}
                    type="button"
                    role="radio"
                    aria-checked={data.gender === id}
                    className={data.gender === id ? 'create-option create-option--selected' : 'create-option'}
                    onClick={() => setGender(id)}
                  >
                    {label}
                  </button>
                ))}
              </OptionGroup>
            </section>

            <section className="create-who__section" aria-labelledby="mobile-style">
              <h3 id="mobile-style" className="create-who__label">
                Estilo visual
              </h3>
              <OptionGroup mode="radio" aria-labelledby="mobile-style" cols={3}>
                {STYLES.map(({ id, labelKey }) => (
                  <button
                    key={id}
                    type="button"
                    role="radio"
                    aria-checked={data.visualStyle === id}
                    className={
                      data.visualStyle === id ? 'create-option create-option--selected' : 'create-option'
                    }
                    onClick={() => setVisualStyle(id)}
                  >
                    <img
                      className="create-option__thumb"
                      src={stylePortraitSrcForCard(id, 'femenino')}
                      alt=""
                    />
                    <span>{t(labelKey)}</span>
                  </button>
                ))}
              </OptionGroup>
            </section>

            {ENABLE_ETHNICITY ? (
              <section className="create-who__section" aria-labelledby="mobile-ethnicity">
                <h3 id="mobile-ethnicity" className="create-who__label">
                  Etnia <span className="create-who__optional">(opcional)</span>
                </h3>
                <OptionGroup mode="radio" aria-labelledby="mobile-ethnicity" cols={4}>
                  <button
                    type="button"
                    role="radio"
                    aria-checked={!data.ethnicity}
                    className={
                      !data.ethnicity ? 'create-option create-option--selected' : 'create-option'
                    }
                    onClick={() => setEthnicity(undefined)}
                  >
                    Sin preferencia
                  </button>
                  {ETHNICITY_IDS.map((id) => (
                    <button
                      key={id}
                      type="button"
                      role="radio"
                      aria-checked={data.ethnicity === ETHNICITY_LABELS[id]}
                      className={
                        data.ethnicity === ETHNICITY_LABELS[id]
                          ? 'create-option create-option--selected'
                          : 'create-option'
                      }
                      onClick={() => setEthnicity(ETHNICITY_LABELS[id])}
                    >
                      {ETHNICITY_LABELS[id]}
                    </button>
                  ))}
                </OptionGroup>
              </section>
            ) : null}

            {ENABLE_AGE ? (
              <section className="create-who__section" aria-labelledby="mobile-age">
                <h3 id="mobile-age" className="create-who__label">
                  Edad aparente <span className="create-who__optional">(opcional)</span>
                </h3>
                <input
                  className="create-who__age"
                  type="number"
                  min={COMPANION_MIN_AGE}
                  max={COMPANION_MAX_AGE}
                  value={data.age ?? ''}
                  onChange={(e) => setAge(Number(e.target.value))}
                  aria-labelledby="mobile-age"
                />
              </section>
            ) : null}
          </div>
        ) : null}

        {step === 1 ? (
          <div className="create-who">
            <section className="create-who__section" aria-labelledby="mobile-interests">
              <div className="create-who__interests-head">
                <h3 id="mobile-interests" className="create-who__label">
                  Intereses
                </h3>
                <span
                  className={
                    data.interests.length >= 3
                      ? 'create-who__counter create-who__counter--ok'
                      : 'create-who__counter'
                  }
                >
                  {t('create.interests_counter', { count: data.interests.length })}
                </span>
              </div>
              <OptionGroup mode="toggle" aria-labelledby="mobile-interests" cols={4}>
                {INTEREST_OPTIONS.map((interest) => {
                  const selected = data.interests.includes(interest);
                  return (
                    <button
                      key={interest}
                      type="button"
                      aria-pressed={selected}
                      className={selected ? 'create-option create-option--selected' : 'create-option'}
                      onClick={() => toggleInterest(interest)}
                    >
                      <AppIcon name={INTEREST_OPTION_ICONS[interest]} />
                      <span>{interest}</span>
                    </button>
                  );
                })}
              </OptionGroup>
            </section>
          </div>
        ) : null}

        {step === 2 ? (
          <div className="create-how create-who">
            <section className="create-who__section" aria-labelledby="mobile-personality">
              <h3 id="mobile-personality" className="create-who__label">
                Personalidad
              </h3>
              <OptionGroup mode="radio" aria-labelledby="mobile-personality" cols={4}>
                {PERSONALITY_OPTIONS.map((option) => (
                  <button
                    key={option}
                    type="button"
                    role="radio"
                    aria-checked={data.persona === option}
                    className={
                      data.persona === option ? 'create-option create-option--selected' : 'create-option'
                    }
                    onClick={() => setPersona(option)}
                  >
                    <AppIcon name={PERSONALITY_OPTION_ICONS[option]} />
                    <span>{option}</span>
                  </button>
                ))}
              </OptionGroup>
            </section>

            <section className="create-who__section" aria-labelledby="mobile-presence">
              <h3 id="mobile-presence" className="create-who__label">
                Presencia
              </h3>
              <OptionGroup
                mode="radio"
                aria-labelledby="mobile-presence"
                layout="inline"
                className="create-how__presence"
              >
                {PRESENCE.map(({ id, labelKey }) => (
                  <button
                    key={id}
                    type="button"
                    role="radio"
                    aria-checked={data.intensity === id}
                    className={
                      data.intensity === id
                        ? 'create-how__presence-btn create-how__presence-btn--selected'
                        : 'create-how__presence-btn'
                    }
                    onClick={() => setIntensity(id)}
                  >
                    {t(labelKey)}
                  </button>
                ))}
              </OptionGroup>
            </section>

            <section className="create-who__section" aria-labelledby="mobile-boundaries">
              <h3 id="mobile-boundaries" className="create-who__label">
                Temas a evitar <span className="create-who__optional">(opcional)</span>
              </h3>
              <p className="create-how__basic-limits" role="note">
                {basicLimitsText}
              </p>
              <OptionGroup mode="toggle" aria-labelledby="mobile-boundaries" cols={3}>
                {OPTIONAL_BOUNDARIES.map((option) => {
                  const selected = data.boundaries.includes(option);
                  return (
                    <button
                      key={option}
                      type="button"
                      aria-pressed={selected}
                      className={selected ? 'create-option create-option--selected' : 'create-option'}
                      onClick={() => toggleBoundary(option)}
                    >
                      {option}
                    </button>
                  );
                })}
              </OptionGroup>
              <div className="create-how__other-boundary">
                <label htmlFor={otherBoundaryId}>{t('create.avoid_other')}</label>
                <div className="create-how__other-row">
                  <input
                    id={otherBoundaryId}
                    className="create-how__other-input"
                    type="text"
                    maxLength={60}
                    value={otherBoundary}
                    onChange={(e) => setOtherBoundary(e.target.value)}
                  />
                  <button
                    type="button"
                    className="create-how__other-add"
                    onClick={onAddOtherBoundary}
                    aria-label={`Añadir ${t('create.avoid_other').toLowerCase()}`}
                  >
                    +
                  </button>
                </div>
              </div>
            </section>
          </div>
        ) : null}

        {step === 3 ? (
          <form id="create-mobile-form" className="create-how create-who" onSubmit={(e) => void onSubmit(e)}>
            <section className="create-who__section" aria-labelledby="mobile-name">
              <h3 id="mobile-name" className="create-who__label">
                Nombre
              </h3>
              <div className="create-how__name-row">
                <input
                  className="create-how__name-input"
                  type="text"
                  maxLength={20}
                  value={data.companionName ?? ''}
                  onChange={(e) => setCompanionName(e.target.value)}
                  aria-labelledby="mobile-name"
                />
                <button type="button" className="create-how__suggest" onClick={onSuggestName}>
                  {t('create.suggest_name')}
                </button>
              </div>
            </section>

            <section className="create-who__section" aria-labelledby="mobile-consent">
              <h3 id="mobile-consent" className="create-who__label">
                {tApp('companion.create.consent_title')}
              </h3>
              <label className="create-how__consent">
                <input
                  type="checkbox"
                  checked={adultConsent}
                  onChange={(e) => setAdultConsent(e.target.checked)}
                />
                <span>{tApp('auth.login.age_gate')}</span>
              </label>
              <label className="create-how__consent">
                <input
                  type="checkbox"
                  checked={legalConsent}
                  onChange={(e) => setLegalConsent(e.target.checked)}
                />
                <span>
                  {tApp('auth.login.legal_gate_prefix')}{' '}
                  <a href={LEGAL_TERMS_URL} target="_blank" rel="noreferrer">
                    {tApp('auth.login.terms_link')}
                  </a>
                  {tApp('auth.login.and_privacy')}
                  <a href={LEGAL_PRIVACY_URL} target="_blank" rel="noreferrer">
                    {tApp('auth.login.privacy_link')}
                  </a>
                  {tApp('auth.login.legal_gate_suffix')}
                </span>
              </label>
              <input type="hidden" name="documentsVersion" value={LEGAL_DOCUMENTS_VERSION} readOnly />
            </section>
          </form>
        ) : null}
      </main>

      <footer className="create-mobile__footer">
        {missingText ? (
          <p id={missingId} className="create-mobile__missing" role="status">
            {missingText}
          </p>
        ) : null}
        <button type="button" className="create-mobile__back" onClick={onBack}>
          Atrás
        </button>
        {step < MOBILE_STEPS - 1 ? (
          <button
            type="button"
            className="create-mobile__continue"
            disabled={!canAdvance || !loaded}
            aria-describedby={missingText ? missingId : undefined}
            onClick={() => void onContinue()}
          >
            {t('create.continue')}
          </button>
        ) : (
          <button
            type="submit"
            form="create-mobile-form"
            className="create-mobile__continue"
            disabled={!canSubmit || !loaded || submitting}
          >
            {t('create.cta_create', { name: displayName || '…' })}
          </button>
        )}
      </footer>
    </div>
  );
}
