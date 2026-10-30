import { describe, expect, it } from 'vitest';

import { displayPriceClp, PLANS } from './plans';

describe('precios de suscripción', () => {
  it('mensual usa el equivalente y anual suma 12 meses del cobro real', () => {
    const plan = Object.fromEntries(PLANS.map((item) => [item.id, item]));
    expect(displayPriceClp(plan.free, 'mensual')).toBe(0);
    expect(displayPriceClp(plan.free, 'anual')).toBe(0);
    expect(displayPriceClp(plan.bimestral, 'mensual')).toBe(7000);
    expect(displayPriceClp(plan.bimestral, 'anual')).toBe(84000);
    expect(displayPriceClp(plan.semestral, 'mensual')).toBe(6667);
    expect(displayPriceClp(plan.semestral, 'anual')).toBe(80000);
    expect(displayPriceClp(plan.anual, 'mensual')).toBe(5833);
    expect(displayPriceClp(plan.anual, 'anual')).toBe(70000);
  });
});
