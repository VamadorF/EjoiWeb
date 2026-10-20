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

export type CreationShellHeaderProps = {
  step: 2 | 3;
  backLabel?: string;
  onBack?: () => void;
  onConfirmLeave: () => void | Promise<void>;
};

export function CreationShellHeader({ step, backLabel, onBack, onConfirmLeave }: CreationShellHeaderProps) {
  const { t } = useTranslation();
  const { t: tWeb } = useTranslation('web');
  const dialogRef = useRef<HTMLDialogElement>(null);
  const stepLabel = t('onboarding.v2.step_hint', { step, total: 3, seconds: 30 });

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
          {onBack && backLabel ? (
            <button type="button" className="btn btn--text creation-shell-header__back" onClick={onBack}>
              <AppIcon name="chevron-back-outline" />
              {backLabel}
            </button>
          ) : (
            <Logo height={28} />
          )}
        </div>
        <div className="creation-shell-header__progress-wrap">
          <p className="label">{stepLabel}</p>
          <div
            className="creation-shell-header__progress"
            role="progressbar"
            aria-valuemin={1}
            aria-valuemax={3}
            aria-valuenow={step}
            aria-label={stepLabel}
          >
            {[1, 2, 3].map((n) => (
              <span
                key={n}
                className={
                  n <= step
                    ? 'creation-shell-header__seg creation-shell-header__seg--done'
                    : 'creation-shell-header__seg'
                }
              />
            ))}
          </div>
        </div>
        <div className="creation-shell-header__actions">
          <button
            type="button"
            className="btn btn--text creation-shell-header__exit"
            data-testid="create-exit"
            onClick={openLeaveDialog}
          >
            <AppIcon name="close-outline" />
            {tWeb('create.exit')}
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
          <aside
            className="desktop-shell__preview"
            data-testid="shell-preview"
            inert
            aria-hidden
          >
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
