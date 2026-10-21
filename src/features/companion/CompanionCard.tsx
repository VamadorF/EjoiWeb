import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';

import type { Gender } from '@/features/onboarding/types';
import { formatGenderedTrait } from '@/shared/utils/genderedText';
import { generateAboutMePreview } from '@/shared/utils/companionTextGenerator';
import { resolveCompanionAge } from '@/shared/utils/companionAgeAppearance';

import { AppIcon } from '~/components/AppIcon';

import './CompanionCard.css';

export type CompanionCardMode = 'preview' | 'profile';

export type CompanionCardProps = {
  mode?: CompanionCardMode;
  name: string;
  imageSrc: string;
  imageCacheKey?: string;
  persona?: string;
  tone?: string;
  aboutText?: string;
  interests?: string[];
  boundaries?: string[];
  visualStyle?: string;
  gender?: string;
  interactionStyle?: string;
  conversationDepth?: string;
  ethnicity?: string;
  age?: number;
  imageLoading?: boolean;
  imageLoadingText?: string;
  primaryActionLabel?: string;
  onPrimaryAction?: () => void;
  onEditImage?: () => void;
  editImageLabel?: string;
  editImageChooseMode?: boolean;
  onEditName?: () => void;
  onEditPersona?: () => void;
  onEditInterests?: () => void;
  onEditBoundaries?: () => void;
  onImageError?: () => void;
  onImageLoad?: () => void;
  intensityLabel?: string;
};

type DetailChip = { key: string; value: string; emoji: string };

const FALLBACK_PERSONALITY_DETAILS: Omit<DetailChip, 'key'>[] = [
  { value: 'Empatica', emoji: '💗' },
  { value: 'Atenta', emoji: '✨' },
  { value: 'Reflexiva', emoji: '🧠' },
];

function getToneIconName(tone?: string): string {
  if (!tone) return 'sparkles-outline';
  const normalized = tone.toLowerCase();
  if (normalized.includes('divert') || normalized.includes('juguet')) return 'happy-outline';
  if (normalized.includes('calm') || normalized.includes('tranquil')) return 'leaf-outline';
  if (normalized.includes('rom')) return 'heart-outline';
  if (normalized.includes('seri') || normalized.includes('prof')) return 'school-outline';
  return 'sparkles-outline';
}

function getDetailEmoji(key: string): string {
  if (key === 'persona') return '🧬';
  if (key === 'tone') return '✨';
  if (key === 'interactionStyle') return '🗨️';
  if (key === 'conversationDepth') return '🧠';
  return '✨';
}

export function CompanionCard({
  mode = 'preview',
  name,
  imageSrc,
  imageCacheKey,
  persona,
  tone,
  aboutText,
  interests = [],
  boundaries = [],
  gender,
  interactionStyle,
  conversationDepth,
  imageLoading,
  imageLoadingText,
  primaryActionLabel,
  onPrimaryAction,
  onEditImage,
  editImageLabel,
  editImageChooseMode,
  onEditName,
  onEditPersona,
  onEditInterests,
  onEditBoundaries,
  onImageError,
  onImageLoad,
  intensityLabel,
  age,
}: CompanionCardProps) {
  const { t } = useTranslation();
  const genderKey = (gender || '') as Gender;

  const formattedPersona = persona?.trim() ? formatGenderedTrait(persona, genderKey) : '';
  const formattedTone = tone?.trim() ? formatGenderedTrait(tone, genderKey) : '';
  const presenceLabel = intensityLabel?.trim() ?? '';

  const computedAbout =
    aboutText?.trim() ||
    (persona && genderKey
      ? generateAboutMePreview(
          persona,
          presenceLabel || formattedTone,
          genderKey,
          interests,
          interactionStyle,
        )
      : '');

  const details = useMemo<DetailChip[]>(() => {
    const rawItems: (DetailChip | null)[] = [
      formattedPersona
        ? { key: 'persona', value: formattedPersona, emoji: getDetailEmoji('persona') }
        : null,
      presenceLabel
        ? { key: 'tone', value: presenceLabel, emoji: getDetailEmoji('tone') }
        : formattedTone
          ? { key: 'tone', value: formattedTone, emoji: getDetailEmoji('tone') }
          : null,
      interactionStyle?.trim()
        ? {
            key: 'interactionStyle',
            value: formatGenderedTrait(interactionStyle, genderKey),
            emoji: getDetailEmoji('interactionStyle'),
          }
        : null,
      conversationDepth?.trim()
        ? {
            key: 'conversationDepth',
            value: formatGenderedTrait(conversationDepth, genderKey),
            emoji: getDetailEmoji('conversationDepth'),
          }
        : null,
    ];

    const deduped = rawItems.filter((item): item is DetailChip => Boolean(item));
    const seen = new Set<string>();
    const topThree = deduped.filter((item) => {
      const key = item.value.toLowerCase();
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });

    const withFallback = [...topThree];
    for (const fallback of FALLBACK_PERSONALITY_DETAILS) {
      if (withFallback.length >= 3) break;
      const fallbackValue = formatGenderedTrait(fallback.value, genderKey);
      if (withFallback.some((item) => item.value.toLowerCase() === fallbackValue.toLowerCase())) continue;
      withFallback.push({
        key: `fallback-${withFallback.length + 1}`,
        value: fallbackValue,
        emoji: fallback.emoji,
      });
    }
    return withFallback.slice(0, 3);
  }, [
    conversationDepth,
    formattedPersona,
    formattedTone,
    genderKey,
    interactionStyle,
    presenceLabel,
  ]);

  const badgeTone = presenceLabel || formattedTone;
  const resolvedAge = resolveCompanionAge({ age });

  return (
    <article className="companion-card card" data-testid="companion-card">
      <div className="companion-card__portrait-wrap">
        <img
          className="companion-card__portrait"
          src={imageSrc}
          alt=""
          data-cache-key={imageCacheKey}
          onLoad={onImageLoad}
          onError={onImageError}
        />
        <div className="companion-card__portrait-gradient" aria-hidden="true" />
        {mode === 'preview' && onEditImage && !imageLoading ? (
          <button type="button" className="companion-card__edit-image btn btn--tonal btn--s" onClick={onEditImage}>
            <AppIcon name={editImageChooseMode ? 'images-outline' : 'refresh-outline'} />
            <span>{editImageLabel}</span>
          </button>
        ) : null}
        {imageLoading ? (
          <div className="companion-card__portrait-loading" role="status">
            <span className="companion-card__spinner" aria-hidden="true" />
            {imageLoadingText ? <p>{imageLoadingText}</p> : null}
          </div>
        ) : null}
      </div>

      <header className="companion-card__header">
        <div className="companion-card__name-row">
          <h2 className="companion-card__name">{name}</h2>
          <span className="companion-card__verified" aria-hidden="true">
            <AppIcon name="checkmark" />
          </span>
          {mode === 'preview' && onEditName ? (
            <button type="button" className="btn btn--text btn--s" onClick={onEditName}>
              Editar
            </button>
          ) : null}
        </div>
        {(formattedPersona || badgeTone) && (
          <p className="companion-card__personality-pill">
            <AppIcon name={getToneIconName(badgeTone)} className="companion-card__personality-icon" />
            <span>
              {[formattedPersona || undefined, badgeTone || undefined].filter(Boolean).join(' · ')}
            </span>
          </p>
        )}
      </header>

      <section className="companion-card__section">
        <div className="companion-card__section-head">
          <h3 className="label">Sobre mí</h3>
          {mode === 'preview' && onEditPersona ? (
            <button type="button" className="btn btn--text btn--s" onClick={onEditPersona}>
              Editar
            </button>
          ) : null}
        </div>
        <p className="companion-card__about">{computedAbout || 'Sin descripción por ahora.'}</p>
      </section>

      <section className="companion-card__section">
        <div className="companion-card__section-head">
          <h3 className="label">Intereses</h3>
          {mode === 'preview' && onEditInterests ? (
            <button type="button" className="btn btn--text btn--s" onClick={onEditInterests}>
              Editar
            </button>
          ) : null}
        </div>
        <ul className="companion-card__chips">
          {interests.length === 0 ? (
            <li className="companion-card__empty">Sin intereses seleccionados</li>
          ) : (
            interests.map((interest) => (
              <li key={interest} className="pill companion-card__chip">
                {interest}
              </li>
            ))
          )}
        </ul>
      </section>

      <section className="companion-card__section">
        <h3 className="label">Más sobre mí</h3>
        <ul className="companion-card__more">
          {details.map((detail) => (
            <li key={detail.key} className="companion-card__more-chip">
              <span aria-hidden="true">{detail.emoji}</span>
              <span>{detail.value}</span>
            </li>
          ))}
        </ul>
        {typeof resolvedAge === 'number' ? (
          <p className="companion-card__meta">{t('companion.card.age', { age: resolvedAge })}</p>
        ) : null}
      </section>

      <section className="companion-card__section">
        <div className="companion-card__section-head">
          <h3 className="label">Límites</h3>
          {onEditBoundaries ? (
            <button type="button" className="btn btn--text btn--s" onClick={onEditBoundaries}>
              Editar
            </button>
          ) : null}
        </div>
        <ul className="companion-card__chips">
          {boundaries.length === 0 ? (
            <li className="companion-card__empty">Sin límites definidos</li>
          ) : (
            boundaries.map((boundary) => (
              <li key={boundary} className="pill pill--muted companion-card__chip">
                {boundary}
              </li>
            ))
          )}
        </ul>
      </section>

      {mode === 'profile' && primaryActionLabel && onPrimaryAction ? (
        <button type="button" className="btn btn--primary btn--m companion-card__primary" onClick={onPrimaryAction}>
          {primaryActionLabel}
        </button>
      ) : null}
    </article>
  );
}
