import { useRef, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';

import { AppIcon } from '~/components/AppIcon';
import { Logo } from '~/components/Logo';

import { SkipToContent } from './SkipToContent';

import './DesktopShell.css';

export type DesktopShellProps = {
  header?: ReactNode;
  footer?: ReactNode;
  preview?: ReactNode;
  children: ReactNode;
};

const WIZARD_STEP_SECONDS = [15, 15, 20, 10] as const;

export type CreationShellHeaderProps = {
  /** Paso visible 1–4 (`getV2WizardGroupIndex`). */
  step: 1 | 2 | 3 | 4;
  /** Progreso continuo 0–1 (`getV2WizardProgress`). */
  progress: number;
  showBack?: boolean;
  onBack?: () => void;
  onConfirmLeave: () => void | Promise<void>;
  /** Tags de lo ya elegido, bajo la barra de progreso. */
  crumbs?: ReactNode;
};

export function CreationShellHeader({
  step,
  progress,
  showBack = false,
  onBack,
  onConfirmLeave,
  crumbs,
}: CreationShellHeaderProps) {
  const { t } = useTranslation();
  const { t: tWeb } = useTranslation('web');
  const dialogRef = useRef<HTMLDialogElement>(null);
  const stepLabel = t('onboarding.v2.step_hint', {
    step,
    total: 4,
    seconds: WIZARD_STEP_SECONDS[step - 1] ?? 15,
  });
  const progressPct = Math.round(Math.max(0, Math.min(1, progress)) * 100);

  const openLeaveDialog = () => {
    dialogRef.current?.showModal();
  };

  const closeLeaveDialog = () => {
    dialogRef.current?.close();
  };

  const confirmLeave = () => {
    closeLeaveDialog();
    void onConfirmLeave();
  };

  return (
    <>
      <div className="creation-shell-header">
        <div className="creation-shell-header__brand">
          <Logo width={64} />
        </div>
        <div className="creation-shell-header__progress-wrap">
          <p className="label">{stepLabel}</p>
          <div
            className="creation-shell-header__progress"
            role="progressbar"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={progressPct}
            aria-label={stepLabel}
          >
            <span
              className="creation-shell-header__progress-fill"
              style={{ width: `${progressPct}%` }}
            />
          </div>
          {crumbs}
        </div>
        <div className="creation-shell-header__actions">
          {showBack && onBack ? (
            <button
              type="button"
              className="btn btn--icon btn--text creation-shell-header__nav-back"
              aria-label={tWeb('create.back')}
              onClick={onBack}
            >
              <AppIcon name="chevron-back-outline" />
            </button>
          ) : null}
          <button
            type="button"
            className="btn btn--icon btn--text creation-shell-header__exit"
            data-testid="create-exit"
            aria-label={tWeb('create.exit')}
            onClick={openLeaveDialog}
          >
            <AppIcon name="close-outline" />
          </button>
        </div>
      </div>
      <dialog ref={dialogRef} className="creation-leave-dialog" data-testid="create-exit-dialog">
        <h2 className="creation-leave-dialog__title">{t('onboarding.v2.close_confirm_title')}</h2>
        <p className="creation-leave-dialog__body">{t('onboarding.v2.close_confirm_body')}</p>
        <div className="creation-leave-dialog__actions">
          <button type="button" className="btn btn--primary btn--m" onClick={closeLeaveDialog}>
            {t('onboarding.v2.close_confirm_stay')}
          </button>
          <button
            type="button"
            className="btn btn--secondary btn--m"
            data-testid="create-exit-confirm"
            onClick={confirmLeave}
          >
            {t('onboarding.v2.close_confirm_leave')}
          </button>
        </div>
      </dialog>
    </>
  );
}

export function DesktopShell({ header, footer, preview, children }: DesktopShellProps) {
  return (
    <>
      <SkipToContent />
      <div className="desktop-shell">
        <header className="desktop-shell__header" data-testid="shell-header">
          {header}
        </header>
        <main id="main-content" className="desktop-shell__main" tabIndex={-1}>
          {children}
        </main>
        {preview ? (
          <aside className="desktop-shell__preview" data-testid="shell-preview">
            {preview}
          </aside>
        ) : null}
        <footer className="desktop-shell__footer" data-testid="shell-footer">
          {footer}
        </footer>
      </div>
    </>
  );
}
