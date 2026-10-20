import { useId, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router';

import { INTEREST_OPTIONS, INTEREST_OPTION_ICONS } from '@/features/onboarding/data/interestOptions';
import { ETHNICITY_IDS } from '@/features/onboarding/data/companionNames';
import type { Gender } from '@/features/onboarding/types';
import { COMPANION_MAX_AGE, COMPANION_MIN_AGE } from '@/features/onboarding/constants/onboardingSteps';

import { AppIcon } from '~/components/AppIcon';
import { CreationPreview } from '~/features/creation/CreationPreview';
import { stylePortraitSrcForCard, visualStyleSelectorOptions } from '~/features/creation/portraits';
import { useCreationDraft } from '~/features/creation/useCreationDraft';
import { canContinueWho, listWhoMissing } from '~/features/creation/whoValidation';
import { ENABLE_AGE, ENABLE_ETHNICITY } from '~/platform/env';
import { CreationShellHeader, DesktopShell } from '~/layout/DesktopShell';
import { OptionGroup } from '~/layout/OptionGroup';
import { useDesktopShortcuts } from '~/layout/useDesktopShortcuts';

import './CreateWhoPage.css';

const GENDERS: { id: Gender; label: string; icon: string }[] = [
  { id: 'femenino', label: 'Femenino', icon: 'female-outline' },
  { id: 'masculino', label: 'Masculino', icon: 'male-outline' },
  { id: 'neutro', label: 'Neutro', icon: 'male-female-outline' },
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

const DEFAULT_AGE = 28;

export default function CreateWhoPage() {
  const { t } = useTranslation('web');
  const navigate = useNavigate();
  const missingId = useId();
  const {
    data,
    tagTimeline,
    loaded,
    setGender,
    setVisualStyle,
    setEthnicity,
    setAge,
    toggleInterest,
    saveWithWebView,
  } = useCreationDraft({ webView: 'quien' });

  const styleOptions = useMemo(() => visualStyleSelectorOptions(), []);
  const missing = useMemo(() => listWhoMissing(data), [data]);
  const canContinue = canContinueWho(data);
  const missingText = missing.length > 0 ? t('create.missing', { items: missing.join(', ') }) : '';
  const ageValue = data.age ?? DEFAULT_AGE;
  const showRowB = ENABLE_ETHNICITY || ENABLE_AGE;

  const onContinue = async () => {
    if (!canContinue) return;
    await saveWithWebView('como');
    void navigate('/crear/como');
  };

  useDesktopShortcuts({
    escapeTo: '/acceso',
    canContinue,
    onEnterContinue: () => void onContinue(),
  });

  return (
    <div data-testid="page-quien">
    <DesktopShell
      header={<CreationShellHeader step={2} stepLabel={t('create.step2')} />}
      preview={<CreationPreview data={data} tagTimeline={tagTimeline} />}
      footer={
        <div className="creation-shell-footer">
          {!canContinue ? (
            <p id={missingId} className="creation-shell-footer__hint" role="status">
              <AppIcon name="information-circle-outline" />
              {missingText}
            </p>
          ) : (
            <span />
          )}
          <button
            type="button"
            className="btn btn--primary btn--l creation-shell-footer__primary"
            disabled={!canContinue || !loaded}
            aria-describedby={!canContinue ? missingId : undefined}
            onClick={() => void onContinue()}
          >
            {t('create.continue')}
          </button>
        </div>
      }
    >
      <div className="create-who">
        <header className="create-step__intro">
          <h1>{t('create.title_who')}</h1>
          <p>{t('create.subtitle_who')}</p>
        </header>

        <div className="create-who__row create-who__row--split">
          <section className="create-who__section" aria-labelledby="create-who-gender">
            <h2 id="create-who-gender" className="create-who__section-title">
              Género
            </h2>
            <OptionGroup mode="radio" aria-labelledby="create-who-gender" cols={3}>
              {GENDERS.map(({ id, label, icon }) => (
                <button
                  key={id}
                  type="button"
                  role="radio"
                  aria-checked={data.gender === id}
                  className="opt opt--gender"
                  onClick={() => setGender(id)}
                >
                  <AppIcon name={icon} />
                  <span>{label}</span>
                </button>
              ))}
            </OptionGroup>
          </section>

          <section className="create-who__section" aria-labelledby="create-who-style">
            <h2 id="create-who-style" className="create-who__section-title">
              Estilo visual
            </h2>
            <OptionGroup
              mode="radio"
              aria-labelledby="create-who-style"
              layout="inline"
              className="create-who__style-grid"
            >
              {styleOptions.map(({ id, labelKey }) => (
                <button
                  key={id}
                  type="button"
                  role="radio"
                  aria-checked={data.visualStyle === id}
                  className="opt opt--style"
                  onClick={() => setVisualStyle(id)}
                >
                  <img
                    className="opt__thumb"
                    src={stylePortraitSrcForCard(id, 'femenino')}
                    alt=""
                  />
                  <span>{t(labelKey)}</span>
                </button>
              ))}
            </OptionGroup>
          </section>
        </div>

        {showRowB ? (
          <div
            className={
              ENABLE_ETHNICITY && ENABLE_AGE
                ? 'create-who__row create-who__row--split'
                : 'create-who__row'
            }
          >
            {ENABLE_ETHNICITY ? (
              <section className="create-who__section" aria-labelledby="create-who-ethnicity">
                <h2 id="create-who-ethnicity" className="create-who__section-title">
                  Etnia <span className="create-who__optional">(opcional)</span>
                </h2>
                <OptionGroup
                  mode="radio"
                  aria-labelledby="create-who-ethnicity"
                  layout="inline"
                  className="create-who__chip-wrap"
                >
                  <button
                    type="button"
                    role="radio"
                    aria-checked={!data.ethnicity}
                    className="chip"
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
                      className="chip"
                      onClick={() => setEthnicity(ETHNICITY_LABELS[id])}
                    >
                      {ETHNICITY_LABELS[id]}
                    </button>
                  ))}
                </OptionGroup>
              </section>
            ) : null}

            {ENABLE_AGE ? (
              <section className="create-who__section" aria-labelledby="create-who-age">
                <h2 id="create-who-age" className="create-who__section-title">
                  Edad aparente <span className="create-who__optional">(opcional)</span>
                </h2>
                <div className="create-who__age-row">
                  <div className="stepper" aria-labelledby="create-who-age">
                    <button
                      type="button"
                      className="btn btn--icon btn--secondary"
                      aria-label="Reducir edad"
                      disabled={ageValue <= COMPANION_MIN_AGE}
                      onClick={() => setAge(Math.max(COMPANION_MIN_AGE, ageValue - 1))}
                    >
                      <AppIcon name="remove-outline" />
                    </button>
                    <span className="stepper__value" aria-live="polite">
                      {ageValue}
                    </span>
                    <button
                      type="button"
                      className="btn btn--icon btn--secondary"
                      aria-label="Aumentar edad"
                      disabled={ageValue >= COMPANION_MAX_AGE}
                      onClick={() => setAge(Math.min(COMPANION_MAX_AGE, ageValue + 1))}
                    >
                      <AppIcon name="add-outline" />
                    </button>
                  </div>
                  <span className="create-who__age-unit">{t('create.age_unit')}</span>
                </div>
              </section>
            ) : null}
          </div>
        ) : null}

        <section className="create-who__section" aria-labelledby="create-who-interests">
          <div className="create-who__interests-head">
            <h2 id="create-who-interests" className="create-who__section-title">
              Intereses
            </h2>
            <span
              className={
                data.interests.length >= 3 ? 'pill create-who__counter--ok' : 'pill create-who__counter'
              }
            >
              {t('create.interests_counter', { count: data.interests.length })}
            </span>
          </div>
          <OptionGroup mode="toggle" aria-labelledby="create-who-interests" cols={6}>
            {INTEREST_OPTIONS.map((interest) => {
              const selected = data.interests.includes(interest);
              return (
                <button
                  key={interest}
                  type="button"
                  aria-pressed={selected}
                  className="chip"
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
    </DesktopShell>
    </div>
  );
}
