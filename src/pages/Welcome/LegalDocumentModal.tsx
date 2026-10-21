import { useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';

type LegalDoc = { title: string; content: string };

type Props = {
  doc: LegalDoc | null;
  onClose: () => void;
};

export function LegalDocumentModal({ doc, onClose }: Props) {
  const { t } = useTranslation();
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const el = dialogRef.current;
    if (!el) return;
    if (doc) {
      if (!el.open) el.showModal();
    } else if (el.open) {
      el.close();
    }
  }, [doc]);

  const onDialogClose = () => {
    if (doc) onClose();
  };

  if (!doc) return null;

  const blocks = doc.content
    .split('\n\n')
    .map((s) => s.trim())
    .filter(Boolean);

  return (
    <dialog
      ref={dialogRef}
      className="welcome-legal-dialog"
      onClose={onDialogClose}
      aria-labelledby="welcome-legal-title"
    >
      <div className="welcome-legal-dialog__panel card">
        <header className="welcome-legal-dialog__header">
          <h2 id="welcome-legal-title" className="welcome-legal-dialog__title">
            {doc.title}
          </h2>
          <button type="button" className="btn btn--text" onClick={onClose}>
            {t('common.close')}
          </button>
        </header>
        <div className="welcome-legal-dialog__body">
          {blocks.map((block, idx) => {
            if (block.includes('•')) {
              const lines = block.split('\n').map((l) => l.trim()).filter(Boolean);
              return (
                <div key={idx} className="welcome-legal-dialog__block">
                  {lines.map((line, i) =>
                    line.startsWith('•') ? (
                      <p key={i} className="welcome-legal-dialog__bullet">
                        {line.replace(/^•\s*/, '• ')}
                      </p>
                    ) : (
                      <p key={i} className="welcome-legal-dialog__para">
                        {line}
                      </p>
                    ),
                  )}
                </div>
              );
            }
            return (
              <p key={idx} className="welcome-legal-dialog__para">
                {block}
              </p>
            );
          })}
        </div>
        <footer className="welcome-legal-dialog__footer">
          <button type="button" className="btn btn--primary btn--l" onClick={onClose}>
            {t('common.understood')}
          </button>
        </footer>
      </div>
    </dialog>
  );
}
