import { useTranslation } from 'react-i18next';

type Props = {
  ageConfirmed: boolean;
  legalAccepted: boolean;
  onToggleAge: () => void;
  onToggleLegal: () => void;
  onOpenTerms: () => void;
  onOpenPrivacy: () => void;
  disabled?: boolean;
  showAgeGate?: boolean;
};

export function ReviewLegalConsent({
  ageConfirmed,
  legalAccepted,
  onToggleAge,
  onToggleLegal,
  onOpenTerms,
  onOpenPrivacy,
  disabled = false,
  showAgeGate = true,
}: Props) {
  const { t } = useTranslation();

  return (
    <div className="review-consent" data-testid="review-consent">
      {showAgeGate ? (
        <label className="check">
          <input
            className="check__input"
            type="checkbox"
            checked={ageConfirmed}
            disabled={disabled}
            onChange={onToggleAge}
          />
          <span>{t('auth.login.age_gate')}</span>
        </label>
      ) : null}
      <label className="check">
        <input
          className="check__input"
          type="checkbox"
          checked={legalAccepted}
          disabled={disabled}
          onChange={onToggleLegal}
        />
        <span>
          {t('auth.login.legal_gate_prefix')}{' '}
          <button type="button" className="btn btn--text btn--s" onClick={onOpenTerms}>
            {t('auth.login.terms_link')}
          </button>
          {t('auth.login.and_privacy')}
          <button type="button" className="btn btn--text btn--s" onClick={onOpenPrivacy}>
            {t('auth.login.privacy_link')}
          </button>
          {t('auth.login.legal_gate_suffix')}
        </span>
      </label>
    </div>
  );
}
