// AUTO-SINCRONIZADO desde ejoiFE a1e61e3d072b6cc9e8b074adda33480eb1d3a1f2@a1e61e3d072b6cc9e8b074adda33480eb1d3a1f2:src/features/companion/api/companion.api.ts. No editar: npm run sync:app
/**
 * Servicio de API para Companion
 * Todos los endpoints usan /companion/me (la identidad viene del JWT)
 */

import { httpClient } from '@/shared/services/http/client';
import { logger, summarizeUrlForLog } from '@/shared/utils/logger';
import {
  fromCompanionApiResponse,
  toPatchCompanionDto,
  toUpsertCompanionDto,
} from '../adapters/companion.adapter';
import { Companion, CreateCompanionRequest, UpdateCompanionRequest } from '../types';

/**
 * Obtiene el companion del usuario autenticado
 * Endpoint: GET /companion/me
 */
export const getMyCompanion = async (): Promise<Companion | null> => {
  logger.info('[Companion][getMyCompanion] GET /companion/me');
  const response = await httpClient.get<unknown>('/companion/me');
  const companion = fromCompanionApiResponse(response.data as any);
  logger.info('[Companion][getMyCompanion] respuesta normalizada', {
    hasCompanion: Boolean(companion),
    companionId: companion?.id,
    avatarUrl: summarizeUrlForLog(companion?.avatarUrl),
    rawAvatarFields: {
      avatarUrl: summarizeUrlForLog(
        (response.data as { avatarUrl?: string })?.avatarUrl
      ),
      avatar_url: summarizeUrlForLog(
        (response.data as { avatar_url?: string })?.avatar_url
      ),
    },
  });
  logger.debug('[Companion][getMyCompanion] payload crudo', response.data);
  return companion;
};

/**
 * Crea un nuevo companion para el usuario autenticado
 * Endpoint: POST /companion/me
 */
export const createCompanion = async (data: CreateCompanionRequest): Promise<Companion> => {
  const dto = toUpsertCompanionDto(data);
  logger.debug('[companion.api] POST /companion/me payload', dto);

  const response = await httpClient.post<unknown>('/companion/me', dto);
  logger.debug('[companion.api] POST /companion/me response', response.data);

  const normalized = fromCompanionApiResponse(response.data as any);
  if (!normalized) {
    throw new Error('El backend no devolvio un companion valido');
  }
  return normalized;
};

/**
 * Actualiza el companion del usuario autenticado
 * Endpoint: PUT /companion/me
 */
export const updateCompanion = async (data: UpdateCompanionRequest): Promise<Companion> => {
  const dto = toUpsertCompanionDto(data);
  logger.info('[Companion][updateCompanion] PUT /companion/me', {
    boundariesCount: dto.boundaries.length,
    interestsCount: dto.interests.length,
    boundaries: dto.boundaries,
  });
  logger.debug('[Companion][updateCompanion] payload', dto);

  const response = await httpClient.put<unknown>('/companion/me', dto);
  logger.debug('[Companion][updateCompanion] respuesta cruda', response.data);

  const normalized = fromCompanionApiResponse(response.data as any);
  if (!normalized) {
    logger.error('[Companion][updateCompanion] respuesta inválida del backend');
    throw new Error('El backend no devolvio un companion valido');
  }

  logger.info('[Companion][updateCompanion] éxito', {
    companionId: normalized.id,
    boundariesCount: normalized.boundaries.length,
    boundaries: normalized.boundaries,
  });
  return normalized;
};

/**
 * Actualización parcial del companion autenticado
 * Endpoint: PATCH /companion/me
 */
export const patchCompanion = async (data: UpdateCompanionRequest): Promise<Companion> => {
  const dto = toPatchCompanionDto(data);
  logger.info('[Companion][patchCompanion] PATCH /companion/me', {
    keys: Object.keys(dto),
  });
  logger.debug('[Companion][patchCompanion] payload', dto);

  const response = await httpClient.patch<unknown>('/companion/me', dto);
  logger.debug('[Companion][patchCompanion] respuesta cruda', response.data);

  const normalized = fromCompanionApiResponse(response.data as any);
  if (!normalized) {
    logger.error('[Companion][patchCompanion] respuesta inválida del backend');
    throw new Error('El backend no devolvio un companion valido');
  }

  logger.info('[Companion][patchCompanion] éxito', {
    companionId: normalized.id,
    boundariesCount: normalized.boundaries.length,
  });
  return normalized;
};
