import type { TFunction } from 'i18next';

import { formatInterestLabel } from '@/shared/utils/companionTextGenerator';

export type IcebreakerCompanion = {
  name: string;
  interests: string[];
};

/**
 * Sugerencias para el primer mensaje, en voz del usuario hacia el companion (SCRUM-190).
 * No usar generateGreeting/generateChatWelcome: son textos que dice el companion.
 */
export function buildIcebreakerSuggestions(
  companion: IcebreakerCompanion,
  t: TFunction,
  tShared: TFunction,
  max = 3,
): string[] {
  const name = companion.name.trim();
  const interest = companion.interests.map(formatInterestLabel).find(Boolean);

  const candidates = [
    name ? t('chat.icebreaker_greet', { name }) : tShared('chat.icebreaker.fallback_1'),
    interest ? t('chat.icebreaker_interest', { interest }) : null,
    t('chat.icebreaker_about'),
    tShared('chat.icebreaker.fallback_2'),
  ];

  const out: string[] = [];
  for (const line of candidates) {
    if (line && !out.includes(line)) out.push(line);
  }
  return out.slice(0, max);
}
