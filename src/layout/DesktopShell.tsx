import type { ReactNode } from 'react';

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
  step: 1 | 2 | 3;
  stepLabel: string;
  backLabel?: string;
  onBack?: () => void;
};

export function CreationShellHeader({ step, stepLabel, backLabel, onBack }: CreationShellHeaderProps) {
  return (
    <div className="creation-shell-header">
      <Logo height={28} />
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
        {onBack && backLabel ? (
          <button type="button" className="btn btn--text" onClick={onBack}>
            {backLabel}
          </button>
        ) : null}
      </div>
    </div>
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
