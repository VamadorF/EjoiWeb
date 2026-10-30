// AUTO-SINCRONIZADO desde ejoiFE a1e61e3d072b6cc9e8b074adda33480eb1d3a1f2@a1e61e3d072b6cc9e8b074adda33480eb1d3a1f2:src/features/memories/types.ts. No editar: npm run sync:app
export type SharedMomentType =
  | 'FIRST_MEETING'
  | 'FIRST_MEMORY_SAVED'
  | 'FIRST_DEEP_CONVERSATION'
  | 'RELATIONSHIP_SHIFT';

export interface SharedMomentResponse {
  id: string;
  userId: string;
  companionId: string;
  conversationId: string | null;
  type: SharedMomentType;
  title: string;
  description: string;
  happenedAt: string;
  importance: number;
  sourceMessageId: string | null;
  createdAt: string;
}

export interface Memory {
  id: string;
  title: string;
  preview: string;
  emoji: string;
  mood: string;
  date: string;
  fullDate: string;
  isFavorite?: boolean;
  importance: number;
  category: 'week' | 'month' | 'older';
}
