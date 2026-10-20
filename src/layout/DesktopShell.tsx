import type { ReactNode } from 'react';

import './DesktopShell.css';

export type DesktopShellProps = {
  header?: ReactNode;
  footer?: ReactNode;
  preview?: ReactNode;
  children: ReactNode;
};

export function DesktopShell({ header, footer, preview, children }: DesktopShellProps) {
  return (
    <div className="desktop-shell">
      <header className="desktop-shell__header" data-testid="shell-header">
        {header}
      </header>
      <main className="desktop-shell__main">{children}</main>
      <aside className="desktop-shell__preview" data-testid="shell-preview">
        {preview}
      </aside>
      <footer className="desktop-shell__footer" data-testid="shell-footer">
        {footer}
      </footer>
    </div>
  );
}
