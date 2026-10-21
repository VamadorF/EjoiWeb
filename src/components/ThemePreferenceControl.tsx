import { useId } from 'react';
import { useTranslation } from 'react-i18next';

import { OptionGroup } from '~/layout/OptionGroup';
import { useThemePreference, type ThemePreference } from '~/theme/theme';

import './ThemePreferenceControl.css';

const OPTIONS: readonly { id: ThemePreference; labelKey: string }[] = [
  { id: 'system', labelKey: 'drawer.theme_auto' },
  { id: 'light', labelKey: 'drawer.theme_light' },
  { id: 'dark', labelKey: 'drawer.theme_dark' },
];

export type ThemePreferenceControlProps = {
  className?: string;
  /** Etiqueta «Apariencia» encima del segmento (drawer.theme_section). */
  showSectionLabel?: boolean;
  compact?: boolean;
};

export function ThemePreferenceControl({
  className = '',
  showSectionLabel = true,
  compact = false,
}: ThemePreferenceControlProps) {
  const { t } = useTranslation();
  const { preference, setPreference } = useThemePreference();
  const labelId = useId();
  const groupLabelId = showSectionLabel ? labelId : undefined;
  const groupAriaLabel = showSectionLabel ? undefined : t('drawer.appearance_theme');

  return (
    <div
      className={`theme-preference ${className}`.trim()}
      data-testid="theme-preference"
    >
      {showSectionLabel ? (
        <span id={labelId} className="theme-preference__label label">
          {t('drawer.theme_section')}
        </span>
      ) : null}
      <OptionGroup
        mode="radio"
        layout="inline"
        aria-labelledby={groupLabelId}
        aria-label={groupAriaLabel}
        className={`seg theme-preference__seg${compact ? ' theme-preference__seg--compact' : ''}`}
      >
        {OPTIONS.map((opt) => (
          <button
            key={opt.id}
            type="button"
            role="radio"
            className="seg__item"
            aria-checked={preference === opt.id}
            onClick={() => setPreference(opt.id)}
          >
            {t(opt.labelKey)}
          </button>
        ))}
      </OptionGroup>
    </div>
  );
}
