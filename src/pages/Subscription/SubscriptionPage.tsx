import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router';

import { AppIcon } from '~/components/AppIcon';
import {
  displayPriceClp,
  formatClp,
  PLANS,
  readChosenPlanId,
  writeChosenPlanId,
  type PlanId,
  type PriceView,
  type SubscriptionPlan,
} from '~/features/subscription/plans';

import './SubscriptionPage.css';

const STARS: ReadonlyArray<readonly [number, number]> = [
  [7, 10], [16, 22], [28, 6], [41, 16], [54, 8], [67, 18], [79, 7], [91, 14],
  [11, 38], [24, 46], [36, 30], [49, 42], [62, 34], [74, 48], [88, 36],
  [6, 62], [19, 74], [33, 68], [47, 80], [58, 60], [71, 76], [84, 66], [94, 84],
];

function motionOff(): boolean {
  if (typeof document !== 'undefined' && document.querySelector('[data-motion="off"]')) return true;
  return (
    typeof window !== 'undefined' &&
    typeof window.matchMedia === 'function' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches
  );
}

function useAnimatedClp(target: number): number {
  const [shown, setShown] = useState(target);
  const shownRef = useRef(target);

  useEffect(() => {
    const from = shownRef.current;
    if (from === target || motionOff()) {
      shownRef.current = target;
      setShown(target);
      return;
    }
    const start = performance.now();
    let raf = 0;
    const tick = (now: number) => {
      const progress = Math.min(1, (now - start) / 520);
      const eased = 1 - (1 - progress) ** 3;
      const next = Math.round(from + (target - from) * eased);
      shownRef.current = next;
      setShown(next);
      if (progress < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target]);

  return shown;
}

function PriceFigure({ plan, view }: { plan: SubscriptionPlan; view: PriceView }) {
  const target = displayPriceClp(plan, view);
  const shown = useAnimatedClp(target);
  if (plan.contractMonths == null) {
    return <p className="sub-price__free">Gratis</p>;
  }
  const widest = Math.max(plan.monthlyClp, displayPriceClp(plan, 'anual'));
  return (
    <p className="sub-price">
      <span className="sub-price__currency">$</span>
      <span
        className="sub-price__num"
        data-testid={`price-${plan.id}`}
        style={{ minWidth: `${widest.toLocaleString('es-CL').length}ch` }}
      >
        {shown.toLocaleString('es-CL')}
      </span>
      <span className="sub-price__suffix">{view === 'mensual' ? '/ mes' : '/ año'}</span>
    </p>
  );
}

function PlanCard({
  plan,
  view,
  chosen,
  featured,
  onChoose,
}: {
  plan: SubscriptionPlan;
  view: PriceView;
  chosen: boolean;
  featured: boolean;
  onChoose: () => void;
}) {
  const primary = chosen || featured;
  return (
    <article className={`sub-card card${plan.highlight ? ' sub-card--hot' : ''}`}>
      {plan.highlight ? <p className="sub-badge">★ Más popular</p> : null}
      <h2 className="sub-card__title">{plan.label}</h2>
      <p className="sub-card__tag">{plan.tagline}</p>
      <PriceFigure plan={plan} view={view} />
      {plan.contractMonths != null ? (
        <p className="sub-card__charge">Cobro real: {formatClp(plan.contractClp)} {plan.billingPeriodLabel}</p>
      ) : (
        <p className="sub-card__charge">Sin cargo</p>
      )}
      <ul className="sub-features">
        {plan.features.map((feature) => (
          <li key={feature}>
            <span aria-hidden="true">✓</span>
            {feature}
          </li>
        ))}
      </ul>
      <button
        type="button"
        className={`btn btn--m sub-card__cta ${primary ? 'btn--primary' : 'btn--secondary'}`}
        aria-pressed={chosen}
        onClick={onChoose}
      >
        {chosen ? 'Plan elegido' : `Elegir ${plan.label}`}
      </button>
    </article>
  );
}

export default function SubscriptionPage() {
  const { t } = useTranslation();
  const [view, setView] = useState<PriceView>('mensual');
  const [chosen, setChosen] = useState<PlanId | null>(() => readChosenPlanId());

  const choose = (id: PlanId) => {
    writeChosenPlanId(id);
    setChosen(id);
  };

  return (
    <main className="sub-page" data-testid="subscription-page">
      <div className="sub-stars" aria-hidden="true">
        {STARS.map(([x, y], index) => (
          <span key={`${x}-${y}`} style={{ left: `${x}%`, top: `${y}%`, animationDelay: `${(index % 8) * -0.55}s` }} />
        ))}
      </div>
      <div className="sub-page__inner">
        <Link to="/cuenta" className="btn btn--text sub-back" aria-label={t('common.back')}>
          <AppIcon name="arrow-back-outline" />
          Cuenta
        </Link>
        <h1 className="sub-title">Elige tu plan</h1>
        <p className="sub-sub">
          Tu suscripción te permite chatear con tu companion mientras el plan esté activo. Elige cuántos meses quieres contratar.
        </p>
        <div className="sub-toggle" role="group" aria-label="Cómo ver el precio">
          <button type="button" aria-pressed={view === 'mensual'} onClick={() => setView('mensual')}>
            Mensual
          </button>
          <button type="button" aria-pressed={view === 'anual'} onClick={() => setView('anual')}>
            Anual
          </button>
        </div>
        <p className="sub-hint">
          Mensual es el equivalente al mes. Anual suma 12 meses con el cobro real de cada plan. No se realiza ningún pago.
        </p>
        <div className="sub-grid">
          {PLANS.map((plan) => (
            <PlanCard
              key={plan.id}
              plan={plan}
              view={view}
              chosen={chosen === plan.id}
              featured={chosen == null && plan.highlight === true}
              onChoose={() => choose(plan.id)}
            />
          ))}
        </div>
      </div>
    </main>
  );
}
