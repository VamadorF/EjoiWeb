import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { BOUNDARY_OPTIONS } from '@/features/onboarding/data/boundaryOptions';

import { OptionGroup } from '~/layout/OptionGroup';

import './EditBoundariesDialog.css';

type Props = {
  open: boolean;
  initialBoundaries: string[];
  isSaving?: boolean;
  onClose: () => void;
  onSave: (boundaries: string[]) => void | Promise<void>;
};

export function EditBoundariesDialog({
  open,
  initialBoundaries,
  isSaving = false,
  onClose,
  onSave,
}: Props) {
  const { t } = useTranslation();
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [selected, setSelected] = useState<string[]>(initialBoundaries);

  useEffect(() => {
    const el = dialogRef.current;
    if (!el) return;
    if (open && !el.open) el.showModal();
    if (!open && el.open) el.close();
  }, [open]);

  useEffect(() => {
    if (open) setSelected(initialBoundaries);
  }, [open, initialBoundaries]);

  const toggleBoundary = (boundary: string) => {
    setSelected((prev) =>
      prev.includes(boundary) ? prev.filter((b) => b !== boundary) : [...prev, boundary],
    );
  };

  return (
    <dialog
      ref={dialogRef}
      className="edit-boundaries-dialog"
      data-testid="edit-boundaries-dialog"
      onClose={() => {
        if (!isSaving) onClose();
      }}
    >
      <div className="edit-boundaries-dialog__panel card">
        <h2 id="edit-boundaries-title" className="edit-boundaries-dialog__title">
          {t('home.profile.edit_boundaries_title')}
        </h2>
        <p className="edit-boundaries-dialog__subtitle">{t('home.profile.edit_boundaries_subtitle')}</p>

        <OptionGroup
          mode="toggle"
          layout="inline"
          aria-labelledby="edit-boundaries-title"
          className="edit-boundaries-dialog__chips"
        >
          {BOUNDARY_OPTIONS.map((option) => {
            const pressed = selected.includes(option);
            return (
              <button
                key={option}
                type="button"
                aria-pressed={pressed}
                className={pressed ? 'chip chip--selected' : 'chip'}
                disabled={isSaving}
                onClick={() => toggleBoundary(option)}
              >
                {option}
              </button>
            );
          })}
        </OptionGroup>

        <div className="edit-boundaries-dialog__actions">
          <button
            type="button"
            className="btn btn--primary btn--m"
            disabled={isSaving}
            onClick={() => void onSave(selected)}
          >
            {t('home.profile.edit_boundaries_save')}
          </button>
          <button type="button" className="btn btn--text" disabled={isSaving} onClick={onClose}>
            {t('common.cancel')}
          </button>
        </div>
      </div>
    </dialog>
  );
}
