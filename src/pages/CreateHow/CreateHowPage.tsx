import { useEffect, useId, useMemo, useRef, useState, type FormEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router';

import { LEGAL_DOCUMENTS_VERSION } from '@/features/auth/assets/legalDocuments';
import {
  BASIC_BOUNDARIES,
  BOUNDARY_OPTIONS,
} from '@/features/onboarding/data/boundaryOptions';
import { getRandomCompanionName } from '@/features/onboarding/data/getRandomCompanionName';
import {
  PERSONALITY_OPTION_ICONS,
  PERSONALITY_OPTIONS,
} from '@/features/onboarding/data/personalityOptions';
import type { CompanionIntensity } from '@/features/onboarding/types';
import { CAMPAIGN_LANDING_URL } from '~/platform/env';

import { AppIcon } from '~/components/AppIcon';
import { CreationPreview } from '~/features/creation/CreationPreview';
import { canSubmitCreateForm, isValidCompanionName } from '~/features/creation/nameValidation';
import {
  buildGreetingPreviewBody,
  fetchGreetingPreview,
  startCreation,
} from '~/features/creation/startCreation';
import { DEFAULT_COMO_STEP, useCreationDraft } from '~/features/creation/useCreationDraft';
import { DesktopShell } from '~/layout/DesktopShell';
import { OptionGroup } from '~/layout/OptionGroup';
import { useDesktopShortcuts } from '~/layout/useDesktopShortcuts';

import '../CreateWho/CreateWhoPage.css';
import './CreateHowPage.css';

const LEGAL_TERMS_URL = `${CAMPAIGN_LANDING_URL}/terminos`;
const LEGAL_PRIVACY_URL = `${CAMPAIGN_LANDING_URL}/privacidad`;

const OPTIONAL_BOUNDARIES = BOUNDARY_OPTIONS.filter(
  (option) => !(BASIC_BOUNDARIES as readonly string[]).includes(option),
);

const PRESENCE: { id: CompanionIntensity; labelKey: 'create.presence_soft' | 'create.presence_balanced' | 'create.presence_intense' }[] =
  [
    { id: 'soft', labelKey: 'create.presence_soft' },
    { id: 'balanced', labelKey: 'create.presence_balanced' },
    { id: 'intense', labelKey: 'create.presence_intense' },
  ];

const GREETING_DEBOUNCE_MS = 400;

export default function CreateHowPage() {
  const { t } = useTranslation('web');
  const { t: tApp } = useTranslation();
  const navigate = useNavigate();
  const missingId = useId();
  const otherBoundaryId = useId();
  const {
    data,
    tagTimeline,
    loaded,
    setPersona,
    setIntensity,
    toggleBoundary,
    setCompanionName,
    patchData,
  } = useCreationDraft({ webView: 'como', step: DEFAULT_COMO_STEP });

  const [adultConsent, setAdultConsent] = useState(false);
  const [legalConsent, setLegalConsent] = useState(false);
  const [otherBoundary, setOtherBoundary] = useState('');
  const [greeting, setGreeting] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const defaultsApplied = useRef(false);

  useEffect(() => {
    if (!loaded || defaultsApplied.current) return;
    defaultsApplied.current = true;
    if (!data.persona) setPersona(PERSONALITY_OPTIONS[0]);
    if (!data.intensity) setIntensity('balanced');
    if (data.boundaries.length === 0) {
      patchData({ boundaries: [...BASIC_BOUNDARIES] });
    }
  }, [data.boundaries.length, data.intensity, data.persona, loaded, patchData, setIntensity, setPersona]);

  const displayName = data.companionName?.trim() ?? '';
  const canSubmit = canSubmitCreateForm(data.companionName, {
    adult: adultConsent,
    termsAndPrivacy: legalConsent,
  });

  useEffect(() => {
    if (!loaded || !isValidCompanionName(displayName)) {
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
  }, [data, displayName, loaded]);

  const basicLimitsText = useMemo(
    () => t('create.basic_limits', { limits: BASIC_BOUNDARIES.join(', ') }),
    [t],
  );

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

  useDesktopShortcuts({
    escapeTo: '/crear/quien',
    canContinue: canSubmit && !submitting,
    onEnterContinue: () => {
      const form = document.getElementById('create-how-form') as HTMLFormElement | null;
      form?.requestSubmit();
    },
  });

  return (
    <DesktopShell
      header={
        <div className="create-who__header">
          <span>{t('create.step3')}</span>
        </div>
      }
      preview={
        <CreationPreview
          data={data}
          tagTimeline={tagTimeline}
          companionName={displayName}
          greeting={greeting}
        />
      }
      footer={
        <div className="create-who__footer">
          {!canSubmit ? (
            <p id={missingId} className="create-who__missing" role="status">
              {t('create.missing', {
                items: !displayName
                  ? 'nombre y consentimiento'
                  : !adultConsent || !legalConsent
                    ? 'consentimiento'
                    : 'nombre',
              })}
            </p>
          ) : null}
          <button
            type="submit"
            form="create-how-form"
            className="create-who__continue"
            disabled={!canSubmit || !loaded || submitting}
            aria-describedby={!canSubmit ? missingId : undefined}
          >
            {t('create.cta_create', { name: displayName || '…' })}
          </button>
        </div>
      }
    >
      <form id="create-how-form" className="create-how create-who" onSubmit={(e) => void onSubmit(e)}>
        <section className="create-who__section" aria-labelledby="create-how-personality">
          <h3 id="create-how-personality" className="create-who__label">
            Personalidad
          </h3>
          <OptionGroup mode="radio" aria-labelledby="create-how-personality" cols={4}>
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

        <section className="create-who__section" aria-labelledby="create-how-presence">
          <h3 id="create-how-presence" className="create-who__label">
            Presencia
          </h3>
          <OptionGroup
            mode="radio"
            aria-labelledby="create-how-presence"
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

        <section className="create-who__section" aria-labelledby="create-how-boundaries">
          <h3 id="create-how-boundaries" className="create-who__label">
            Temas a evitar <span className="create-who__optional">(opcional)</span>
          </h3>
          <p className="create-how__basic-limits" role="note">
            {basicLimitsText}
          </p>
          <OptionGroup mode="toggle" aria-labelledby="create-how-boundaries" cols={3}>
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

        <section className="create-who__section" aria-labelledby="create-how-name">
          <h3 id="create-how-name" className="create-who__label">
            Nombre
          </h3>
          <div className="create-how__name-row">
            <input
              className="create-how__name-input"
              type="text"
              maxLength={20}
              value={data.companionName ?? ''}
              onChange={(e) => setCompanionName(e.target.value)}
              aria-labelledby="create-how-name"
              aria-describedby="create-how-name-hint"
            />
            <button type="button" className="create-how__suggest" onClick={onSuggestName}>
              {t('create.suggest_name')}
            </button>
          </div>
          <p id="create-how-name-hint" className="create-how__name-hint">
            {tApp('onboarding.name.helper')}
          </p>
        </section>

        <section className="create-who__section" aria-labelledby="create-how-consent">
          <h3 id="create-how-consent" className="create-who__label">
            {tApp('companion.create.consent_title')}
          </h3>
          <p className="create-how__consent-hint">{tApp('companion.create.consent_cta_hint')}</p>
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
          <input
            type="hidden"
            name="documentsVersion"
            value={LEGAL_DOCUMENTS_VERSION}
            readOnly
            aria-hidden
            tabIndex={-1}
          />
        </section>
      </form>
    </DesktopShell>
  );
}
