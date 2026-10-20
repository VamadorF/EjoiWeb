import type { ReactNode } from 'react';

import { SkipToContent } from './SkipToContent';

import './DesktopShell.css';

export type DesktopShellProps = {
  header?: ReactNode;
  footer?: ReactNode;
  preview?: ReactNode;
  children: ReactNode;
};

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
