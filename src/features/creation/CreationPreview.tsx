import { useTranslation } from 'react-i18next';

import type { OnboardingData } from '@/features/onboarding/types';

import { stylePortraitSrc, stylePortraitSrcForCard } from './portraits';
import { buildPreviewTags, type PreviewTag } from './whoValidation';

import './CreationPreview.css';

const INTENSITY_LABELS: Record<string, string> = {
  soft: 'Suave',
  balanced: 'Equilibrada',
  intense: 'Activa',
};

function buildComoPreviewTags(data: OnboardingData, tagTimeline: string[]): PreviewTag[] {
  const base = buildPreviewTags(data, tagTimeline);
  const resolve = (id: string): PreviewTag | null => {
    if (id === 'persona' && data.persona) return { id, label: data.persona };
    if (id === 'intensity' && data.intensity) {
      return { id, label: INTENSITY_LABELS[data.intensity] ?? data.intensity };
    }
    if (id.startsWith('boundary:')) {
      const boundary = id.slice('boundary:'.length);
      if (data.boundaries.includes(boundary)) return { id, label: boundary };
    }
    if (id === 'name' && data.companionName?.trim()) {
      return { id, label: data.companionName.trim() };
    }
    return null;
  };
  const como = tagTimeline.flatMap((id) => {
    const tag = resolve(id);
    return tag ? [tag] : [];
  });
  const seen = new Set(base.map((t) => t.id));
  return [...base, ...como.filter((t) => !seen.has(t.id))];
}

function PreviewEmptyState() {
  const { t } = useTranslation('web');
  return (
    <div className="creation-preview__empty" data-testid="creation-preview-empty">
      <div className="creation-preview__empty-portraits" aria-hidden="true">
        <img
          className="creation-preview__empty-portrait"
          src={stylePortraitSrcForCard('realista', 'femenino')}
          alt=""
        />
        <img
          className="creation-preview__empty-portrait"
          src={stylePortraitSrcForCard('anime', 'femenino')}
          alt=""
        />
      </div>
      <p className="creation-preview__empty-text">{t('wizard.preview_empty')}</p>
    </div>
  );
}

export type CreationPreviewProps = {
  data: OnboardingData;
  tagTimeline: string[];
  companionName?: string;
  greeting?: string | null;
  showGreetingPreview?: boolean;
};

export function CreationPreview({
  data,
  tagTimeline,
  companionName,
  greeting,
  showGreetingPreview = false,
}: CreationPreviewProps) {
  const { t } = useTranslation('web');
  const portraitSrc = stylePortraitSrc(data.visualStyle, data.gender);
  const tags = buildComoPreviewTags(data, tagTimeline);
  const lastTagId = tags.length > 0 ? tags[tags.length - 1]!.id : null;
  const displayName = companionName?.trim() || data.companionName?.trim();

  return (
    <article className="creation-preview-shell card" data-testid="creation-preview-card">
      <h2 className="creation-preview-shell__title">{t('create.preview_title')}</h2>
      <div className="creation-preview" aria-hidden="true">
        {portraitSrc ? (
          <>
            <div className="creation-preview__portrait-wrap">
              <img
                className="avatar avatar--168 creation-preview__portrait"
                src={portraitSrc}
                alt=""
                data-testid="creation-portrait"
              />
            </div>
            <p
              className={
                displayName
                  ? 'creation-preview__name'
                  : 'creation-preview__name creation-preview__name--placeholder'
              }
            >
              {displayName || t('create.no_name')}
            </p>
            {tags.length > 0 ? (
              <ul className="creation-preview__tags">
                {tags.map((tag) => (
                  <li
                    key={tag.id}
                    className={tag.id === lastTagId ? 'pill pill--last' : 'pill'}
                  >
                    {tag.label}
                  </li>
                ))}
              </ul>
            ) : null}
          </>
        ) : (
          <PreviewEmptyState />
        )}
        {showGreetingPreview ? (
          <div className="creation-preview__card" data-testid="creation-preview-greeting">
            <p className="label creation-preview__card-label">{t('create.preview_card')}</p>
            {greeting ? <p className="bubble--ai creation-preview__greeting">{greeting}</p> : null}
          </div>
        ) : null}
      </div>
    </article>
  );
}
