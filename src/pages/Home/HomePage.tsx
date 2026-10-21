import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useNavigate } from 'react-router';

import { legalDocuments } from '@/features/auth/assets/legalDocuments';
import { AppIcon } from '~/components/AppIcon';
import { Logo } from '~/components/Logo';
import { splitInterestHighlights } from '~/features/chat/highlightInterests';
import { DesktopShell } from '~/layout/DesktopShell';
import { CAMPAIGN_LANDING_URL } from '~/platform/env';
import { buildFirstMessageTemplate } from '~/platform/mockGreeting';

import './HomePage.css';

const HOME_PORTRAITS = {
  left: '/portraits/ilustrado-femenino.webp',
  center: '/portraits/realista-femenino.webp',
  right: '/portraits/realista-masculino.webp',
} as const;

const VALUE_PILLS = [
  { key: 'pill_safe', icon: 'shield-checkmark-outline', tone: 'brand' },
  { key: 'pill_support', icon: 'heart-outline', tone: 'lav' },
  { key: 'pill_habits', icon: 'trending-up-outline', tone: 'ok' },
] as const;

const VALUE_SEALS = [
  { key: 'value_seal_1', icon: 'chatbubbles-outline' },
  { key: 'value_seal_2', icon: 'shield-checkmark-outline' },
  { key: 'value_seal_3', icon: 'flash-outline' },
] as const;

const HOW_STEPS = [
  { icon: 'color-palette-outline', titleKey: 'how_1_title', bodyKey: 'how_1_body' },
  { icon: 'heart-outline', titleKey: 'how_2_title', bodyKey: 'how_2_body' },
  { icon: 'chatbubble-ellipses-outline', titleKey: 'how_3_title', bodyKey: 'how_3_body' },
] as const;

const EXAMPLE_INTERESTS = ['Música', 'Viajes'] as const;
const EXAMPLE_NAME = 'Sofía';

const LEGAL_TERMS_URL = `${CAMPAIGN_LANDING_URL}/terminos`;
const LEGAL_PRIVACY_URL = `${CAMPAIGN_LANDING_URL}/privacidad`;

export default function HomePage() {
  const { t } = useTranslation(['translation', 'web']);
  const { t: tWeb } = useTranslation('web');
  const navigate = useNavigate();

  useEffect(() => {
    document.documentElement.classList.add('home-route');
    return () => document.documentElement.classList.remove('home-route');
  }, []);

  const exampleAi =
    tWeb('home.example_ai') ||
    buildFirstMessageTemplate(EXAMPLE_NAME, [...EXAMPLE_INTERESTS]);
  const exampleSegments = splitInterestHighlights(exampleAi, [...EXAMPLE_INTERESTS]);

  const goAccessReturning = () => {
    navigate('/acceso', { state: { returning: true } });
  };

  return (
    <div className="home-page" data-testid="page-inicio">
      <DesktopShell
        header={
          <div className="home-header">
            <Link to="/" className="home-header__logo" aria-label="eJoi inicio">
              <Logo width={64} />
            </Link>
            <div className="home-header__actions">
              <button type="button" className="btn btn--text" onClick={goAccessReturning}>
                {tWeb('access.sign_in')}
              </button>
              <Link to="/acceso" className="btn btn--primary btn--m">
                {tWeb('home.cta_create')}
              </Link>
            </div>
          </div>
        }
        footer={
          <footer className="home-footer">
            <a href={LEGAL_TERMS_URL} target="_blank" rel="noreferrer">
              {legalDocuments.termsAndConditions.title}
            </a>
            <span aria-hidden> · </span>
            <a href={LEGAL_PRIVACY_URL} target="_blank" rel="noreferrer">
              {legalDocuments.privacyPolicy.title}
            </a>
            <span aria-hidden> · </span>
            <a href={CAMPAIGN_LANDING_URL} target="_blank" rel="noreferrer">
              eJoi
            </a>
          </footer>
        }
      >
        <section className="home-hero" aria-labelledby="home-hero-heading">
          <div className="home-hero__inner">
            <div className="home-hero__copy">
              <h1 id="home-hero-heading" className="home-hero__title">
                {t('auth.login.headline_prefix')}
                <span className="home-hero__highlight">{t('auth.login.headline_highlight')}</span>
                {t('auth.login.headline_suffix')}
              </h1>
              <p className="home-hero__subtitle">{t('auth.login.subtitle')}</p>
              <div className="home-hero__ctas">
                <Link to="/acceso" className="btn btn--primary btn--l">
                  {tWeb('home.cta_create')}
                </Link>
                <Link to="/acceso" className="btn btn--text">
                  {tWeb('home.cta_login')}
                </Link>
              </div>
              <ul className="home-hero__pills">
                {VALUE_PILLS.map(({ key, icon, tone }) => (
                  <li key={key}>
                    <span className={`pill home-hero__pill home-hero__pill--${tone}`}>
                      <AppIcon name={icon} className="home-hero__pill-icon" />
                      {t(`auth.login.${key}`)}
                    </span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="home-hero__visual">
              <div className="home-hero__portraits" aria-hidden>
                <img
                  className="avatar home-hero__portrait home-hero__portrait--side"
                  src={HOME_PORTRAITS.left}
                  alt=""
                  width={96}
                  height={96}
                  decoding="async"
                />
                <img
                  className="avatar avatar--132 home-hero__portrait home-hero__portrait--center"
                  src={HOME_PORTRAITS.center}
                  alt=""
                  width={132}
                  height={132}
                  decoding="async"
                />
                <img
                  className="avatar home-hero__portrait home-hero__portrait--side"
                  src={HOME_PORTRAITS.right}
                  alt=""
                  width={96}
                  height={96}
                  decoding="async"
                />
              </div>
              <div className="card home-hero__example">
                <p className="label">{tWeb('home.example_label')}</p>
                <div className="home-hero__example-bubbles">
                  <div className="bubble--ai">
                    <p>
                      {exampleSegments.map((part, index) =>
                        part.highlight ? (
                          <strong key={index} className="bubble__hl">
                            {part.text}
                          </strong>
                        ) : (
                          <span key={index}>{part.text}</span>
                        ),
                      )}
                    </p>
                  </div>
                  <div className="bubble--user">
                    <p>{tWeb('home.example_user')}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="home-how" aria-labelledby="home-how-heading">
          <h2 id="home-how-heading" className="home-how__title">
            {tWeb('home.how_title')}
          </h2>
          <ul className="home-how__grid">
            {HOW_STEPS.map(({ icon, titleKey, bodyKey }) => (
              <li key={titleKey} className="home-how__item">
                <span className="home-how__icon" aria-hidden>
                  <AppIcon name={icon} />
                </span>
                <h3 className="home-how__item-title">{tWeb(`home.${titleKey}`)}</h3>
                <p className="home-how__item-body">{tWeb(`home.${bodyKey}`)}</p>
              </li>
            ))}
          </ul>
        </section>

        <section className="home-control" aria-labelledby="home-control-heading">
          <h2 id="home-control-heading" className="home-control__title">
            {tWeb('home.control_title')}
          </h2>
          <ul className="home-control__seals">
            {VALUE_SEALS.map(({ key, icon }) => (
              <li key={key} className="home-control__seal">
                <AppIcon name={icon} className="home-control__seal-icon" />
                <span>{t(`auth.login.${key}`)}</span>
              </li>
            ))}
          </ul>
        </section>
      </DesktopShell>
    </div>
  );
}
