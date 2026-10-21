import { Link } from 'react-router';
import { useTranslation } from 'react-i18next';

import type { OnboardingData } from '@/features/onboarding/types';

import { hairColorLabelKey } from '~/theme/hairSwatches';
import { ENABLE_AGE, ENABLE_ETHNICITY } from '~/platform/env';

import type { CompanionProfile } from './useProfile';
import './ProfilePanel.css';

const GENDER_LABELS: Record<string, string> = {
  femenino: 'Femenino',
  masculino: 'Masculino',
  neutro: 'Neutro',
};

const STYLE_LABELS: Record<string, string> = {
  realista: 'Realista',
  anime: 'Ilustrado',
};

const INTENSITY_KEYS: Record<string, 'create.presence_soft' | 'create.presence_balanced' | 'create.presence_intense'> =
  {
    soft: 'create.presence_soft',
    balanced: 'create.presence_balanced',
    intense: 'create.presence_intense',
  };

export type ProfilePanelDraft = Pick<
  OnboardingData,
  'companionName' | 'persona' | 'intensity' | 'interests' | 'boundaries' | 'visualStyle' | 'gender' | 'ethnicity' | 'age'
> & { hairColor?: string };

export type ProfilePanelProps = {
  profile?: CompanionProfile | null;
  draft?: ProfilePanelDraft | null;
  profileLoading?: boolean;
  profileError?: boolean;
  onRetryProfile?: () => void;
  portraitUrl?: string | null;
  portraitBlur?: boolean;
  portraitPendingLabel?: string | null;
  onRetryPortrait?: () => void;
  showOnline?: boolean;
  unsaved?: boolean;
};

function mergeProfileView(
  profile: CompanionProfile | null | undefined,
  draft: ProfilePanelDraft | null | undefined,
): {
  name: string;
  persona?: string;
  intensity?: string;
  interests: string[];
  boundaries: string[];
  visualStyle?: string;
  gender?: string;
  ethnicity?: string;
  hairColor?: string;
  age?: number;
} {
  return {
    name: profile?.name?.trim() || draft?.companionName?.trim() || 'tu eJoi',
    persona: profile?.persona ?? draft?.persona,
    intensity: profile?.intensity ?? draft?.intensity,
    interests: profile?.interests?.length ? profile.interests : (draft?.interests ?? []),
    boundaries: profile?.boundaries?.length ? profile.boundaries : (draft?.boundaries ?? []),
    visualStyle: profile?.visualStyle ?? draft?.visualStyle,
    gender: profile?.gender ?? draft?.gender,
    ethnicity: profile?.ethnicity?.trim() || draft?.ethnicity?.trim(),
    hairColor: profile?.hairColor?.trim() || draft?.hairColor?.trim(),
    age: profile?.age ?? draft?.age,
  };
}

export function ProfilePanel({
  profile,
  draft,
  profileLoading,
  profileError,
  onRetryProfile,
  portraitUrl,
  portraitBlur,
  portraitPendingLabel,
  onRetryPortrait,
  showOnline,
  unsaved,
}: ProfilePanelProps) {
  const { t } = useTranslation('web');
  const view = mergeProfileView(profile, draft);
  const intensityKey = view.intensity ? INTENSITY_KEYS[view.intensity] : undefined;
  const traitPills: string[] = [];
  if (view.persona?.trim()) traitPills.push(view.persona.trim());
  if (intensityKey) traitPills.push(t(intensityKey));

  const appearanceParts: string[] = [];
  if (view.visualStyle) {
    appearanceParts.push(STYLE_LABELS[view.visualStyle] ?? view.visualStyle);
  }
  if (view.gender) {
    appearanceParts.push(GENDER_LABELS[view.gender] ?? view.gender);
  }
  if (ENABLE_AGE && typeof view.age === 'number') {
    appearanceParts.push(t('chat.profile_age', { count: view.age }));
  }
  if (ENABLE_ETHNICITY && view.ethnicity) {
    appearanceParts.push(view.ethnicity);
  }
  if (view.hairColor) {
    const hairKey = hairColorLabelKey(view.hairColor);
    appearanceParts.push(hairKey ? t(hairKey) : view.hairColor);
  }

  const hasProfileMore = view.boundaries.length > 0 || appearanceParts.length > 0;

  return (
    <div className="chat-profile-panel" data-testid="chat-profile-card">
      {profileLoading ? (
        <div className="chat-profile-panel__skeleton" data-testid="chat-profile-loading" aria-busy="true">
          <div className="chat-profile-panel__skeleton-block" />
          <div className="chat-profile-panel__skeleton-line" />
          <div className="chat-profile-panel__skeleton-line chat-profile-panel__skeleton-line--short" />
        </div>
      ) : null}

      {profileError ? (
        <div className="chat-profile-panel__error" role="alert" data-testid="chat-profile-error">
          <p>{t('chat.profile_load_error')}</p>
          {onRetryProfile ? (
            <button type="button" onClick={onRetryProfile}>
              {t('chat.retry')}
            </button>
          ) : null}
        </div>
      ) : null}

      {!profileLoading ? (
        <>
          {portraitUrl ? (
            <div className="chat-profile-card__portrait-wrap">
              <img
                src={portraitUrl}
                alt=""
                className={`avatar avatar--132 chat-profile-card__portrait${
                  portraitBlur ? ' avatar--blur' : ''
                }`}
              />
              {portraitBlur && portraitPendingLabel ? (
                <span className="chat-profile-card__portrait-label">{portraitPendingLabel}</span>
              ) : null}
            </div>
          ) : null}

          <h2 className="chat-profile-panel__name">{view.name}</h2>
          {unsaved ? (
            <span className="pill" data-testid="chat-profile-unsaved">
              {t('edit.unsaved')}
            </span>
          ) : null}
          {showOnline ? <p className="chat-profile-panel__online">{t('chat.online')}</p> : null}

          {traitPills.length > 0 ? (
            <ul className="chat-profile-panel__pills chat-profile-panel__traits">
              {traitPills.map((label) => (
                <li key={label}>
                  <span className="pill">{label}</span>
                </li>
              ))}
            </ul>
          ) : null}

          {view.interests.length > 0 ? (
            <section className="chat-profile-panel__section">
              <h3 className="label chat-profile-panel__label">{t('chat.profile_interests')}</h3>
              <ul className="chat-profile-panel__pills">
                {view.interests.map((interest) => (
                  <li key={interest}>
                    <span className="pill">{interest}</span>
                  </li>
                ))}
              </ul>
            </section>
          ) : null}

          {hasProfileMore ? (
            <details className="chat-profile-panel__more" data-testid="chat-profile-more">
              <summary className="chat-profile-panel__more-summary">{t('chat.profile_more')}</summary>
              {view.boundaries.length > 0 ? (
                <section className="chat-profile-panel__section">
                  <h3 className="label chat-profile-panel__label">{t('profile.avoids')}</h3>
                  <ul className="chat-profile-panel__pills">
                    {view.boundaries.map((boundary) => (
                      <li key={boundary}>
                        <span className="pill">{boundary}</span>
                      </li>
                    ))}
                  </ul>
                </section>
              ) : null}
              {appearanceParts.length > 0 ? (
                <section className="chat-profile-panel__section">
                  <h3 className="label chat-profile-panel__label">{t('chat.profile_appearance')}</h3>
                  <p className="chat-profile-panel__text">{appearanceParts.join(' · ')}</p>
                </section>
              ) : null}
            </details>
          ) : null}

          {onRetryPortrait ? (
            <button type="button" className="chat-profile-card__retry" onClick={onRetryPortrait}>
              {t('chat.portrait_retry')}
            </button>
          ) : null}

          <Link to="/chat/editar" className="btn btn--secondary btn--m chat-profile-panel__edit">
            {t('menu.edit')}
          </Link>
        </>
      ) : null}
    </div>
  );
}
