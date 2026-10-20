import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useCallback, useId, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router';

import {
  BASIC_BOUNDARIES,
  BOUNDARY_OPTIONS,
} from '@/features/onboarding/data/boundaryOptions';
import { ETHNICITY_IDS } from '@/features/onboarding/data/companionNames';
import { INTEREST_OPTIONS, INTEREST_OPTION_ICONS } from '@/features/onboarding/data/interestOptions';
import {
  PERSONALITY_OPTION_ICONS,
  PERSONALITY_OPTIONS,
} from '@/features/onboarding/data/personalityOptions';
import type { CompanionIntensity, Gender, VisualStyle } from '@/features/onboarding/types';
import { COMPANION_MAX_AGE, COMPANION_MIN_AGE } from '@/features/onboarding/constants/onboardingSteps';

import { AppIcon } from '~/components/AppIcon';
import { ProfilePanel } from '~/features/chat/ProfilePanel';
import { SideMenu } from '~/features/chat/SideMenu';
import { toProfilePanelDraft } from '~/features/edit/editPatch';
import { useEditForm } from '~/features/edit/useEditForm';
import { useRegeneration } from '~/features/edit/useRegeneration';
import { EDIT_VOICE_OPTIONS } from '~/features/edit/voiceOptions';
import { stylePortraitSrcForCard, visualStyleSelectorOptions } from '~/features/creation/portraits';
import { ChatShell } from '~/layout/ChatShell';
import { OptionGroup } from '~/layout/OptionGroup';
import { useDesktopShortcuts } from '~/layout/useDesktopShortcuts';
import { ENABLE_AGE, ENABLE_ETHNICITY } from '~/platform/env';

import '../CreateHow/CreateHowPage.css';
import '../CreateWho/CreateWhoPage.css';
import './EditCompanionPage.css';

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

const PRESENCE: { id: CompanionIntensity; labelKey: 'create.presence_soft' | 'create.presence_balanced' | 'create.presence_intense' }[] =
  [
    { id: 'soft', labelKey: 'create.presence_soft' },
    { id: 'balanced', labelKey: 'create.presence_balanced' },
    { id: 'intense', labelKey: 'create.presence_intense' },
  ];

const OPTIONAL_BOUNDARIES = BOUNDARY_OPTIONS.filter(
  (option) => !(BASIC_BOUNDARIES as readonly string[]).includes(option),
);

const editQueryClient = new QueryClient({
  defaultOptions: { queries: { retry: false } },
});

function EditCompanionContent() {
  const { t } = useTranslation('web');
  const otherBoundaryId = useId();
  const [otherBoundary, setOtherBoundary] = useState('');
  const [showOtherBoundary, setShowOtherBoundary] = useState(false);

  const {
    loaded,
    loadError,
    profile,
    baseline,
    values,
    setValues,
    saving,
    saveError,
    conversationalDirty,
    saveConversational,
    reload,
    syncFromProfile,
  } = useEditForm(editQueryClient);

  const regen = useRegeneration({
    queryClient: editQueryClient,
    baseline,
    values,
    profile,
    onApplied: syncFromProfile,
  });

  const styleOptions = useMemo(() => visualStyleSelectorOptions(), []);
  const basicLimitsText = useMemo(
    () => t('create.basic_limits', { limits: BASIC_BOUNDARIES.join(', ') }),
    [t],
  );

  const patchValues = useCallback(
    (patch: Partial<NonNullable<typeof values>>) => {
      setValues((prev) => (prev ? { ...prev, ...patch } : prev));
      if (regen.phase !== 'generating') {
        regen.resetRegeneration();
      }
    },
    [regen, setValues],
  );

  const toggleInterest = (interest: string) => {
    if (!values) return;
    const removing = values.interests.includes(interest);
    patchValues({
      interests: removing
        ? values.interests.filter((i) => i !== interest)
        : [...values.interests, interest],
    });
  };

  const toggleBoundary = (boundary: string) => {
    if (!values) return;
    const removing = values.boundaries.includes(boundary);
    patchValues({
      boundaries: removing
        ? values.boundaries.filter((b) => b !== boundary)
        : [...values.boundaries, boundary],
    });
  };

  const onAddOtherBoundary = () => {
    const trimmed = otherBoundary.trim();
    if (!trimmed || trimmed.length > 60 || !values) return;
    if (!values.boundaries.includes(trimmed)) toggleBoundary(trimmed);
    setOtherBoundary('');
    setShowOtherBoundary(false);
  };

  const profileDraft = useMemo(
    () => (values ? toProfilePanelDraft(values) : null),
    [values],
  );

  const previewPortrait =
    regen.phase === 'compare' && regen.pendingPortrait
      ? regen.pendingPortrait.fileUrl
      : profile?.avatarUrl ?? null;

  const hasPendingChanges = conversationalDirty || regen.appearanceDirty;
  const comparePhase = regen.phase === 'compare';

  useDesktopShortcuts({
    escapeTo: '/chat',
    canContinue: conversationalDirty && !saving && !comparePhase,
    onEnterContinue: () => void saveConversational(),
  });

  return (
    <ChatShell
      menu={<SideMenu />}
      profile={
        <ProfilePanel
          profile={profile}
          draft={profileDraft}
          profileLoading={!loaded}
          profileError={loadError}
          onRetryProfile={() => void reload()}
          portraitUrl={previewPortrait}
          portraitBlur={regen.phase === 'generating'}
          portraitPendingLabel={regen.phase === 'generating' ? t('edit.regen_generating') : null}
          unsaved={hasPendingChanges}
        />
      }
    >
      <div className="edit-companion" data-testid="edit-companion-page">
        <header className="edit-companion__header">
          <Link to="/chat" className="btn btn--text btn--m">
            <AppIcon name="arrow-back-outline" />
            {t('edit.back_to_chat')}
          </Link>
          <h1 className="edit-companion__title">{t('edit.title')}</h1>
        </header>

        {loaded && values ? (
          <>
            <div className="edit-companion__scroll">
              <section className="card edit-companion__card" aria-labelledby="edit-appearance">
                <h2 id="edit-appearance" className="edit-companion__card-title">
                  {t('edit.section_appearance')}
                </h2>
                <p className="banner--info" role="note">
                  <AppIcon name="information-circle-outline" />
                  {regen.appearanceDirty ? t('edit.regen_needed') : t('edit.appearance_hint')}
                </p>

                <div className="edit-companion__sub">
                  <h3 id="edit-style" className="edit-companion__sub-title">
                    {t('edit.style')}
                  </h3>
                  <OptionGroup
                    mode="radio"
                    aria-labelledby="edit-style"
                    layout="inline"
                    className="create-who__style-grid"
                  >
                    {styleOptions.map(({ id, labelKey }) => (
                      <button
                        key={id}
                        type="button"
                        role="radio"
                        aria-checked={values.visualStyle === id}
                        className="opt opt--style"
                        onClick={() => patchValues({ visualStyle: id as VisualStyle })}
                      >
                        <img
                          className="opt__thumb"
                          src={stylePortraitSrcForCard(
                            id,
                            values.gender === 'masculino' ? 'masculino' : 'femenino',
                          )}
                          alt=""
                        />
                        <span>{t(labelKey)}</span>
                      </button>
                    ))}
                  </OptionGroup>
                </div>

                <div className="edit-companion__sub">
                  <h3 id="edit-gender" className="edit-companion__sub-title">
                    {t('edit.gender')}
                  </h3>
                  <OptionGroup mode="radio" aria-labelledby="edit-gender" cols={3}>
                    {GENDERS.map(({ id, label, icon }) => (
                      <button
                        key={id}
                        type="button"
                        role="radio"
                        aria-checked={values.gender === id}
                        className="opt opt--gender"
                        onClick={() => patchValues({ gender: id })}
                      >
                        <AppIcon name={icon} />
                        <span>{label}</span>
                      </button>
                    ))}
                  </OptionGroup>
                </div>

                {ENABLE_ETHNICITY ? (
                  <div className="edit-companion__sub">
                    <h3 id="edit-ethnicity" className="edit-companion__sub-title">
                      {t('edit.ethnicity')}
                    </h3>
                    <OptionGroup
                      mode="radio"
                      aria-labelledby="edit-ethnicity"
                      layout="inline"
                      className="create-who__chip-wrap"
                    >
                      <button
                        type="button"
                        role="radio"
                        aria-checked={!values.ethnicity}
                        className="chip"
                        onClick={() => patchValues({ ethnicity: undefined })}
                      >
                        Sin preferencia
                      </button>
                      {ETHNICITY_IDS.map((id) => (
                        <button
                          key={id}
                          type="button"
                          role="radio"
                          aria-checked={values.ethnicity === ETHNICITY_LABELS[id]}
                          className="chip"
                          onClick={() => patchValues({ ethnicity: ETHNICITY_LABELS[id] })}
                        >
                          {ETHNICITY_LABELS[id]}
                        </button>
                      ))}
                    </OptionGroup>
                  </div>
                ) : null}

                {ENABLE_AGE ? (
                  <div className="edit-companion__sub">
                    <h3 id="edit-age" className="edit-companion__sub-title">
                      {t('edit.age')}
                    </h3>
                    <div className="create-who__age-row">
                      <div className="stepper" aria-labelledby="edit-age">
                        <button
                          type="button"
                          className="btn btn--icon btn--secondary"
                          aria-label="Reducir edad"
                          disabled={values.age <= COMPANION_MIN_AGE}
                          onClick={() =>
                            patchValues({ age: Math.max(COMPANION_MIN_AGE, values.age - 1) })
                          }
                        >
                          <AppIcon name="remove-outline" />
                        </button>
                        <span className="stepper__value" aria-live="polite">
                          {values.age}
                        </span>
                        <button
                          type="button"
                          className="btn btn--icon btn--secondary"
                          aria-label="Aumentar edad"
                          disabled={values.age >= COMPANION_MAX_AGE}
                          onClick={() =>
                            patchValues({ age: Math.min(COMPANION_MAX_AGE, values.age + 1) })
                          }
                        >
                          <AppIcon name="add-outline" />
                        </button>
                      </div>
                      <span className="create-who__age-unit">{t('create.age_unit')}</span>
                    </div>
                  </div>
                ) : null}

                {regen.appearanceDirty ? (
                  <>
                    {comparePhase && regen.pendingPortrait && profile?.avatarUrl ? (
                      <div className="edit-companion__regen-compare">
                        <figure className="edit-companion__regen-figure">
                          <img
                            src={profile.avatarUrl}
                            alt=""
                            className="avatar edit-companion__regen-avatar"
                          />
                          <span className="label">{t('edit.current')}</span>
                        </figure>
                        <figure className="edit-companion__regen-figure">
                          <img
                            src={regen.pendingPortrait.fileUrl}
                            alt=""
                            className="avatar edit-companion__regen-avatar"
                          />
                          <span className="label">{t('edit.new')}</span>
                        </figure>
                      </div>
                    ) : null}
                    {regen.phase === 'error' ? (
                      <p className="banner--error" role="alert">
                        {t('edit.regen_error')}
                      </p>
                    ) : null}
                    <div className="edit-companion__regen-actions">
                      {comparePhase ? (
                        <>
                          <button
                            type="button"
                            className="btn btn--primary btn--m"
                            disabled={regen.applying}
                            onClick={() => void regen.applyRegeneration()}
                          >
                            {t('edit.regen_use')}
                          </button>
                          <button
                            type="button"
                            className="btn btn--text btn--m"
                            onClick={() => regen.resetRegeneration()}
                          >
                            {t('edit.discard')}
                          </button>
                        </>
                      ) : (
                        <button
                          type="button"
                          className="btn btn--secondary btn--m"
                          disabled={regen.phase === 'generating'}
                          onClick={() => void regen.generatePortrait()}
                        >
                          {regen.phase === 'generating'
                            ? t('edit.regen_generating')
                            : t('edit.regen_cta')}
                        </button>
                      )}
                    </div>
                  </>
                ) : null}
              </section>

              <section className="card edit-companion__card" aria-labelledby="edit-personality">
                <h2 id="edit-personality" className="edit-companion__card-title">
                  {t('edit.section_conversational')}
                </h2>

                <div className="edit-companion__sub">
                  <h3 className="edit-companion__sub-title">Personalidad</h3>
                  <OptionGroup mode="radio" aria-labelledby="edit-personality" cols={4}>
                    {PERSONALITY_OPTIONS.map((option) => (
                      <button
                        key={option}
                        type="button"
                        role="radio"
                        aria-checked={values.persona === option}
                        className="opt opt--personality"
                        onClick={() => patchValues({ persona: option })}
                      >
                        <span className="opt__icon-wrap">
                          <AppIcon name={PERSONALITY_OPTION_ICONS[option]} />
                        </span>
                        <span>{option}</span>
                      </button>
                    ))}
                  </OptionGroup>
                </div>

                <div className="edit-companion__sub">
                  <h3 id="edit-presence" className="edit-companion__sub-title">
                    {t('edit.presence')}
                  </h3>
                  <OptionGroup
                    mode="radio"
                    aria-labelledby="edit-presence"
                    layout="inline"
                    className="seg"
                  >
                    {PRESENCE.map(({ id, labelKey }) => (
                      <button
                        key={id}
                        type="button"
                        role="radio"
                        aria-checked={values.intensity === id}
                        className="seg__item"
                        onClick={() => patchValues({ intensity: id })}
                      >
                        {t(labelKey)}
                      </button>
                    ))}
                  </OptionGroup>
                </div>

                <div className="edit-companion__sub">
                  <h3 id="edit-interests" className="edit-companion__sub-title">
                    {t('edit.interests')}
                  </h3>
                  <OptionGroup mode="toggle" aria-labelledby="edit-interests" cols={6}>
                    {INTEREST_OPTIONS.map((interest) => {
                      const selected = values.interests.includes(interest);
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
                </div>

                <div className="edit-companion__sub">
                  <div className="field">
                    <span id="edit-name" className="field__label">
                      {t('edit.name')}
                    </span>
                    <input
                      className="field__control"
                      type="text"
                      maxLength={20}
                      value={values.companionName}
                      onChange={(e) => patchValues({ companionName: e.target.value })}
                      aria-labelledby="edit-name"
                    />
                  </div>
                </div>
              </section>

              <section className="card edit-companion__card" aria-labelledby="edit-boundaries">
                <h2 id="edit-boundaries" className="edit-companion__card-title">
                  {t('edit.section_limits')}
                </h2>
                <div className="create-how__chip-row">
                  <OptionGroup mode="toggle" aria-labelledby="edit-boundaries" layout="inline">
                    {OPTIONAL_BOUNDARIES.map((option) => {
                      const selected = values.boundaries.includes(option);
                      return (
                        <button
                          key={option}
                          type="button"
                          aria-pressed={selected}
                          className="chip"
                          onClick={() => toggleBoundary(option)}
                        >
                          {option}
                        </button>
                      );
                    })}
                    {!showOtherBoundary ? (
                      <button
                        type="button"
                        className="chip chip--add"
                        onClick={() => setShowOtherBoundary(true)}
                      >
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
                        <input
                          id={otherBoundaryId}
                          className="field__control"
                          type="text"
                          maxLength={60}
                          value={otherBoundary}
                          onChange={(e) => setOtherBoundary(e.target.value)}
                        />
                        <button
                          type="button"
                          className="btn btn--secondary btn--m"
                          onClick={onAddOtherBoundary}
                          aria-label={`Añadir ${t('create.avoid_other').toLowerCase()}`}
                        >
                          +
                        </button>
                      </div>
                    </div>
                  ) : null}
                </div>
                <p className="banner--info" role="note">
                  <AppIcon name="shield-checkmark-outline" />
                  {basicLimitsText}
                </p>
              </section>

              <section className="card edit-companion__card" aria-labelledby="edit-voice">
                <h2 id="edit-voice" className="edit-companion__card-title">
                  {t('edit.voice')}
                </h2>
                <OptionGroup mode="radio" aria-labelledby="edit-voice" layout="inline">
                  {EDIT_VOICE_OPTIONS.map(({ key, label }) => (
                    <button
                      key={key}
                      type="button"
                      role="radio"
                      aria-checked={values.voiceKey === key}
                      className="chip"
                      onClick={() => patchValues({ voiceKey: key })}
                    >
                      {label}
                    </button>
                  ))}
                </OptionGroup>
              </section>

              {saveError ? (
                <p className="banner--error" role="alert">
                  {t('edit.save_error')}
                </p>
              ) : null}
            </div>

            {!comparePhase ? (
              <footer className="edit-companion__bar">
                <button
                  type="button"
                  className="btn btn--primary btn--m"
                  disabled={!conversationalDirty || saving}
                  onClick={() => void saveConversational()}
                >
                  {t('edit.save')}
                </button>
              </footer>
            ) : null}
          </>
        ) : null}
      </div>
    </ChatShell>
  );
}

export default function EditCompanionPage() {
  return (
    <QueryClientProvider client={editQueryClient}>
      <EditCompanionContent />
    </QueryClientProvider>
  );
}
