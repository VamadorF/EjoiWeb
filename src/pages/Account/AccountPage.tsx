import { QueryClient, QueryClientProvider, useQueryClient } from '@tanstack/react-query';
import { useEffect, useRef, useState, type ChangeEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useNavigate } from 'react-router';

import { legalDocuments } from '@/features/auth/assets/legalDocuments';
import { queryKeys } from '@/shared/lib/queryKeys';

import { deleteUserAccount, patchUserName } from '~/features/account/account.api';
import { buildDataRightsMailto, DATA_RIGHTS } from '~/features/account/dataRightsRequest';
import { resolveUserInitials, useCurrentUser } from '~/features/account/useCurrentUser';
import { saveUserPicture } from '~/features/account/userPicture';
import { sanitizeUserNameInput, validateUserName } from '~/features/account/userName';
import { logoutWeb } from '~/features/auth/api/auth.api';
import { AppIcon } from '~/components/AppIcon';
import { LegalDocumentModal } from '~/pages/Welcome/LegalDocumentModal';

import '~/features/chat/SideMenu.css';
import './AccountPage.css';

const accountQueryClient = new QueryClient({
  defaultOptions: { queries: { retry: false } },
});

type LegalDocKey = 'privacy' | 'terms';

const LEGAL_DOCUMENTS = {
  privacy: legalDocuments.privacyPolicy,
  terms: legalDocuments.termsAndConditions,
} as const;

function AccountPageInner() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { data: user } = useCurrentUser();

  const [legalDoc, setLegalDoc] = useState<(typeof LEGAL_DOCUMENTS)[LegalDocKey] | null>(null);
  const [nameOpen, setNameOpen] = useState(false);
  const [nameDraft, setNameDraft] = useState('');
  const [nameError, setNameError] = useState<string | null>(null);
  const [savingName, setSavingName] = useState(false);
  const [showNameToast, setShowNameToast] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [photoNote, setPhotoNote] = useState<string | null>(null);

  const nameDialogRef = useRef<HTMLDialogElement>(null);
  const deleteDialogRef = useRef<HTMLDialogElement>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (toastTimer.current) clearTimeout(toastTimer.current);
    };
  }, []);

  useEffect(() => {
    const el = nameDialogRef.current;
    if (!el) return;
    if (nameOpen && !el.open) el.showModal();
    if (!nameOpen && el.open) el.close();
  }, [nameOpen]);

  useEffect(() => {
    const el = deleteDialogRef.current;
    if (!el) return;
    if (deleteOpen && !el.open) el.showModal();
    if (!deleteOpen && el.open) el.close();
  }, [deleteOpen]);

  const openName = () => {
    setNameDraft(user?.name ?? '');
    setNameError(null);
    setNameOpen(true);
  };

  const submitName = async () => {
    const validated = validateUserName(nameDraft);
    if (!validated.ok) {
      const key =
        validated.reason === 'empty'
          ? 'account.name_error_empty'
          : validated.reason === 'too_long'
            ? 'account.name_error_too_long'
            : 'account.name_error_invalid_chars';
      setNameError(t(key));
      return;
    }
    setSavingName(true);
    setNameError(null);
    try {
      await patchUserName(validated.value);
      await queryClient.invalidateQueries({ queryKey: queryKeys.auth.currentUser });
      setNameOpen(false);
      setShowNameToast(true);
      if (toastTimer.current) clearTimeout(toastTimer.current);
      toastTimer.current = setTimeout(() => setShowNameToast(false), 2500);
    } catch {
      setNameError(t('account.name_error_generic'));
    } finally {
      setSavingName(false);
    }
  };

  const onPhoto = async (event: ChangeEvent<HTMLInputElement>) => {
    const input = event.currentTarget;
    const file = input.files?.[0];
    input.value = '';
    if (!file) return;
    const result = await saveUserPicture(file);
    if (result === 'saved' || result === 'shrunk') {
      await queryClient.invalidateQueries({ queryKey: queryKeys.auth.currentUser });
    }
    setPhotoNote(
      result === 'shrunk'
        ? t('account.photo_shrunk', {
            defaultValue: 'La foto no cabía completa. Guardamos una versión más chica.',
          })
        : result === 'full'
          ? t('account.photo_full', {
              defaultValue: 'No cabe en el almacenamiento del navegador. Se mantiene la foto actual.',
            })
          : result === 'unread'
            ? t('account.photo_unread', {
                defaultValue: 'No pudimos leer esa imagen. Se mantiene la foto actual.',
              })
            : null,
    );
  };

  const confirmDelete = async () => {
    setDeleting(true);
    try {
      await deleteUserAccount();
    } catch {
      window.alert(t('deleteAccount.error'));
      setDeleting(false);
      setDeleteOpen(false);
      return;
    }
    // La cuenta ya no existe: un fallo de /auth/logout no debe dejar al usuario dentro.
    await logoutWeb().catch(() => {});
    navigate('/', { replace: true });
  };

  return (
    <div className="account-page" data-testid="account-page">
      <header className="account-page__header">
        <Link to="/chat" className="btn btn--text" aria-label={t('common.back')}>
          <AppIcon name="arrow-back-outline" />
        </Link>
        <h1 className="account-page__title">{t('account.title')}</h1>
        <span className="account-page__title" aria-hidden="true" />
      </header>

      <div className="account-page__body">
        <p className="account-page__section-label">{t('account.data_section')}</p>
        <p className="account-page__section-hint">{t('account.name_hint')}</p>
        <div className="card account-page__card">
          <div className="account-page__photo-row">
            {user?.picture ? (
              <img
                src={user.picture}
                alt={t('account.photo_alt', { defaultValue: 'Foto de perfil' })}
                className="account-page__photo"
                data-testid="account-photo"
              />
            ) : (
              <span className="account-page__photo account-page__photo--empty" data-testid="account-photo" aria-hidden="true">
                {resolveUserInitials(user?.name, user?.email)}
              </span>
            )}
            <label className="account-page__photo-label">
              {t('account.photo_change', { defaultValue: 'Cambiar foto' })}
              <input
                type="file"
                accept="image/*"
                className="visually-hidden"
                data-testid="account-photo-input"
                onChange={(event) => void onPhoto(event)}
              />
            </label>
          </div>
          {photoNote ? (
            <p className="account-page__photo-note" role="status">
              {photoNote}
            </p>
          ) : null}
          <div className="account-page__divider" />
          <button type="button" className="account-page__row" onClick={openName}>
            <span className="account-page__row-label">{t('account.data_name')}</span>
            <span className="account-page__row-value">{user?.name?.trim() || t('account.name_add')}</span>
          </button>
          <div className="account-page__divider" />
          <div className="account-page__row account-page__row--static">
            <span className="account-page__row-label">{t('account.data_email')}</span>
            <span className="account-page__row-value">{user?.email || t('account.data_unavailable')}</span>
          </div>
          <div className="account-page__divider" />
          <div className="account-page__row account-page__row--static">
            <span className="account-page__row-label">{t('account.data_provider')}</span>
            <span className="account-page__row-value">
              {user?.provider ? t(`account.provider_${user.provider}`) : t('account.data_unavailable')}
            </span>
          </div>
        </div>

        <p className="account-page__section-label">Suscripción</p>
        <p className="account-page__section-hint">Elige un plan. La elección queda en este navegador y no cobra nada.</p>
        <div className="card account-page__card">
          <Link to="/cuenta/suscripcion" className="account-page__row" data-testid="account-subscription-link">
            <span>Ver planes</span>
            <AppIcon name="chevron-forward-outline" />
          </Link>
        </div>

        <p className="account-page__section-label">{t('account.rights_section')}</p>
        <p className="account-page__section-hint">{t('account.rights_hint')}</p>
        <div className="card account-page__card">
          {DATA_RIGHTS.map((right, index) => (
            <div key={right}>
              {index > 0 ? <div className="account-page__divider" /> : null}
              <a
                className="account-page__row"
                href={buildDataRightsMailto(right, {
                  userId: user?.id,
                  email: user?.email,
                  name: user?.name,
                })}
              >
                <span>{t(`account.rights_${right}`)}</span>
                <AppIcon name="mail-outline" />
              </a>
            </div>
          ))}
        </div>

        <p className="account-page__section-label">{t('account.legal_section')}</p>
        <div className="card account-page__card">
          <button type="button" className="account-page__row" onClick={() => setLegalDoc(LEGAL_DOCUMENTS.privacy)}>
            <span>{t('account.privacy_policy')}</span>
            <AppIcon name="chevron-forward-outline" />
          </button>
          <div className="account-page__divider" />
          <button type="button" className="account-page__row" onClick={() => setLegalDoc(LEGAL_DOCUMENTS.terms)}>
            <span>{t('account.terms')}</span>
            <AppIcon name="chevron-forward-outline" />
          </button>
        </div>

        <div className="account-page__danger">
          <p className="account-page__section-label">{t('account.danger_section')}</p>
          <p className="account-page__section-hint">
            {t('account.delete_account_hint', { store: 'eJoi web' })}
          </p>
          <button type="button" className="btn btn--danger btn--m account-page__delete" onClick={() => setDeleteOpen(true)}>
            {t('account.delete_account')}
          </button>
        </div>
      </div>

      {showNameToast ? (
        <p className="account-page__toast" role="status">
          {t('account.name_updated')}
        </p>
      ) : null}

      <dialog
        ref={nameDialogRef}
        className="account-page__name-dialog"
        data-testid="account-name-dialog"
        onClose={() => {
          if (!savingName) setNameOpen(false);
        }}
      >
        <div className="account-page__name-panel card">
          <h2>{t('account.name_modal_title')}</h2>
          <input
            className="account-page__name-input input"
            value={nameDraft}
            maxLength={80}
            onChange={(event) => setNameDraft(sanitizeUserNameInput(event.target.value))}
          />
          {nameError ? <p className="account-page__name-error">{nameError}</p> : null}
          <button type="button" className="btn btn--primary btn--m" disabled={savingName} onClick={() => void submitName()}>
            {t('common.save')}
          </button>
          <button type="button" className="btn btn--text" disabled={savingName} onClick={() => setNameOpen(false)}>
            {t('common.cancel')}
          </button>
        </div>
      </dialog>

      <dialog ref={deleteDialogRef} className="home-side-menu__logout-dialog" data-testid="delete-account-dialog">
        <h2>{t('deleteAccount.title')}</h2>
        <p>{t('deleteAccount.message')}</p>
        <p>{t('deleteAccount.subscriptionDisclaimer', { store: 'eJoi web' })}</p>
        <div className="home-side-menu__logout-actions">
          <button type="button" className="btn btn--text" disabled={deleting} onClick={() => setDeleteOpen(false)}>
            {t('common.cancel')}
          </button>
          <button type="button" className="btn btn--danger btn--m" disabled={deleting} onClick={() => void confirmDelete()}>
            {deleting ? t('deleteAccount.loading') : t('deleteAccount.confirm')}
          </button>
        </div>
      </dialog>

      <LegalDocumentModal doc={legalDoc} onClose={() => setLegalDoc(null)} />
    </div>
  );
}

export default function AccountPage() {
  return (
    <QueryClientProvider client={accountQueryClient}>
      <AccountPageInner />
    </QueryClientProvider>
  );
}
