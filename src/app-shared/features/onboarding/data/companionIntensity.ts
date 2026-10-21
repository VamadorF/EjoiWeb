// AUTO-SINCRONIZADO desde ejoiFE b20f6d62a97a0266796ebfb82e772f0961ed9136@b20f6d62a97a0266796ebfb82e772f0961ed9136:src/features/onboarding/data/companionIntensity.ts. No editar: npm run sync:app
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
      'Una presencia ligera, calida y tranquila. Ideal si quieres compania sin sentir demasiada intensidad emocional.',
    behavior: 'gentle, subtle, emotionally light, warm but not overwhelming',
    visual: 'soft expression, relaxed posture, understated emotional presence',
    psychologicalRule:
      'La intensidad suave implica una presencia ligera, calida y tranquila, con apoyo emocional sutil y no invasivo.',
  },
  {
    id: 'balanced',
    label: 'Balanceada',
    description:
      'Un equilibrio entre cercania, personalidad y naturalidad. Recomendada para la mayoria de usuarios.',
    behavior: 'balanced emotional presence, affectionate but natural, consistent support',
    visual: 'clear emotional presence, warm gaze, confident but approachable',
    psychologicalRule:
      'La intensidad balanceada implica una presencia emocional clara, calida y constante, pero natural y no invasiva.',
  },
  {
    id: 'intense',
    label: 'Intensa',
    description:
      'Una presencia mas expresiva, atenta y emocionalmente marcada. Ideal si quieres una conexion mas profunda.',
    behavior: 'deeply present, emotionally expressive, highly attentive and devoted in tone',
    visual: 'strong eye contact, more emotionally magnetic presence, expressive mood',
    psychologicalRule:
      'La intensidad intensa implica una presencia mas expresiva, atenta y emocionalmente marcada, orientada a una conexion profunda sin perder respeto ni equilibrio.',
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
