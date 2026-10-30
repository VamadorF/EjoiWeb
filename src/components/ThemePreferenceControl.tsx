import { useId } from 'react';
import { useTranslation } from 'react-i18next';

import { OptionGroup } from '~/layout/OptionGroup';
import { THEME_CHOICES, useThemePreference } from '~/theme/theme';

import './ThemePreferenceControl.css';

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
        {THEME_CHOICES.map((opt) => (
          <button
            key={opt.id}
            type="button"
            role="radio"
            className="seg__item"
            aria-checked={preference === opt.id}
            data-theme-choice={opt.id}
            data-testid={`theme-option-${opt.id}`}
            onClick={() => setPreference(opt.id)}
          >
            <span className="theme-preference__name">
              {opt.web ? t(opt.labelKey, { ns: 'web' }) : t(opt.labelKey)}
            </span>
            {opt.web ? (
              <span className="theme-preference__web">{t('theme.web_mark', { ns: 'web' })}</span>
            ) : null}
          </button>
        ))}
      </OptionGroup>
    </div>
  );
}
