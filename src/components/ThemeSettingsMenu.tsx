import { useId, useRef } from 'react';
import { useTranslation } from 'react-i18next';

import { AppIcon } from '~/components/AppIcon';
import { ThemePreferenceControl } from '~/components/ThemePreferenceControl';

import './ThemeSettingsMenu.css';

export type ThemeSettingsMenuProps = {
  /** Clases extra en el botón (p. ej. ocultar en un layout concreto). */
  className?: string;
};

/** Engranaje fijo + diálogo de tema; montar una vez en el layout raíz. */
export function ThemeSettingsMenu({ className = '' }: ThemeSettingsMenuProps) {
  const { t } = useTranslation();
  const dialogRef = useRef<HTMLDialogElement>(null);
  const titleId = useId();

  const open = () => dialogRef.current?.showModal();
  const close = () => dialogRef.current?.close();

  return (
    <>
      <button
        type="button"
        className={`theme-settings-trigger btn btn--icon ${className}`.trim()}
        aria-label={t('drawer.appearance_theme')}
        aria-haspopup="dialog"
        data-testid="theme-settings-trigger"
        onClick={open}
      >
        <AppIcon name="settings-outline" />
      </button>

      <dialog
        ref={dialogRef}
        className="theme-settings-dialog"
        aria-labelledby={titleId}
        data-testid="theme-settings-dialog"
        onCancel={(event) => {
          event.preventDefault();
          close();
        }}
      >
        <div className="theme-settings-dialog__panel card">
          <header className="theme-settings-dialog__header">
            <h2 id={titleId} className="theme-settings-dialog__title">
              {t('drawer.appearance_theme')}
            </h2>
            <button
              type="button"
              className="btn btn--icon btn--text theme-settings-dialog__close"
              aria-label={t('common.close')}
              onClick={close}
            >
              <AppIcon name="close-outline" />
            </button>
          </header>
          <ThemePreferenceControl showSectionLabel={false} compact />
        </div>
      </dialog>
    </>
  );
}
