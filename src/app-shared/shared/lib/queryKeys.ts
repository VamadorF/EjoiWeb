// AUTO-SINCRONIZADO desde ejoiFE 9234854dc9f9992b39b7f61dfb0e02b768be467d@9234854dc9f9992b39b7f61dfb0e02b768be467d:src/shared/lib/queryKeys.ts. No editar: npm run sync:app
/**
 * Query Keys centralizadas para React Query
 * Evita strings mágicos y facilita invalidación de cache
 */

export const queryKeys = {
  auth: {
    currentUser: ['auth', 'currentUser'] as const,
  },
  companion: {
    me: ['companion', 'me'] as const,
    list: ['companions'] as const,
  },
  chat: {
    rooms: ['chat', 'rooms'] as const,
    messages: (companionId: string) => ['chat', 'messages', companionId] as const,
  },
  subscription: {
    me: ['subscription', 'me'] as const,
    meBySession: (userId: string, sessionEpoch: number) =>
      ['subscription', 'me', userId, sessionEpoch] as const,
  },
  rewards: {
    list: ['rewards'] as const,
  },
  campaign: {
    benefits: ['campaign', 'benefits'] as const,
    founderCount: ['campaign', 'founderCount'] as const,
    status: ['campaign', 'status'] as const,
    referral: ['campaign', 'referral'] as const,
    referralStats: ['campaign', 'referralStats'] as const,
    referralPreview: (code: string) => ['campaign', 'referralPreview', code] as const,
  },
  memories: {
    list: (companionId: string) => ['memories', companionId] as const,
  },
  proactivity: {
    preferences: ['proactivity', 'preferences'] as const,
  },
} as const;
