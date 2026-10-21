// AUTO-SINCRONIZADO desde ejoiFE b20f6d62a97a0266796ebfb82e772f0961ed9136@b20f6d62a97a0266796ebfb82e772f0961ed9136:src/features/memories/api/memories.api.ts. No editar: npm run sync:app
import { httpClient } from '@/shared/services/http/client';
import { SharedMomentResponse } from '../types';

export const getMemories = async (companionId: string): Promise<SharedMomentResponse[]> => {
  const response = await httpClient.get<SharedMomentResponse[]>(
    `/shared-moments?companionId=${encodeURIComponent(companionId)}`
  );
  return Array.isArray(response.data) ? response.data : [];
};
