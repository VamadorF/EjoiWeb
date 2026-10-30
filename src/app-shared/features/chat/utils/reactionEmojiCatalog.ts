// AUTO-SINCRONIZADO desde ejoiFE a1e61e3d072b6cc9e8b074adda33480eb1d3a1f2@a1e61e3d072b6cc9e8b074adda33480eb1d3a1f2:src/features/chat/utils/reactionEmojiCatalog.ts. No editar: npm run sync:app
/**
 * Capa de presentación: mapea identificadores `ReactionKind` (inferencia / backend)
 * a variantes Unicode; sin tocar prompts ni tipos de inferencia.
 */

import type { ReactionKind } from '../types';

export const REACTION_CATALOG: Record<ReactionKind, string[]> = {
  love: ['❤️', '🥰', '😍', '🫶'],
  tender: ['🥺', '🫂', '❤️‍🩹', '🥹'],
  celebrate: ['🎉', '🥳', '🙌', '✨'],
  fire: ['🔥','💯'],
  perfect: ['💯', '👌', '✨', '✅'],
  disgust: ['🤢', '🤮', '💀', '🤡'],
  laugh: ['😂', '🤣', '😭', '💀'],
  curious: ['👀', '🤔', '🧐'],
  thinking: ['🤔', '💭', '🤨'],
  surprise: ['😲', '😮', '🫢', '🤯'],
  shock: ['😱', '🤯', '💀', '🥶'],
  question: ['❓', '🤔', '🤷'],
  typing: [],
  moai: ['🗿', '💀'],
  bored: ['🥱', '🙄', '😒', '🫠','🗿'],
  sleepy: ['😴', '💤', '😪'],
  proud: ['😎', '😌', '💪', '💅'],
  shy: ['🙈', '😳', '👉👈', '🫣'],
  nostalgic: ['🥲', '❤️‍🩹', '🕰️'],
  uncomfortable: ['😬', '🫠', '🙃', '💀'],
  dancing: ['💃', '🕺', '🪩', '🎶'],
  confused: ['🥴', '😵‍💫', '🤷', '🤡'],
  greeting: ['👋', '✌️', '🫶'],
  farewell: ['👋', '✌️', '🏃💨'],
  excited: ['🤩', '😆', '🙌', '🔥'],
  agree: ['👍', '✅', '🤝', '💯'],
  mindblown: ['🤯', '💀', '🧠'],
  flirty: ['😏', '😘', '🔥', '🥵'],
  playful: ['😜', '🤪', '🤭', '🤡'],
};

export const getRandomEmojiForReaction = (reaction: ReactionKind | null): string | null => {
  if (!reaction || reaction === 'typing') return null;
  const options = REACTION_CATALOG[reaction];
  if (!options || options.length === 0) return null;
  return options[Math.floor(Math.random() * options.length)];
};
