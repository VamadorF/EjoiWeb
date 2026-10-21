import { useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';

import { MAX_COMPANION_AVATAR_VARIANTS } from '@/features/companion/constants/avatarVariants';

import type { AvatarCatalogReason, AvatarVariant } from '~/features/creation/avatarSession';

type Props = {
  open: boolean;
  reason: AvatarCatalogReason | null;
  variants: readonly AvatarVariant[];
  selectedId: string | null;
  remaining: number;
  generating?: boolean;
  onClose: () => void;
  onSelect: (variantId: string) => void;
  onConfirm: () => void;
  onGenerateAnother: () => void;
};

export function AvatarCatalogDialog({
  open,
  reason,
  variants,
  selectedId,
  remaining,
  generating = false,
  onClose,
  onSelect,
  onConfirm,
  onGenerateAnother,
}: Props) {
  const { t } = useTranslation();
  const dialogRef = useRef<HTMLDialogElement>(null);
  const newestId = variants.length > 0 ? variants[variants.length - 1]!.id : null;
  const atLimit = remaining <= 0;

  useEffect(() => {
    const el = dialogRef.current;
    if (!el) return;
    if (open && !el.open) el.showModal();
    if (!open && el.open) el.close();
  }, [open]);

  const titleKey =
    reason === 'limit_reached' ? 'companion.avatar_catalog.title_limit' : 'companion.avatar_catalog.title';
  const subtitleKey = atLimit
    ? 'companion.avatar_catalog.subtitle_limit'
    : 'companion.avatar_catalog.subtitle';

  return (
    <dialog ref={dialogRef} className="avatar-catalog-dialog" onClose={onClose} data-testid="avatar-catalog">
      <div className="avatar-catalog-dialog__panel card">
        <header className="avatar-catalog-dialog__header">
          <h2 id="avatar-catalog-title">{t(titleKey)}</h2>
          <button type="button" className="btn btn--text btn--s" onClick={onClose}>
            {t('companion.avatar_catalog.back')}
          </button>
        </header>
        <p className="avatar-catalog-dialog__subtitle">
          {t(subtitleKey, { count: variants.length, max: MAX_COMPANION_AVATAR_VARIANTS })}
        </p>
        {atLimit ? (
          <p className="avatar-catalog-dialog__banner" role="status">
            {t('companion.avatar_catalog.limit_banner')}
          </p>
        ) : null}
        <ul className="avatar-catalog-dialog__grid">
          {variants.map((variant, index) => {
            const selected = variant.id === selectedId;
            return (
              <li key={variant.id}>
                <button
                  type="button"
                  className={`avatar-catalog-dialog__tile${selected ? ' avatar-catalog-dialog__tile--selected' : ''}`}
                  aria-pressed={selected}
                  aria-label={t('companion.avatar_catalog.tile_a11y', { index: index + 1 })}
                  onClick={() => onSelect(variant.id)}
                >
                  <img src={variant.url} alt="" />
                  {variant.id === newestId ? (
                    <span className="avatar-catalog-dialog__badge">{t('companion.avatar_catalog.badge_new')}</span>
                  ) : null}
                </button>
              </li>
            );
          })}
        </ul>
        <footer className="avatar-catalog-dialog__actions">
          <button
            type="button"
            className="btn btn--primary btn--l"
            disabled={!selectedId || generating}
            onClick={onConfirm}
          >
            {t('companion.avatar_catalog.confirm')}
          </button>
          {!atLimit ? (
            <button
              type="button"
              className="btn btn--secondary btn--l"
              disabled={generating}
              onClick={onGenerateAnother}
            >
              {remaining > 0
                ? t('companion.avatar_catalog.generate_another_remaining', { count: remaining })
                : t('companion.avatar_catalog.generate_another')}
            </button>
          ) : null}
        </footer>
      </div>
    </dialog>
  );
}
