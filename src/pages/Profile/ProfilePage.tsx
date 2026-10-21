import { useQueryClient } from '@tanstack/react-query';
import { useCallback, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { patchCompanion } from '@/features/companion/api/companion.api';
import { generateAboutMePreview } from '@/shared/utils/companionTextGenerator';
import type { Gender } from '@/features/onboarding/types';

import { EditBoundariesDialog } from '~/features/companion/EditBoundariesDialog';
import { CompanionCard } from '~/features/companion/CompanionCard';
import {
  buildCharacterAttributes,
  buildPhysicalAttributes,
  intensityLabelFromProfile,
} from '~/features/profile/profileAttributes';
import { stylePortraitSrc } from '~/features/creation/portraits';
import { companionProfileQueryKey, useProfile } from '~/features/chat/useProfile';

import '../HomeTabPage.css';
import './ProfilePage.css';

type ProfileSubTab = 'caracter' | 'fisico';

export default function ProfilePage() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const { data: profile, isLoading, isError, refetch } = useProfile(true);

  const [subTab, setSubTab] = useState<ProfileSubTab>('caracter');
  const [boundariesOpen, setBoundariesOpen] = useState(false);
  const [savingBoundaries, setSavingBoundaries] = useState(false);
  const [boundariesError, setBoundariesError] = useState<string | null>(null);
  const lastBoundariesRef = useRef<string[]>([]);

  const companionName = profile?.name?.trim() || 'tu eJoi';
  const samplePortrait =
    profile?.visualStyle && profile?.gender
      ? stylePortraitSrc(
          profile.visualStyle as Parameters<typeof stylePortraitSrc>[0],
          profile.gender as Parameters<typeof stylePortraitSrc>[1],
        )
      : null;
  const imageSrc = profile?.avatarUrl ?? samplePortrait ?? '/portraits/realista-femenino.webp';

  const characterAttributes = useMemo(() => buildCharacterAttributes(profile), [profile]);
  const physicalAttributes = useMemo(() => buildPhysicalAttributes(profile, t), [profile, t]);

  const aboutText = useMemo(() => {
    if (!profile?.persona || !profile.gender) return '';
    return generateAboutMePreview(
      profile.persona,
      intensityLabelFromProfile(profile.intensity),
      profile.gender as Gender,
      profile.interests ?? [],
    );
  }, [profile]);

  const handleSaveBoundaries = useCallback(
    async (boundaries: string[]) => {
      lastBoundariesRef.current = boundaries;
      setBoundariesError(null);
      setSavingBoundaries(true);
      try {
        await patchCompanion({ boundaries });
        await queryClient.invalidateQueries({ queryKey: companionProfileQueryKey });
        setBoundariesOpen(false);
      } catch {
        setBoundariesError(t('home.profile.edit_boundaries_error_body'));
      } finally {
        setSavingBoundaries(false);
      }
    },
    [queryClient, t],
  );

  if (isLoading) {
    return (
      <div className="home-tab-page profile-page" data-testid="home-perfil-tab">
        <div className="home-tab-page__inner">
          <p aria-busy="true">{t('common.loading')}</p>
        </div>
      </div>
    );
  }

  if (isError || !profile) {
    return (
      <div className="home-tab-page profile-page" data-testid="home-perfil-tab">
        <div className="home-tab-page__inner">
          <p role="alert">{t('chat.profile_load_error')}</p>
          <button type="button" className="btn btn--secondary btn--s" onClick={() => void refetch()}>
            {t('common.retry')}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="home-tab-page profile-page" data-testid="home-perfil-tab">
      <div className="home-tab-page__inner">
        {boundariesError ? (
          <div className="banner--error profile-page__banner" role="alert">
            <p>{boundariesError}</p>
            <button
              type="button"
              className="btn btn--text btn--s"
              onClick={() => void handleSaveBoundaries(lastBoundariesRef.current)}
            >
              {t('common.retry')}
            </button>
          </div>
        ) : null}

        <div className="profile-page__card-wrap">
          <CompanionCard
            mode="profile"
            name={companionName}
            imageSrc={imageSrc}
            persona={profile.persona}
            aboutText={aboutText}
            interests={profile.interests ?? []}
            boundaries={profile.boundaries ?? []}
            visualStyle={profile.visualStyle}
            gender={profile.gender}
            ethnicity={profile.ethnicity ?? undefined}
            age={profile.age ?? undefined}
            intensityLabel={intensityLabelFromProfile(profile.intensity)}
            onEditBoundaries={() => setBoundariesOpen(true)}
          />
        </div>

        <section className="card profile-page__attributes" aria-label={t('home.profile.subtab_character')}>
          <div className="profile-page__subtabs" role="tablist">
            <button
              type="button"
              role="tab"
              aria-selected={subTab === 'caracter'}
              className={
                subTab === 'caracter'
                  ? 'profile-page__subtab profile-page__subtab--active'
                  : 'profile-page__subtab'
              }
              onClick={() => setSubTab('caracter')}
            >
              {t('home.profile.subtab_character')}
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={subTab === 'fisico'}
              className={
                subTab === 'fisico'
                  ? 'profile-page__subtab profile-page__subtab--active'
                  : 'profile-page__subtab'
              }
              onClick={() => setSubTab('fisico')}
            >
              {t('home.profile.subtab_physical')}
            </button>
          </div>

          <ul className="profile-page__attr-list">
            {(subTab === 'fisico' ? physicalAttributes : characterAttributes).map((attr, index) => (
              <li key={index} className="profile-page__attr-row">
                {typeof attr === 'string' ? attr : attr.label}
              </li>
            ))}
          </ul>
        </section>
      </div>

      <EditBoundariesDialog
        open={boundariesOpen}
        initialBoundaries={profile.boundaries ?? []}
        isSaving={savingBoundaries}
        onClose={() => setBoundariesOpen(false)}
        onSave={handleSaveBoundaries}
      />
    </div>
  );
}
