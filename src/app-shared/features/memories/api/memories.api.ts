// AUTO-SINCRONIZADO desde ejoiFE a1e61e3d072b6cc9e8b074adda33480eb1d3a1f2@a1e61e3d072b6cc9e8b074adda33480eb1d3a1f2:src/features/memories/api/memories.api.ts. No editar: npm run sync:app
import { httpClient } from '@/shared/services/http/client';
import { SharedMomentResponse } from '../types';

export const getMemories = async (companionId: string): Promise<SharedMomentResponse[]> => {
  const response = await httpClient.get<SharedMomentResponse[]>(
    `/shared-moments?companionId=${encodeURIComponent(companionId)}`
  );
  return Array.isArray(response.data) ? response.data : [];
};
