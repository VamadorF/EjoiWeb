// AUTO-SINCRONIZADO desde ejoiFE 9234854dc9f9992b39b7f61dfb0e02b768be467d@9234854dc9f9992b39b7f61dfb0e02b768be467d:src/shared/utils/ethnicityLabel.ts. No editar: npm run sync:app
import { Gender } from '@/features/onboarding/types';

const ETHNICITY_GENDER_MAP: Record<string, { femenino: string; masculino: string; neutro: string }> = {
  latina:            { femenino: 'Latina',            masculino: 'Latino',            neutro: 'Latine' },
  'caucásica':       { femenino: 'Caucásica',         masculino: 'Caucásico',         neutro: 'Caucásique' },
  caucasica:         { femenino: 'Caucásica',         masculino: 'Caucásico',         neutro: 'Caucásique' },
  afrodescendiente:  { femenino: 'Afrodescendiente',  masculino: 'Afrodescendiente',  neutro: 'Afrodescendiente' },
  'asiática':        { femenino: 'Asiática',          masculino: 'Asiático',          neutro: 'Asiátique' },
  asiatica:          { femenino: 'Asiática',          masculino: 'Asiático',          neutro: 'Asiátique' },
  'árabe':           { femenino: 'Árabe',             masculino: 'Árabe',             neutro: 'Árabe' },
  arabe:             { femenino: 'Árabe',             masculino: 'Árabe',             neutro: 'Árabe' },
};

export const formatEthnicityByGender = (
  ethnicity?: string,
  gender?: Gender | string,
): string | undefined => {
  if (!ethnicity) return undefined;

  const key = ethnicity.trim().toLowerCase();
  const entry = ETHNICITY_GENDER_MAP[key];

  if (!entry) return ethnicity;

  const g = (gender as Gender) || 'femenino';
  return entry[g] ?? entry.femenino;
};
