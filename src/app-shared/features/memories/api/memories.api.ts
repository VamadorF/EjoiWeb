// AUTO-SINCRONIZADO desde ejoiFE 9234854dc9f9992b39b7f61dfb0e02b768be467d@9234854dc9f9992b39b7f61dfb0e02b768be467d:src/features/memories/api/memories.api.ts. No editar: npm run sync:app
import { httpClient } from '@/shared/services/http/client';
import { SharedMomentResponse } from '../types';

export const getMemories = async (companionId: string): Promise<SharedMomentResponse[]> => {
  const response = await httpClient.get<SharedMomentResponse[]>(
    `/shared-moments?companionId=${encodeURIComponent(companionId)}`
  );
  return Array.isArray(response.data) ? response.data : [];
};
