// AUTO-SINCRONIZADO desde ejoiFE 64d4aac4c69dbe3ca4d58a65271d9b91a96b60b7@64d4aac4c69dbe3ca4d58a65271d9b91a96b60b7:src/features/memories/api/memories.api.ts. No editar: npm run sync:app
import { httpClient } from '@/shared/services/http/client';
import { SharedMomentResponse } from '../types';

export const getMemories = async (companionId: string): Promise<SharedMomentResponse[]> => {
  const response = await httpClient.get<SharedMomentResponse[]>(
    `/shared-moments?companionId=${encodeURIComponent(companionId)}`
  );
  return Array.isArray(response.data) ? response.data : [];
};
