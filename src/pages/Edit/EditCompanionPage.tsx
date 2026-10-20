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
import { stylePortraitSrcForCard } from '~/features/creation/portraits';
import { ChatShell } from '~/layout/ChatShell';
import { OptionGroup } from '~/layout/OptionGroup';
import { useDesktopShortcuts } from '~/layout/useDesktopShortcuts';
import { ENABLE_AGE, ENABLE_ETHNICITY } from '~/platform/env';

import '../CreateWho/CreateWhoPage.css';
import '../CreateHow/CreateHowPage.css';
import './EditCompanionPage.css';

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
  };

  const profileDraft = useMemo(
    () => (values ? toProfilePanelDraft(values) : null),
    [values],
  );

  const previewPortrait =
    regen.phase === 'compare' && regen.pendingPortrait
      ? regen.pendingPortrait.fileUrl
      : profile?.avatarUrl ?? null;

  useDesktopShortcuts({
    escapeTo: '/chat',
    canContinue: conversationalDirty && !saving,
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
        />
      }
    >
      <div className="edit-companion create-who" data-testid="edit-companion-page">
        <header className="edit-companion__header">
          <h1>{t('edit.title')}</h1>
          <Link to="/chat">{t('edit.back_chat')}</Link>
        </header>

        {loaded && values ? (
          <>
            <section className="create-who__section" aria-labelledby="edit-appearance">
              <h2 id="edit-appearance" className="create-who__label">
                {t('edit.section_appearance')}
              </h2>
              <p className="create-how__basic-limits" role="note">
                {regen.appearanceDirty ? t('edit.regen_needed') : t('edit.appearance_hint')}
              </p>

              <h3 id="edit-style" className="create-who__label">
                {t('edit.style')}
              </h3>
              <OptionGroup mode="radio" aria-labelledby="edit-style" cols={3}>
                {STYLES.map(({ id, labelKey }) => (
                  <button
                    key={id}
                    type="button"
                    role="radio"
                    aria-checked={values.visualStyle === id}
                    className={
                      values.visualStyle === id ? 'create-option create-option--selected' : 'create-option'
                    }
                    onClick={() => patchValues({ visualStyle: id })}
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

              <h3 id="edit-gender" className="create-who__label">
                {t('edit.gender')}
              </h3>
              <OptionGroup mode="radio" aria-labelledby="edit-gender" cols={3}>
                {GENDERS.map(({ id, label }) => (
                  <button
                    key={id}
                    type="button"
                    role="radio"
                    aria-checked={values.gender === id}
                    className={values.gender === id ? 'create-option create-option--selected' : 'create-option'}
                    onClick={() => patchValues({ gender: id })}
                  >
                    {label}
                  </button>
                ))}
              </OptionGroup>

              {ENABLE_ETHNICITY ? (
                <>
                  <h3 id="edit-ethnicity" className="create-who__label">
                    {t('edit.ethnicity')}
                  </h3>
                  <OptionGroup mode="radio" aria-labelledby="edit-ethnicity" cols={4}>
                    <button
                      type="button"
                      role="radio"
                      aria-checked={!values.ethnicity}
                      className={!values.ethnicity ? 'create-option create-option--selected' : 'create-option'}
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
                        className={
                          values.ethnicity === ETHNICITY_LABELS[id]
                            ? 'create-option create-option--selected'
                            : 'create-option'
                        }
                        onClick={() => patchValues({ ethnicity: ETHNICITY_LABELS[id] })}
                      >
                        {ETHNICITY_LABELS[id]}
                      </button>
                    ))}
                  </OptionGroup>
                </>
              ) : null}

              {ENABLE_AGE ? (
                <>
                  <h3 id="edit-age" className="create-who__label">
                    {t('edit.age')}
                  </h3>
                  <input
                    className="create-who__age"
                    type="number"
                    min={COMPANION_MIN_AGE}
                    max={COMPANION_MAX_AGE}
                    value={values.age}
                    onChange={(e) => patchValues({ age: Number(e.target.value) })}
                    aria-labelledby="edit-age"
                  />
                </>
              ) : null}

              {regen.appearanceDirty ? (
                <div className="edit-companion__regen">
                  {regen.phase === 'compare' && regen.pendingPortrait && profile?.avatarUrl ? (
                    <div className="edit-companion__regen-compare">
                      <figure>
                        <img src={profile.avatarUrl} alt="" />
                        <figcaption>{t('edit.regen_current')}</figcaption>
                      </figure>
                      <figure>
                        <img src={regen.pendingPortrait.fileUrl} alt="" />
                        <figcaption>{t('edit.regen_new')}</figcaption>
                      </figure>
                    </div>
                  ) : null}
                  {regen.phase === 'error' ? (
                    <p className="edit-companion__error" role="alert">
                      {t('edit.regen_error')}
                    </p>
                  ) : null}
                  <div className="edit-companion__actions">
                    {regen.phase !== 'compare' ? (
                      <button
                        type="button"
                        className="create-who__continue"
                        disabled={regen.phase === 'generating'}
                        onClick={() => void regen.generatePortrait()}
                      >
                        {regen.phase === 'generating' ? t('edit.regen_generating') : t('edit.regen_cta')}
                      </button>
                    ) : (
                      <button
                        type="button"
                        className="create-who__continue"
                        disabled={regen.applying}
                        onClick={() => void regen.applyRegeneration()}
                      >
                        {t('edit.regen_use')}
                      </button>
                    )}
                  </div>
                </div>
              ) : null}
            </section>

            <section className="create-who__section" aria-labelledby="edit-personality">
              <h2 id="edit-personality" className="create-who__label">
                {t('edit.section_conversational')}
              </h2>
              <OptionGroup mode="radio" aria-labelledby="edit-personality" cols={4}>
                {PERSONALITY_OPTIONS.map((option) => (
                  <button
                    key={option}
                    type="button"
                    role="radio"
                    aria-checked={values.persona === option}
                    className={
                      values.persona === option ? 'create-option create-option--selected' : 'create-option'
                    }
                    onClick={() => patchValues({ persona: option })}
                  >
                    <AppIcon name={PERSONALITY_OPTION_ICONS[option]} />
                    <span>{option}</span>
                  </button>
                ))}
              </OptionGroup>

              <h3 id="edit-presence" className="create-who__label">
                {t('edit.presence')}
              </h3>
              <OptionGroup
                mode="radio"
                aria-labelledby="edit-presence"
                layout="inline"
                className="create-how__presence"
              >
                {PRESENCE.map(({ id, labelKey }) => (
                  <button
                    key={id}
                    type="button"
                    role="radio"
                    aria-checked={values.intensity === id}
                    className={
                      values.intensity === id
                        ? 'create-how__presence-btn create-how__presence-btn--selected'
                        : 'create-how__presence-btn'
                    }
                    onClick={() => patchValues({ intensity: id })}
                  >
                    {t(labelKey)}
                  </button>
                ))}
              </OptionGroup>

              <h3 id="edit-interests" className="create-who__label">
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
                      className={selected ? 'create-option create-option--selected' : 'create-option'}
                      onClick={() => toggleInterest(interest)}
                    >
                      <AppIcon name={INTEREST_OPTION_ICONS[interest]} />
                      <span>{interest}</span>
                    </button>
                  );
                })}
              </OptionGroup>

              <h3 id="edit-boundaries" className="create-who__label">
                {t('edit.boundaries')}
              </h3>
              <p className="create-how__basic-limits" role="note">
                {t('create.basic_limits', { limits: BASIC_BOUNDARIES.join(', ') })}
              </p>
              <OptionGroup mode="toggle" aria-labelledby="edit-boundaries" cols={3}>
                {OPTIONAL_BOUNDARIES.map((option) => {
                  const selected = values.boundaries.includes(option);
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
                  <button type="button" className="create-how__other-add" onClick={onAddOtherBoundary}>
                    +
                  </button>
                </div>
              </div>

              <h3 id="edit-voice" className="create-who__label">
                {t('edit.voice')}
              </h3>
              <select
                className="create-how__name-input"
                value={values.voiceKey}
                onChange={(e) => patchValues({ voiceKey: e.target.value })}
                aria-labelledby="edit-voice"
              >
                {EDIT_VOICE_OPTIONS.map(({ key, label }) => (
                  <option key={key} value={key}>
                    {label}
                  </option>
                ))}
              </select>

              <h3 id="edit-name" className="create-who__label">
                {t('edit.name')}
              </h3>
              <input
                className="create-how__name-input"
                type="text"
                maxLength={20}
                value={values.companionName}
                onChange={(e) => patchValues({ companionName: e.target.value })}
                aria-labelledby="edit-name"
              />

              {saveError ? (
                <p className="edit-companion__error" role="alert">
                  {t('edit.save_error')}
                </p>
              ) : null}

              <div className="edit-companion__actions">
                <button
                  type="button"
                  className="create-who__continue"
                  disabled={!conversationalDirty || saving}
                  onClick={() => void saveConversational()}
                >
                  {t('edit.save')}
                </button>
              </div>
            </section>
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
