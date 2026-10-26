// AUTO-SINCRONIZADO desde ejoiFE 9234854dc9f9992b39b7f61dfb0e02b768be467d@9234854dc9f9992b39b7f61dfb0e02b768be467d:src/features/onboarding/data/companionIntensity.ts. No editar: npm run sync:app
import { CompanionIntensity } from '../types';

export interface CompanionIntensityConfig {
  id: CompanionIntensity;
  label: string;
  description: string;
  behavior: string;
  visual: string;
  psychologicalRule: string;
}

export const INTENSITY_OPTIONS: CompanionIntensityConfig[] = [
  {
    id: 'soft',
    label: 'Suave',
    description:
      'Una presencia ligera, cálida y tranquila. Ideal si quieres compañía sin sentir demasiada intensidad emocional.',
    behavior: 'gentle, subtle, emotionally light, warm but not overwhelming',
    visual: 'soft expression, relaxed posture, understated emotional presence',
    psychologicalRule:
      'La intensidad suave implica una presencia ligera, cálida y tranquila, con apoyo emocional sutil y no invasivo.',
  },
  {
    id: 'balanced',
    label: 'Equilibrada',
    description:
      'Un equilibrio entre cercanía, personalidad y naturalidad. Recomendada para la mayoría de usuarios.',
    behavior: 'balanced emotional presence, affectionate but natural, consistent support',
    visual: 'clear emotional presence, warm gaze, confident but approachable',
    psychologicalRule:
      'La intensidad equilibrada implica una presencia emocional clara, cálida y constante, pero natural y no invasiva.',
  },
  {
    id: 'intense',
    label: 'Activa',
    description:
      'Una presencia más expresiva, atenta y emocionalmente marcada. Ideal si quieres una conexión más profunda.',
    behavior: 'deeply present, emotionally expressive, highly attentive and devoted in tone',
    visual: 'strong eye contact, more emotionally magnetic presence, expressive mood',
    psychologicalRule:
      'La intensidad activa implica una presencia más expresiva, atenta y emocionalmente marcada, orientada a una conexión profunda sin perder respeto ni equilibrio.',
  },
];

export function getIntensityConfig(
  intensity?: CompanionIntensity
): CompanionIntensityConfig {
  return (
    INTENSITY_OPTIONS.find((option) => option.id === intensity) ??
    INTENSITY_OPTIONS[1]
  );
}
