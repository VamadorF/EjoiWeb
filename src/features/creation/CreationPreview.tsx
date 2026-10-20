import { useTranslation } from 'react-i18next';

import type { OnboardingData } from '@/features/onboarding/types';

import { stylePortraitSrc } from './portraits';
import { buildPreviewTags } from './whoValidation';

import './CreationPreview.css';

export type CreationPreviewProps = {
  data: OnboardingData;
  tagTimeline: string[];
};

export function CreationPreview({ data, tagTimeline }: CreationPreviewProps) {
  const { t } = useTranslation('web');
  const portraitSrc = stylePortraitSrc(data.visualStyle, data.gender);
  const tags = buildPreviewTags(data, tagTimeline);
  const lastTagId = tags.length > 0 ? tags[tags.length - 1]!.id : null;

  return (
    <div className="creation-preview" aria-hidden="true">
      <h2 className="creation-preview__title">{t('create.preview_title')}</h2>
      <div className="creation-preview__portrait-wrap">
        {portraitSrc ? (
          <img
            className="creation-preview__portrait"
            src={portraitSrc}
            alt=""
            data-testid="creation-portrait"
          />
        ) : (
          <div className="creation-preview__portrait creation-preview__portrait--abstract" data-testid="creation-portrait">
            e
          </div>
        )}
      </div>
      {tags.length > 0 ? (
        <ul className="creation-preview__tags">
          {tags.map((tag) => (
            <li
              key={tag.id}
              className={
                tag.id === lastTagId
                  ? 'creation-preview__tag creation-preview__tag--latest'
                  : 'creation-preview__tag'
              }
            >
              {tag.label}
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
