import { useTranslation } from 'react-i18next';

import type { OnboardingData } from '@/features/onboarding/types';

import { stylePortraitSrc } from './portraits';
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

export type CreationPreviewProps = {
  data: OnboardingData;
  tagTimeline: string[];
  companionName?: string;
  greeting?: string | null;
};

export function CreationPreview({ data, tagTimeline, companionName, greeting }: CreationPreviewProps) {
  const { t } = useTranslation('web');
  const portraitSrc = stylePortraitSrc(data.visualStyle, data.gender);
  const tags = buildComoPreviewTags(data, tagTimeline);
  const lastTagId = tags.length > 0 ? tags[tags.length - 1]!.id : null;
  const displayName = companionName?.trim() || data.companionName?.trim();

  return (
    <div className="creation-preview" aria-hidden="true">
      <p className="label creation-preview__title">{t('create.preview_title')}</p>
      <h2
        className={
          displayName
            ? 'creation-preview__name'
            : 'creation-preview__name creation-preview__name--placeholder'
        }
      >
        {displayName || t('create.no_name')}
      </h2>
      <div className="creation-preview__portrait-wrap">
        {portraitSrc ? (
          <img
            className="avatar avatar--168 creation-preview__portrait"
            src={portraitSrc}
            alt=""
            data-testid="creation-portrait"
          />
        ) : (
          <div
            className="avatar avatar--168 creation-preview__portrait creation-preview__portrait--abstract"
            data-testid="creation-portrait"
          >
            e
          </div>
        )}
      </div>
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
      {greeting ? <p className="bubble--ai creation-preview__greeting">{greeting}</p> : null}
    </div>
  );
}
