// AUTO-SINCRONIZADO desde ejoiFE origin/develop@b20f6d62a97a0266796ebfb82e772f0961ed9136:src/features/onboarding/data/interestOptions.ts. No editar: npm run sync:app
import type { ComponentProps } from 'react';
import type { Ionicons } from '@expo/vector-icons';

export const INTEREST_OPTIONS = [
  'Tecnología',
  'Arte y cultura',
  'Ciencia',
  'Deportes',
  'Música',
  'Literatura',
  'Cine y series',
  'Viajes',
  'Cocina',
  'Filosofía',
  'Psicología',
  'Historia',
  'Negocios',
  'Salud y bienestar',
  'Moda y estilo',
] as const;

export type InterestOption = (typeof INTEREST_OPTIONS)[number];

type IoniconName = ComponentProps<typeof Ionicons>['name'];

export const INTEREST_OPTION_ICONS: Record<InterestOption, IoniconName> = {
  Tecnología: 'hardware-chip-outline',
  'Arte y cultura': 'color-palette-outline',
  Ciencia: 'flask-outline',
  Deportes: 'football-outline',
  Música: 'musical-notes-outline',
  Literatura: 'book-outline',
  'Cine y series': 'film-outline',
  Viajes: 'airplane-outline',
  Cocina: 'restaurant-outline',
  Filosofía: 'infinite-outline',
  Psicología: 'people-circle-outline',
  Historia: 'library-outline',
  Negocios: 'briefcase-outline',
  'Salud y bienestar': 'medkit-outline',
  'Moda y estilo': 'shirt-outline',
};
