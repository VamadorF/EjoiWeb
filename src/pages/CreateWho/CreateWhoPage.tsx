import { useId, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router';

import { INTEREST_OPTIONS, INTEREST_OPTION_ICONS } from '@/features/onboarding/data/interestOptions';
import { ETHNICITY_IDS } from '@/features/onboarding/data/companionNames';
import type { Gender, VisualStyle } from '@/features/onboarding/types';
import { COMPANION_MAX_AGE, COMPANION_MIN_AGE } from '@/features/onboarding/constants/onboardingSteps';

import { AppIcon } from '~/components/AppIcon';
import { CreationPreview } from '~/features/creation/CreationPreview';
import { stylePortraitSrcForCard } from '~/features/creation/portraits';
import { useCreationDraft } from '~/features/creation/useCreationDraft';
import { canContinueWho, listWhoMissing } from '~/features/creation/whoValidation';
import { ENABLE_AGE, ENABLE_ETHNICITY } from '~/platform/env';
import { DesktopShell } from '~/layout/DesktopShell';
import { OptionGrid } from '~/layout/OptionGrid';

import './CreateWhoPage.css';

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

  const missing = useMemo(() => listWhoMissing(data), [data]);
  const canContinue = canContinueWho(data);
  const missingText = missing.length > 0 ? t('create.missing', { items: missing.join(', ') }) : '';

  const onContinue = async () => {
    if (!canContinue) return;
    await saveWithWebView('como');
    void navigate('/crear/como');
  };

  return (
    <DesktopShell
      header={
        <div className="create-who__header">
          <span>{t('create.step2')}</span>
        </div>
      }
      preview={<CreationPreview data={data} tagTimeline={tagTimeline} />}
      footer={
        <div className="create-who__footer">
          {!canContinue ? (
            <p id={missingId} className="create-who__missing" role="status">
              {missingText}
            </p>
          ) : null}
          <button
            type="button"
            className="create-who__continue"
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
        <section className="create-who__section" aria-labelledby="create-who-gender">
          <h3 id="create-who-gender" className="create-who__label">
            Género
          </h3>
          <OptionGrid cols={3}>
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
          </OptionGrid>
        </section>

        <section className="create-who__section" aria-labelledby="create-who-style">
          <h3 id="create-who-style" className="create-who__label">
            Estilo visual
          </h3>
          <OptionGrid cols={3}>
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
          </OptionGrid>
        </section>

        {ENABLE_ETHNICITY ? (
          <section className="create-who__section" aria-labelledby="create-who-ethnicity">
            <h3 id="create-who-ethnicity" className="create-who__label">
              Etnia <span className="create-who__optional">(opcional)</span>
            </h3>
            <OptionGrid cols={4}>
              <button
                type="button"
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
            </OptionGrid>
          </section>
        ) : null}

        {ENABLE_AGE ? (
          <section className="create-who__section" aria-labelledby="create-who-age">
            <h3 id="create-who-age" className="create-who__label">
              Edad aparente <span className="create-who__optional">(opcional)</span>
            </h3>
            <input
              id="create-who-age-input"
              className="create-who__age"
              type="number"
              min={COMPANION_MIN_AGE}
              max={COMPANION_MAX_AGE}
              value={data.age ?? ''}
              onChange={(e) => setAge(Number(e.target.value))}
            />
          </section>
        ) : null}

        <section className="create-who__section" aria-labelledby="create-who-interests">
          <div className="create-who__interests-head">
            <h3 id="create-who-interests" className="create-who__label">
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
          <OptionGrid cols={6}>
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
          </OptionGrid>
        </section>
      </div>
    </DesktopShell>
  );
}
