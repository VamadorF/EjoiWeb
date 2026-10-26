// AUTO-SINCRONIZADO desde ejoiFE 9234854dc9f9992b39b7f61dfb0e02b768be467d@9234854dc9f9992b39b7f61dfb0e02b768be467d:src/features/onboarding/data/personalityOptions.ts. No editar: npm run sync:app
import type { ComponentProps } from 'react';
import type { Ionicons } from '@expo/vector-icons';

export const PERSONALITY_OPTIONS = [
  'Amigable y empática',
  'Divertida y desenfadada',
  'Inteligente y curiosa',
  'Cariñosa y comprensiva',
  'Energética y motivadora',
  'Tranquila y reflexiva',
  'Analítica y lógica',
  'Creativa y artística',
] as const;

export type PersonalityOption = (typeof PERSONALITY_OPTIONS)[number];

type IoniconName = ComponentProps<typeof Ionicons>['name'];

/** Iconos Ionicons por rasgo (sin emojis). */
export const PERSONALITY_OPTION_ICONS: Record<PersonalityOption, IoniconName> = {
  'Amigable y empática': 'heart-outline',
  'Divertida y desenfadada': 'happy-outline',
  'Inteligente y curiosa': 'bulb-outline',
  'Cariñosa y comprensiva': 'hand-left-outline',
  'Energética y motivadora': 'flash-outline',
  'Tranquila y reflexiva': 'leaf-outline',
  'Analítica y lógica': 'analytics-outline',
  'Creativa y artística': 'color-palette-outline',
};
