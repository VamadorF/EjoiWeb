// AUTO-SINCRONIZADO desde ejoiFE b20f6d62a97a0266796ebfb82e772f0961ed9136@b20f6d62a97a0266796ebfb82e772f0961ed9136:src/features/companion/adapters/companion.adapter.ts. No editar: npm run sync:app
import { Gender, VisualStyle } from '@/features/onboarding/types';
import {
  Companion,
  CompanionApiResponse,
  CompanionUpsertDto,
  CreateCompanionRequest,
  UpdateCompanionRequest,
} from '../types';
import { logger, summarizeUrlForLog } from '@/shared/utils/logger';
import { ageToDob } from '@/shared/utils/ageToDob';
import {
  dobToAge,
  logCompanionAge,
  parseApparentAgeFromPhysicalRules,
} from '@/shared/utils/companionAgeAppearance';

type RawCompanionResponse =
  | CompanionApiResponse
  | { data?: CompanionApiResponse | null; companion?: CompanionApiResponse | null }
  | null
  | undefined;

const trimOptional = (value?: string): string | undefined => {
  const normalized = value?.trim();
  return normalized ? normalized : undefined;
};

const normalizeStringArray = (values?: string[] | string | null): string[] => {
  if (!values) return [];
  if (typeof values === 'string') {
    try {
      const parsed = JSON.parse(values);
      if (Array.isArray(parsed)) {
        return parsed.map((item) => String(item).trim()).filter(Boolean);
      }
    } catch {
      return values.split(',').map((s) => s.trim()).filter(Boolean);
    }
  }
  if (!Array.isArray(values)) return [];
  return values.map((item) => String(item).trim()).filter(Boolean);
};

const resolveTransitionArray = (...values: Array<string[] | string | null | undefined>): string[] => {
  let fallback: string[] | null = null;

  for (const value of values) {
    if (value == null) continue;

    const normalized = normalizeStringArray(value);
    fallback ??= normalized;

    if (normalized.length > 0) {
      return normalized;
    }
  }

  return fallback ?? [];
};

const normalizeVisualStyle = (value?: string): VisualStyle => (value === 'anime' ? 'anime' : 'realista');

const normalizeGender = (value?: string): Gender => {
  if (value === 'masculino' || value === 'neutro') return value;
  return 'femenino';
};

const normalizeIncomingDob = (value: unknown): string | undefined => {
  if (typeof value !== 'string') return undefined;
  const trimmed = value.trim();
  if (!trimmed) return undefined;
  if (dobToAge(trimmed) !== undefined) return trimmed;

  const dateOnly = trimmed.slice(0, 10);
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateOnly) && dobToAge(dateOnly) !== undefined) {
    return dateOnly;
  }
  return undefined;
};

const extractCompanion = (raw: RawCompanionResponse): CompanionApiResponse | null => {
  if (!raw) return null;
  if ('data' in raw || 'companion' in raw) {
    return (raw as { data?: CompanionApiResponse | null; companion?: CompanionApiResponse | null })
      .data ?? (raw as { companion?: CompanionApiResponse | null }).companion ?? null;
  }
  return raw as CompanionApiResponse;
};

/**
 * Outbound: convierte el formato plano del frontend al payload del backend.
 * El DTO del backend (UpsertCompanionDto) espera todos los campos PLANOS en el
 * nivel superior: NO existe `jsonRules`. Enviarlos anidados hace que la
 * validación (whitelist) de NestJS los descarte silenciosamente.
 */
export const toUpsertCompanionDto = (
  payload: CreateCompanionRequest | UpdateCompanionRequest
): CompanionUpsertDto => {
  const interests = normalizeStringArray(payload.interests);
  const boundaries = normalizeStringArray(payload.boundaries);
  const ethnicity = trimOptional(payload.ethnicity);
  const description = trimOptional(payload.description) ?? '';
  const dob = trimOptional(payload.dob) ?? '';
  const physicalRules = trimOptional(payload.physicalRules) ?? '';
  const psychologicalRules = trimOptional(payload.psychologicalRules) ?? '';
  const avatarUrl = trimOptional(payload.avatarUrl) ?? '';
  const avatarStoragePath = trimOptional(payload.avatarStoragePath);

  const dto: CompanionUpsertDto = {
    interests,
    boundaries,
    ...(typeof payload.name === 'string' && { name: (trimOptional(payload.name) ?? '').slice(0, 80) }),
    ...(payload.visualStyle !== undefined && {
      visualStyle: normalizeVisualStyle(trimOptional(String(payload.visualStyle))),
    }),
    ...(payload.gender !== undefined && {
      gender: normalizeGender(trimOptional(String(payload.gender))),
    }),
    ...(ethnicity !== undefined && { ethnicity }),
    ...(payload.persona !== undefined && { persona: trimOptional(payload.persona) ?? '' }),
    ...(payload.tone !== undefined && { tone: trimOptional(payload.tone) ?? '' }),
    ...(payload.interactionStyle !== undefined && {
      interactionStyle: trimOptional(payload.interactionStyle) ?? '',
    }),
    ...(payload.conversationDepth !== undefined && {
      conversationDepth: trimOptional(payload.conversationDepth) ?? '',
    }),
    ...(payload.description !== undefined && { description }),
    ...(payload.dob !== undefined && { dob }),
    ...(payload.physicalRules !== undefined && { physicalRules }),
    ...(payload.psychologicalRules !== undefined && { psychologicalRules }),
    ...(payload.avatarUrl !== undefined && { avatarUrl }),
    ...(avatarStoragePath && { avatarStoragePath }),
  };

  return dto;
};

/** Outbound PATCH: solo incluye claves presentes en el payload parcial. */
export const toPatchCompanionDto = (
  payload: UpdateCompanionRequest
): Partial<CompanionUpsertDto> => {
  const dto: Partial<CompanionUpsertDto> = {};

  if (payload.interests !== undefined) {
    dto.interests = normalizeStringArray(payload.interests);
  }
  if (payload.boundaries !== undefined) {
    dto.boundaries = normalizeStringArray(payload.boundaries);
  }
  if (typeof payload.name === 'string') {
    dto.name = (trimOptional(payload.name) ?? '').slice(0, 80);
  }
  if (payload.visualStyle !== undefined) {
    dto.visualStyle = normalizeVisualStyle(trimOptional(String(payload.visualStyle)));
  }
  if (payload.gender !== undefined) {
    dto.gender = normalizeGender(trimOptional(String(payload.gender)));
  }
  if (payload.ethnicity !== undefined) {
    dto.ethnicity = trimOptional(payload.ethnicity);
  }
  if (payload.persona !== undefined) {
    dto.persona = trimOptional(payload.persona) ?? '';
  }
  if (payload.tone !== undefined) {
    dto.tone = trimOptional(payload.tone) ?? '';
  }
  if (payload.interactionStyle !== undefined) {
    dto.interactionStyle = trimOptional(payload.interactionStyle) ?? '';
  }
  if (payload.conversationDepth !== undefined) {
    dto.conversationDepth = trimOptional(payload.conversationDepth) ?? '';
  }
  if (payload.description !== undefined) {
    dto.description = trimOptional(payload.description) ?? '';
  }
  if (payload.dob !== undefined) {
    dto.dob = trimOptional(payload.dob) ?? '';
  }
  if (payload.physicalRules !== undefined) {
    dto.physicalRules = trimOptional(payload.physicalRules) ?? '';
  }
  if (payload.psychologicalRules !== undefined) {
    dto.psychologicalRules = trimOptional(payload.psychologicalRules) ?? '';
  }
  if (payload.avatarUrl !== undefined) {
    dto.avatarUrl = trimOptional(payload.avatarUrl) ?? '';
  }
  const avatarStoragePath = trimOptional(payload.avatarStoragePath);
  if (payload.avatarStoragePath !== undefined && avatarStoragePath) {
    dto.avatarStoragePath = avatarStoragePath;
  }

  return dto;
};

/**
 * Inbound: convierte la respuesta del backend (con jsonRules o legacy plano) al modelo frontend plano.
 * Para arrays, tolera respuestas mixtas y usa el primer valor no vacio disponible.
 */
export const fromCompanionApiResponse = (raw: RawCompanionResponse): Companion | null => {
  const apiResp = extractCompanion(raw);
  if (!apiResp || !apiResp.id) return null;

  const jsonRulesObject = apiResp.jsonRules;
  const extraEthnicity =
    typeof apiResp.extra?.ethnicity === 'string'
      ? trimOptional(apiResp.extra.ethnicity)
      : undefined;
  const resolvedAvatarUrl = apiResp.avatarUrl || apiResp.avatar_url || undefined;
  logger.info('[Companion][adapter] avatar desde API', {
    companionId: apiResp.id,
    avatarUrl: summarizeUrlForLog(resolvedAvatarUrl),
    raw: {
      avatarUrl: summarizeUrlForLog(apiResp.avatarUrl),
      avatar_url: summarizeUrlForLog(apiResp.avatar_url),
    },
  });

  const physicalRulesText =
    trimOptional(typeof apiResp.physicalRules === 'string' ? apiResp.physicalRules : undefined) ??
    trimOptional(
      typeof jsonRulesObject?.physicalRules === 'string' ? jsonRulesObject.physicalRules : undefined,
    );
  const ageFromPhysicalRules = parseApparentAgeFromPhysicalRules(physicalRulesText);
  const resolvedDob =
    normalizeIncomingDob(jsonRulesObject?.dob) ??
    normalizeIncomingDob(apiResp.dob) ??
    (ageFromPhysicalRules !== undefined ? ageToDob(ageFromPhysicalRules) : undefined) ??
    '';
  logCompanionAge('Companion.adapter.fromApi', { dob: resolvedDob }, {
    companionId: apiResp.id,
    name: apiResp.name,
  });

  return {
    id: apiResp.id,
    name: apiResp.name ?? '',
    visualStyle: normalizeVisualStyle(jsonRulesObject?.visualStyle ?? apiResp.visualStyle),
    gender: normalizeGender(jsonRulesObject?.gender ?? apiResp.gender),
    ethnicity:
      jsonRulesObject?.ethnicity ??
      trimOptional(apiResp.ethnicity) ??
      extraEthnicity ??
      '',
    persona: jsonRulesObject?.persona ?? apiResp.persona ?? '',
    tone: jsonRulesObject?.tone ?? apiResp.tone ?? '',
    interactionStyle: jsonRulesObject?.interactionStyle ?? apiResp.interactionStyle ?? '',
    conversationDepth: jsonRulesObject?.conversationDepth ?? apiResp.conversationDepth ?? '',
    interests: resolveTransitionArray(jsonRulesObject?.interests, apiResp.interests),
    boundaries: resolveTransitionArray(jsonRulesObject?.boundaries, apiResp.boundaries),
    description: jsonRulesObject?.description ?? apiResp.description ?? '',
    dob: resolvedDob,
    physicalRules: trimOptional(
      typeof apiResp.physicalRules === 'string' ? apiResp.physicalRules : undefined
    ),
    psychologicalRules: trimOptional(
      typeof apiResp.psychologicalRules === 'string' ? apiResp.psychologicalRules : undefined
    ),
    avatarUrl: resolvedAvatarUrl,
    avatarStoragePath: trimOptional(apiResp.avatarStoragePath),
    createdAt: apiResp.createdAt,
    updatedAt: apiResp.updatedAt,
    sharedMoments: apiResp.sharedMoments ?? [],
  };
};
