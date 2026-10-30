// AUTO-SINCRONIZADO desde ejoiFE a1e61e3d072b6cc9e8b074adda33480eb1d3a1f2@a1e61e3d072b6cc9e8b074adda33480eb1d3a1f2:src/shared/utils/ethnicityLabel.ts. No editar: npm run sync:app
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
