/**
 * Planes públicos del paywall móvil (ejoiFE `features/subscription/constants/plans.ts`).
 * Sin IDs de tienda: esta vista no cobra.
 * ponytail: copia manual; si el contrato CLP cambia en la app, actualizar aquí.
 */

export type PlanId = 'free' | 'bimestral' | 'semestral' | 'anual';

export type PriceView = 'mensual' | 'anual';

export interface SubscriptionPlan {
  id: PlanId;
  label: string;
  tagline: string;
  features: string[];
  /** Precio del contrato en CLP. Free = 0. */
  contractClp: number;
  /** Meses del contrato. Free = null. */
  contractMonths: number | null;
  /** Equivalente mensual de marketing (CLP). */
  monthlyClp: number;
  /** Copy del cobro, igual que `billingPeriodLabel` de la app. */
  billingPeriodLabel: string;
  highlight?: boolean;
}

export const PLANS: SubscriptionPlan[] = [
  {
    id: 'free',
    label: 'Free',
    tagline: 'Por ser nuevo en eJoi',
    features: [
      'Por ser nuevo en eJoi',
      '60 mensajes de bienvenida',
      'Para probar el chat con tu companion',
    ],
    contractClp: 0,
    contractMonths: null,
    monthlyClp: 0,
    billingPeriodLabel: '',
  },
  {
    id: 'bimestral',
    label: 'Bimestral',
    tagline: '2 meses de chat',
    features: [
      '2 meses de chat',
      'Puedes chatear con tu companion durante 2 meses',
      'Se cobra cada 2 meses hasta que canceles',
    ],
    contractClp: 14000,
    contractMonths: 2,
    monthlyClp: 7000,
    billingPeriodLabel: 'cada 2 meses',
  },
  {
    id: 'semestral',
    label: 'Semestral',
    tagline: '6 meses de chat',
    features: [
      '6 meses de chat',
      'Puedes chatear con tu companion durante 6 meses',
      'Se cobra cada 6 meses hasta que canceles',
    ],
    contractClp: 40000,
    contractMonths: 6,
    monthlyClp: 6667,
    highlight: true,
    billingPeriodLabel: 'cada 6 meses',
  },
  {
    id: 'anual',
    label: 'Anual',
    tagline: '12 meses de chat',
    features: [
      '12 meses de chat',
      'Puedes chatear con tu companion durante 12 meses',
      'Se cobra una vez al año hasta que canceles',
    ],
    contractClp: 70000,
    contractMonths: 12,
    monthlyClp: 5833,
    billingPeriodLabel: 'al año',
  },
];

const CHOSEN_KEY = 'ejoi.subscription.plan';

/** Mensual = equivalente. Anual = 12 meses del cobro real (no es otro SKU). */
export function displayPriceClp(plan: SubscriptionPlan, view: PriceView): number {
  if (plan.contractMonths == null) return 0;
  if (view === 'mensual') return plan.monthlyClp;
  return Math.round((plan.contractClp * 12) / plan.contractMonths);
}

export function formatClp(amount: number): string {
  return `$${amount.toLocaleString('es-CL')} CLP`;
}

export function readChosenPlanId(): PlanId | null {
  try {
    const raw = localStorage.getItem(CHOSEN_KEY);
    return PLANS.some((plan) => plan.id === raw) ? (raw as PlanId) : null;
  } catch {
    return null;
  }
}

export function writeChosenPlanId(id: PlanId): void {
  try {
    localStorage.setItem(CHOSEN_KEY, id);
  } catch {
    /* quota / modo privado */
  }
}
