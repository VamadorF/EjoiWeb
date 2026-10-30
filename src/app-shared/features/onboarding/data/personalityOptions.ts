// AUTO-SINCRONIZADO desde ejoiFE a1e61e3d072b6cc9e8b074adda33480eb1d3a1f2@a1e61e3d072b6cc9e8b074adda33480eb1d3a1f2:src/features/onboarding/data/personalityOptions.ts. No editar: npm run sync:app
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
