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
import type { CompanionIntensity, VisualStyle } from '@/features/onboarding/types';
import { COMPANION_MAX_AGE, COMPANION_MIN_AGE } from '@/features/onboarding/constants/onboardingSteps';

import { AppIcon } from '~/components/AppIcon';
import { ProfilePanel } from '~/features/chat/ProfilePanel';
import { SideMenu } from '~/features/chat/SideMenu';
import { EditSummaryRow } from '~/features/edit/EditSummaryRow';
import { hasAppearanceChanges, type EditFormSnapshot } from '~/features/edit/editPatch';
import {
  appearanceSummaryRows,
  conversationSummaryRows,
  summaryRowValue,
  type EditSectionId,
} from '~/features/edit/editSections';
import { toProfilePanelDraft } from '~/features/edit/editPatch';
import { useEditForm } from '~/features/edit/useEditForm';
import { useRegeneration } from '~/features/edit/useRegeneration';
import { useSectionDialog } from '~/features/edit/useSectionDialog';
import { EDIT_VOICE_OPTIONS } from '~/features/edit/voiceOptions';
import { stylePortraitSrcForCard, visualStyleSelectorOptions } from '~/features/creation/portraits';
import { useGenderedTextWith } from '~/features/gender/useGenderedText';
import { validators } from '@/shared/utils/validators';
import { ChatShell } from '~/layout/ChatShell';
import { OptionGroup } from '~/layout/OptionGroup';
import { useDesktopShortcuts } from '~/layout/useDesktopShortcuts';
import { ENABLE_AGE, ENABLE_ETHNICITY } from '~/platform/env';
import { HAIR_COLOR_OPTIONS } from '~/theme/hairSwatches';

import '../CreateWizard/CreateWizardHow.css';
import '../CreateWizard/CreateWizardWho.css';
import './EditCompanionPage.css';

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
  const [activeSection, setActiveSection] = useState<EditSectionId | null>(null);
  const [draft, setDraft] = useState<EditFormSnapshot | null>(null);
  const [nameTouched, setNameTouched] = useState(false);

  const {
    loaded,
    loadError,
    profile,
    baseline,
    values,
    saving,
    saveError,
    saveConversationalSection,
    reload,
    syncFromProfile,
  } = useEditForm(editQueryClient);

  const regenSource = activeSection === 'appearance' && draft ? draft : values;
  const gendered = useGenderedTextWith((regenSource?.gender ?? '') as '' | 'femenino' | 'masculino' | 'neutro');
  const editName = draft?.companionName ?? values?.companionName ?? '';
  const editNameError = nameTouched && editName.length > 0 ? validators.getNameError(editName) : null;
  const regen = useRegeneration({
    queryClient: editQueryClient,
    baseline,
    values: regenSource,
    profile,
    onApplied: syncFromProfile,
  });

  const clearSection = useCallback(() => {
    setActiveSection(null);
    setDraft(null);
    setShowOtherBoundary(false);
    setOtherBoundary('');
    regen.resetRegeneration();
  }, [regen]);

  const { dialogRef, open, close } = useSectionDialog(clearSection);

  const styleOptions = useMemo(() => visualStyleSelectorOptions(), []);
  const basicLimitsText = useMemo(
    () => t('create.basic_limits', { limits: BASIC_BOUNDARIES.join(', ') }),
    [t],
  );

  const openSection = (section: EditSectionId, trigger: HTMLButtonElement) => {
    if (!values) return;
    setActiveSection(section);
    setDraft({ ...values });
    regen.resetRegeneration();
    open(trigger);
  };

  const patchDraft = useCallback(
    (patch: Partial<NonNullable<typeof draft>>) => {
      setDraft((prev) => (prev ? { ...prev, ...patch } : prev));
      if (regen.phase !== 'generating') {
        regen.resetRegeneration();
      }
    },
    [regen],
  );

  const profileDraft = useMemo(
    () => (values ? toProfilePanelDraft(values) : null),
    [values],
  );

  const previewPortrait =
    regen.phase === 'compare' && regen.pendingPortrait
      ? regen.pendingPortrait.fileUrl
      : profile?.avatarUrl ?? null;

  const appearanceDirty =
    baseline != null && draft != null && hasAppearanceChanges(baseline, draft);
  const comparePhase = regen.phase === 'compare';

  useDesktopShortcuts({
    escapeTo: '/chat',
    escapeEnabled: !activeSection,
  });

  const onSaveSection = async () => {
    if (!draft || !activeSection || activeSection === 'appearance') return;
    const ok = await saveConversationalSection(activeSection, draft);
    if (ok) close();
  };

  const onSaveAppearance = async () => {
    if (!draft || !baseline || !appearanceDirty) return;
    if (comparePhase) {
      const ok = await regen.applyRegeneration(draft);
      if (ok) close();
      return;
    }
    await regen.generatePortrait(draft);
  };

  const dialogTitleKey = (() => {
    switch (activeSection) {
      case 'appearance':
        return 'edit.group_appearance';
      case 'personality':
        return 'edit.personality';
      case 'presence':
        return 'edit.presence';
      case 'interests':
        return 'edit.interests';
      case 'boundaries':
        return 'edit.boundaries';
      case 'voice':
        return 'edit.voice';
      default:
        return 'edit.title';
    }
  })();

  const sectionCanSave =
    draft &&
    activeSection &&
    activeSection !== 'appearance' &&
    baseline &&
    JSON.stringify(
      buildSectionSlice(baseline, activeSection),
    ) !== JSON.stringify(buildSectionSlice(draft, activeSection));

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
          unsaved={regen.appearanceDirty}
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
          <div className="edit-companion__scroll">
            <p className="banner--info edit-companion__banner" role="note">
              <AppIcon name="information-circle-outline" />
              {t('edit.advanced_banner')}
            </p>

            <section className="card edit-companion__card" aria-labelledby="edit-group-appearance">
              <h2 id="edit-group-appearance" className="edit-companion__card-title">
                {t('edit.group_appearance')}
              </h2>
              <div className="edit-companion__rows">
                {appearanceSummaryRows().map((row) => (
                  <EditSummaryRow
                    key={row.id}
                    testId={row.testId}
                    label={t(row.labelKey)}
                    value={summaryRowValue(row.id, values, t)}
                    onOpen={(trigger) => openSection('appearance', trigger)}
                  />
                ))}
              </div>
            </section>

            <section className="card edit-companion__card" aria-labelledby="edit-group-conversation">
              <h2 id="edit-group-conversation" className="edit-companion__card-title">
                {t('edit.group_conversation')}
              </h2>
              <div className="edit-companion__rows">
                {conversationSummaryRows.map((row) => (
                  <EditSummaryRow
                    key={row.id}
                    testId={row.testId}
                    label={t(row.labelKey)}
                    value={summaryRowValue(row.id, values, t)}
                    onOpen={(trigger) => openSection(row.section, trigger)}
                  />
                ))}
              </div>
            </section>

            {saveError ? (
              <p className="banner--error" role="alert">
                {t('edit.save_error')}
              </p>
            ) : null}
          </div>
        ) : null}

        <dialog
          ref={dialogRef}
          className="edit-section-dialog"
          data-testid="edit-section-dialog"
        >
          {draft && activeSection ? (
            <>
              <h2 className="edit-section-dialog__title">{t(dialogTitleKey)}</h2>
              <div className="edit-section-dialog__body">
                {activeSection === 'appearance' ? (
                  <>
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
                            aria-checked={draft.visualStyle === id}
                            className="opt opt--style"
                            onClick={() => patchDraft({ visualStyle: id as VisualStyle })}
                          >
                            <img
                              className="opt__thumb"
                              src={stylePortraitSrcForCard(
                                id,
                                draft.gender === 'masculino' ? 'masculino' : 'femenino',
                              )}
                              alt=""
                            />
                            <span>{t(labelKey)}</span>
                          </button>
                        ))}
                      </OptionGroup>
                    </div>

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
                              disabled={draft.age <= COMPANION_MIN_AGE}
                              onClick={() =>
                                patchDraft({ age: Math.max(COMPANION_MIN_AGE, draft.age - 1) })
                              }
                            >
                              <AppIcon name="remove-outline" />
                            </button>
                            <span className="stepper__value" aria-live="polite">
                              {draft.age}
                            </span>
                            <button
                              type="button"
                              className="btn btn--icon btn--secondary"
                              aria-label="Aumentar edad"
                              disabled={draft.age >= COMPANION_MAX_AGE}
                              onClick={() =>
                                patchDraft({ age: Math.min(COMPANION_MAX_AGE, draft.age + 1) })
                              }
                            >
                              <AppIcon name="add-outline" />
                            </button>
                          </div>
                          <span className="create-who__age-unit">{t('create.age_unit')}</span>
                        </div>
                      </div>
                    ) : null}

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
                            aria-checked={!draft.ethnicity}
                            className="chip"
                            onClick={() => patchDraft({ ethnicity: undefined })}
                          >
                            {t('edit.no_preference')}
                          </button>
                          {ETHNICITY_IDS.map((id) => (
                            <button
                              key={id}
                              type="button"
                              role="radio"
                              aria-checked={draft.ethnicity === ETHNICITY_LABELS[id]}
                              className="chip"
                              onClick={() => patchDraft({ ethnicity: ETHNICITY_LABELS[id] })}
                            >
                              {ETHNICITY_LABELS[id]}
                            </button>
                          ))}
                        </OptionGroup>
                      </div>
                    ) : null}

                    <div className="edit-companion__sub">
                      <h3 id="edit-hair" className="edit-companion__sub-title">
                        {t('edit.hair')}
                      </h3>
                      <OptionGroup mode="radio" aria-labelledby="edit-hair" layout="inline" className="edit-hair-swatches">
                        {HAIR_COLOR_OPTIONS.map(({ value, labelKey, swatch }) => {
                          const selected = draft.hairColor === value;
                          return (
                            <button
                              key={value}
                              type="button"
                              role="radio"
                              aria-checked={selected}
                              className={`edit-hair-swatch${selected ? ' edit-hair-swatch--selected' : ''}`}
                              onClick={() => patchDraft({ hairColor: value })}
                            >
                              <span
                                className="edit-hair-swatch__circle"
                                style={{ backgroundColor: swatch }}
                              >
                                {selected ? <AppIcon name="checkmark" /> : null}
                              </span>
                              <span className="edit-hair-swatch__label">{t(labelKey)}</span>
                            </button>
                          );
                        })}
                      </OptionGroup>
                      {draft.hairColor ? (
                        <p className="edit-hair-swatch__chosen">
                          {t(
                            HAIR_COLOR_OPTIONS.find((o) => o.value === draft.hairColor)?.labelKey ??
                              'edit.hair',
                          )}
                        </p>
                      ) : null}
                    </div>

                    {appearanceDirty ? (
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
                      </>
                    ) : null}
                  </>
                ) : null}

                {activeSection === 'personality' ? (
                  <>
                    <div className="edit-companion__sub">
                      <OptionGroup mode="radio" aria-labelledby="edit-personality-grid" cols={4}>
                        {PERSONALITY_OPTIONS.map((option) => (
                          <button
                            key={option}
                            type="button"
                            role="radio"
                            aria-checked={draft.persona === option}
                            className="opt opt--personality"
                            onClick={() => patchDraft({ persona: option })}
                          >
                            <span className="opt__icon-wrap">
                              <AppIcon name={PERSONALITY_OPTION_ICONS[option]} />
                            </span>
                            <span>{gendered.trait(option)}</span>
                          </button>
                        ))}
                      </OptionGroup>
                      <span id="edit-personality-grid" className="visually-hidden">
                        {t('edit.personality')}
                      </span>
                    </div>
                    <div className="field">
                      <span id="edit-name" className="field__label">
                        {t('edit.name')}
                      </span>
                      <input
                        className={`field__control${editNameError ? ' field__control--error' : ''}`}
                        type="text"
                        maxLength={20}
                        value={draft.companionName}
                        aria-invalid={editNameError ? true : undefined}
                        onChange={(e) => patchDraft({ companionName: e.target.value })}
                        onBlur={() => setNameTouched(true)}
                        aria-labelledby="edit-name"
                      />
                      {editNameError ? (
                        <p className="field__error" role="alert">
                          {editNameError}
                        </p>
                      ) : null}
                    </div>
                  </>
                ) : null}

                {activeSection === 'presence' ? (
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
                        aria-checked={draft.intensity === id}
                        className="seg__item"
                        onClick={() => patchDraft({ intensity: id })}
                      >
                        {t(labelKey)}
                      </button>
                    ))}
                    <span id="edit-presence" className="visually-hidden">
                      {t('edit.presence')}
                    </span>
                  </OptionGroup>
                ) : null}

                {activeSection === 'interests' ? (
                  <OptionGroup mode="toggle" aria-labelledby="edit-interests" cols={6}>
                    {INTEREST_OPTIONS.map((interest) => {
                      const selected = draft.interests.includes(interest);
                      return (
                        <button
                          key={interest}
                          type="button"
                          aria-pressed={selected}
                          className="chip"
                          onClick={() => {
                            const removing = draft.interests.includes(interest);
                            patchDraft({
                              interests: removing
                                ? draft.interests.filter((i) => i !== interest)
                                : [...draft.interests, interest],
                            });
                          }}
                        >
                          <AppIcon name={INTEREST_OPTION_ICONS[interest]} />
                          <span>{interest}</span>
                        </button>
                      );
                    })}
                    <span id="edit-interests" className="visually-hidden">
                      {t('edit.interests')}
                    </span>
                  </OptionGroup>
                ) : null}

                {activeSection === 'boundaries' ? (
                  <>
                    <div className="create-how__chip-row">
                      <OptionGroup mode="toggle" aria-labelledby="edit-boundaries" layout="inline">
                        {OPTIONAL_BOUNDARIES.map((option) => {
                          const selected = draft.boundaries.includes(option);
                          return (
                            <button
                              key={option}
                              type="button"
                              aria-pressed={selected}
                              className="chip"
                              onClick={() => {
                                const removing = draft.boundaries.includes(option);
                                patchDraft({
                                  boundaries: removing
                                    ? draft.boundaries.filter((b) => b !== option)
                                    : [...draft.boundaries, option],
                                });
                              }}
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
                              onClick={() => {
                                const trimmed = otherBoundary.trim();
                                if (!trimmed || trimmed.length > 60) return;
                                if (!draft.boundaries.includes(trimmed)) {
                                  patchDraft({ boundaries: [...draft.boundaries, trimmed] });
                                }
                                setOtherBoundary('');
                                setShowOtherBoundary(false);
                              }}
                              aria-label={`Añadir ${t('create.avoid_other').toLowerCase()}`}
                            >
                              +
                            </button>
                          </div>
                        </div>
                      ) : null}
                      <span id="edit-boundaries" className="visually-hidden">
                        {t('edit.boundaries')}
                      </span>
                    </div>
                    <p className="banner--info" role="note">
                      <AppIcon name="shield-checkmark-outline" />
                      {basicLimitsText}
                    </p>
                  </>
                ) : null}

                {activeSection === 'voice' ? (
                  <OptionGroup mode="radio" aria-labelledby="edit-voice">
                    {EDIT_VOICE_OPTIONS.map(({ key, label }) => (
                      <button
                        key={key}
                        type="button"
                        role="radio"
                        aria-checked={draft.voiceKey === key}
                        className="chip"
                        onClick={() => patchDraft({ voiceKey: key })}
                      >
                        {label}
                      </button>
                    ))}
                    <span id="edit-voice" className="visually-hidden">
                      {t('edit.voice')}
                    </span>
                  </OptionGroup>
                ) : null}
              </div>

              <div className="edit-section-dialog__actions">
                {activeSection === 'appearance' && appearanceDirty ? (
                  <button
                    type="button"
                    className="btn btn--primary btn--m"
                    data-testid="edit-save-appearance"
                    disabled={regen.phase === 'generating' || regen.applying}
                    onClick={() => void onSaveAppearance()}
                  >
                    {comparePhase
                      ? t('edit.regen_use')
                      : regen.phase === 'generating'
                        ? t('edit.regen_generating')
                        : t('edit.save_and_generate')}
                  </button>
                ) : null}
                {activeSection !== 'appearance' && sectionCanSave ? (
                  <button
                    type="button"
                    className="btn btn--primary btn--m"
                    data-testid="edit-save-section"
                    disabled={saving}
                    onClick={() => void onSaveSection()}
                  >
                    {t('edit.save')}
                  </button>
                ) : null}
                <button
                  type="button"
                  className="btn btn--secondary btn--m"
                  data-testid="edit-dialog-cancel"
                  onClick={close}
                >
                  {t('edit.cancel')}
                </button>
              </div>
            </>
          ) : null}
        </dialog>
      </div>
    </ChatShell>
  );
}

function buildSectionSlice(form: EditFormSnapshot, section: EditSectionId) {
  switch (section) {
    case 'personality':
      return { persona: form.persona, companionName: form.companionName };
    case 'presence':
      return { intensity: form.intensity };
    case 'interests':
      return { interests: form.interests };
    case 'boundaries':
      return { boundaries: form.boundaries };
    case 'voice':
      return { voiceKey: form.voiceKey };
    default:
      return {};
  }
}

export default function EditCompanionPage() {
  return (
    <QueryClientProvider client={editQueryClient}>
      <EditCompanionContent />
    </QueryClientProvider>
  );
}
