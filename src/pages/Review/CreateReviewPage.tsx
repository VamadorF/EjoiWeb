import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Navigate, useNavigate } from 'react-router';

import { legalDocuments } from '@/features/auth/assets/legalDocuments';
import { ONBOARDING_STEPS } from '@/features/onboarding/constants/onboardingSteps';
import type { Gender, OnboardingData } from '@/features/onboarding/types';
import { MAX_COMPANION_AVATAR_VARIANTS } from '@/features/companion/constants/avatarVariants';

import { CompanionCard } from '~/features/companion/CompanionCard';
import { canCreateCompanion } from '~/features/companion/canCreateCompanion';
import {
  canGenerateMoreAvatars,
  consumeAvatarCatalogReason,
  getAvatarSession,
  getSelectedAvatarVariant,
  prepareAvatarSession,
  remainingAvatarGenerations,
  selectAvatarVariant,
  setAvatarCatalogReason,
  setAvatarSessionOnboardingData,
  type AvatarCatalogReason,
} from '~/features/creation/avatarSession';
import {
  emptyOnboardingData,
  getOnboardingDraftRecord,
  mergeDraftIntoData,
} from '~/features/creation/onboardingDraft.api';
import { stylePortraitSrcForCard } from '~/features/creation/portraits';
import { generateReviewAvatar } from '~/features/creation/reviewAvatar';
import {
  getCompanionImagePromptKey,
  hasMinimumReviewData,
  intensityLabelForCard,
  isLoginConsentComplete,
  REVISION_EDIT_PATHS,
} from '~/features/creation/reviewHelpers';
import { useGenderedTextWith } from '~/features/gender/useGenderedText';
import { startCreation } from '~/features/creation/startCreation';
import { wizardPathForStep } from '~/features/creation/wizardSteps';
import { LegalDocumentModal } from '~/pages/Welcome/LegalDocumentModal';

import { AvatarCatalogDialog } from './AvatarCatalogDialog';
import { ReviewLegalConsent } from './ReviewLegalConsent';

import './CreateReviewPage.css';

function portraitGenderForCard(gender: Gender | ''): 'femenino' | 'masculino' {
  return gender === 'masculino' ? 'masculino' : 'femenino';
}

function placeholderPortrait(data: OnboardingData): string {
  const style = data.visualStyle === 'anime' ? 'anime' : 'realista';
  return stylePortraitSrcForCard(style, portraitGenderForCard(data.gender));
}

type LegalDocKey = keyof typeof legalDocuments;

export default function CreateReviewPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [data, setData] = useState<OnboardingData | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [adultFromWizard, setAdultFromWizard] = useState(false);
  const [ageConfirmed, setAgeConfirmed] = useState(false);
  const [legalAccepted, setLegalAccepted] = useState(false);
  const [imageLoading, setImageLoading] = useState(true);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [storagePath, setStoragePath] = useState<string | null>(null);
  const [generateError, setGenerateError] = useState(false);
  const [profileChangedNotice, setProfileChangedNotice] = useState(false);
  const [catalogOpen, setCatalogOpen] = useState(false);
  const [catalogReason, setCatalogReasonState] = useState<AvatarCatalogReason | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [legalDocument, setLegalDocument] = useState<LegalDocKey | null>(null);
  const [variantTick, setVariantTick] = useState(0);
  const initialGenerationKeyRef = useRef<string | null>(null);

  const bumpVariants = useCallback(() => setVariantTick((n) => n + 1), []);

  useEffect(() => {
    let active = true;
    void getOnboardingDraftRecord()
      .then((draft) => {
        if (!active) return;
        if (draft?.data) {
          setData(mergeDraftIntoData(emptyOnboardingData(), draft.data));
          setAdultFromWizard(draft.data.webView === 'revision');
        }
        setLoaded(true);
      })
      .catch(() => {
        if (active) setLoaded(true);
      });
    return () => {
      active = false;
    };
  }, []);

  const syncSelectedFromSession = useCallback(() => {
    const selected = getSelectedAvatarVariant();
    setImageUrl(selected?.url ?? null);
    setStoragePath(selected?.storagePath ?? null);
    bumpVariants();
  }, [bumpVariants]);

  const openCatalog = useCallback((reason: AvatarCatalogReason) => {
    setAvatarCatalogReason(reason);
    setCatalogReasonState(reason);
    setCatalogOpen(true);
  }, []);

  const runGeneration = useCallback(
    async (options?: { openCatalogAfter?: boolean; limitReached?: boolean }) => {
      if (!data) return;
      setImageLoading(true);
      setGenerateError(false);
      try {
        const result = await generateReviewAvatar(data);
        if (result?.url) {
          syncSelectedFromSession();
          if (options?.limitReached) openCatalog('limit_reached');
          else if (options?.openCatalogAfter) openCatalog('pick_after_regen');
        } else {
          setImageUrl(null);
          setGenerateError(true);
        }
      } catch {
        setImageUrl(null);
        setGenerateError(true);
      } finally {
        setImageLoading(false);
      }
    },
    [data, openCatalog, syncSelectedFromSession],
  );

  useEffect(() => {
    if (!data || !hasMinimumReviewData(data)) return;
    setAvatarSessionOnboardingData(data);
    const promptKey = getCompanionImagePromptKey(data);
    const sessionMode = prepareAvatarSession(promptKey);

    if (sessionMode === 'profile_changed') {
      setProfileChangedNotice(true);
      initialGenerationKeyRef.current = null;
    }

    if (sessionMode === 'resume') {
      syncSelectedFromSession();
      setImageLoading(false);
      return;
    }

    if (getSelectedAvatarVariant()) {
      syncSelectedFromSession();
      setImageLoading(false);
      return;
    }

    if (initialGenerationKeyRef.current === promptKey) return;
    initialGenerationKeyRef.current = promptKey;
    void runGeneration();
  }, [data, runGeneration, syncSelectedFromSession]);

  useEffect(() => {
    const reason = consumeAvatarCatalogReason();
    if (reason) {
      setCatalogReasonState(reason);
      setCatalogOpen(true);
    }
  }, [variantTick]);

  const genderCopy = useGenderedTextWith((data?.gender ?? '') as Gender);

  const showAgeGate = !adultFromWizard && !ageConfirmed;
  const consentComplete = isLoginConsentComplete(ageConfirmed || adultFromWizard, legalAccepted);

  const canCreate = canCreateCompanion({
    consentComplete,
    isCreating,
    imageLoading,
    avatarUrl: imageUrl,
  });

  const atGenerationLimit = !canGenerateMoreAvatars();
  const remaining = remainingAvatarGenerations();

  const sessionVariants = useMemo(() => {
    void variantTick;
    return [...getAvatarSession().variants];
  }, [variantTick]);

  const selectedVariant = useMemo(() => {
    void variantTick;
    return getSelectedAvatarVariant();
  }, [variantTick]);

  const handleImageAction = () => {
    if (atGenerationLimit) {
      openCatalog('limit_reached');
      return;
    }
    void runGeneration({ openCatalogAfter: true });
  };

  const editImageLabel = atGenerationLimit
    ? t('companion.create.choose_image')
    : remaining > 0
      ? t('companion.create.regenerate_remaining', { count: remaining })
      : t('companion.create.regenerate');

  const handleCreate = async () => {
    if (!data || !canCreate || !imageUrl) return;
    setIsCreating(true);
    try {
      await startCreation(
        {
          data,
          step: ONBOARDING_STEPS.name,
          webView: 'revision',
          avatarUrl: imageUrl,
          avatarStoragePath: storagePath ?? undefined,
        },
        navigate,
      );
    } finally {
      setIsCreating(false);
    }
  };

  if (!loaded) return null;

  if (!data || !hasMinimumReviewData(data)) {
    return <Navigate to={wizardPathForStep(ONBOARDING_STEPS.gender)} replace />;
  }

  const displayName = data.companionName?.trim() || t('companion.create.no_name');
  const portraitSrc = imageUrl ?? placeholderPortrait(data);

  return (
    <div className="create-review" data-testid="create-review-page">
      <div className="create-review__inner">
        <header className="create-review__header">
          <button
            type="button"
            className="btn btn--text btn--s"
            onClick={() => navigate(REVISION_EDIT_PATHS.name)}
          >
            {t('companion.create.back')}
          </button>
          <p className="create-review__step">Paso 4 de 4</p>
        </header>

        {profileChangedNotice ? (
          <p className="create-review__banner create-review__profile-banner" role="status">
            {t('companion.create.profile_changed_body', {
              count: MAX_COMPANION_AVATAR_VARIANTS - 1,
              max: MAX_COMPANION_AVATAR_VARIANTS,
            })}
          </p>
        ) : null}

        {generateError ? (
          <div className="create-review__banner" role="alert">
            <strong>{t('companion.create.generate_failed_title')}</strong>
            <p>{t('companion.create.generate_failed_body')}</p>
          </div>
        ) : null}

        <div className="create-review__layout">
          <CompanionCard
            mode="preview"
            name={displayName}
            imageSrc={portraitSrc}
            imageCacheKey={storagePath ?? imageUrl ?? undefined}
            persona={data.persona}
            interests={data.interests}
            boundaries={data.boundaries}
            visualStyle={data.visualStyle}
            gender={data.gender}
            intensityLabel={intensityLabelForCard(data)}
            imageLoading={imageLoading}
            imageLoadingText={t('companion.create.generating', {
              companion: genderCopy.companion(),
            })}
            onImageLoad={() => {
              if (imageUrl) setImageLoading(false);
            }}
            onImageError={() => setImageLoading(false)}
            onEditImage={handleImageAction}
            editImageLabel={editImageLabel}
            editImageChooseMode={atGenerationLimit}
            onEditName={() => navigate(REVISION_EDIT_PATHS.name)}
            onEditPersona={() => navigate(REVISION_EDIT_PATHS.persona)}
            onEditInterests={() => navigate(REVISION_EDIT_PATHS.interests)}
            onEditBoundaries={() => navigate(REVISION_EDIT_PATHS.boundaries)}
          />

          <aside className="create-review__aside">
            <h2 className="create-review__consent-title">{t('companion.create.consent_title')}</h2>
            <ReviewLegalConsent
              ageConfirmed={ageConfirmed || adultFromWizard}
              legalAccepted={legalAccepted}
              onToggleAge={() => setAgeConfirmed((v) => !v)}
              onToggleLegal={() => setLegalAccepted((v) => !v)}
              onOpenTerms={() => setLegalDocument('termsAndConditions')}
              onOpenPrivacy={() => setLegalDocument('privacyPolicy')}
              disabled={isCreating}
              showAgeGate={showAgeGate}
            />
            {!canCreate && !consentComplete ? (
              <p className="create-review__hint">{t('companion.create.consent_cta_hint')}</p>
            ) : null}
            <button
              type="button"
              className="btn btn--primary btn--l"
              data-testid="review-create-cta"
              disabled={!canCreate}
              onClick={() => void handleCreate()}
            >
              {isCreating
                ? t('companion.create.creating')
                : t('companion.create.create_cta', { companion: genderCopy.companion() })}
            </button>
          </aside>
        </div>
      </div>

      <AvatarCatalogDialog
        open={catalogOpen}
        reason={catalogReason}
        variants={sessionVariants}
        selectedId={selectedVariant?.id ?? null}
        remaining={remaining}
        generating={imageLoading}
        onClose={() => setCatalogOpen(false)}
        onSelect={(id) => {
          selectAvatarVariant(id);
          syncSelectedFromSession();
        }}
        onConfirm={() => {
          syncSelectedFromSession();
          setCatalogOpen(false);
        }}
        onGenerateAnother={() => {
          if (atGenerationLimit) return;
          void runGeneration({ openCatalogAfter: true, limitReached: remaining <= 1 });
        }}
      />

      <LegalDocumentModal
        doc={legalDocument ? legalDocuments[legalDocument] : null}
        onClose={() => setLegalDocument(null)}
      />
    </div>
  );
}
