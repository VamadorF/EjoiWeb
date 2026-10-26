// AUTO-SINCRONIZADO desde ejoiFE 9234854dc9f9992b39b7f61dfb0e02b768be467d@9234854dc9f9992b39b7f61dfb0e02b768be467d:src/features/companion/types.ts. No editar: npm run sync:app
/**
 * Tipos para feature Companion
 */

import { Gender, VisualStyle } from '@/features/onboarding/types';
import type { SharedMomentResponse } from '@/features/memories/types';

// --- Tipos para el contrato con el backend ---

export interface JsonRules {
  visualStyle: string;
  gender: string;
  ethnicity: string;
  persona: string;
  tone: string;
  interactionStyle: string;
  conversationDepth: string;
  interests: string[];
  boundaries?: string[];
  description?: string;
  dob?: string;
  physicalRules?: string;
  psychologicalRules?: string;
}

export interface CompanionApiPayload {
  name: string;
  description: string;
  dob: string;
  physicalRules: string;
  psychologicalRules: string;
  jsonRules: JsonRules;
  avatarUrl: string;
  avatarStoragePath?: string;
}

/**
 * Payload de salida hacia el backend (POST/PUT /companion/me).
 * Refleja el UpsertCompanionDto del backend: todos los campos son PLANOS
 * en el nivel superior (no existe `jsonRules`).
 */
export interface CompanionUpsertDto {
  name?: string;
  visualStyle?: string;
  gender?: string;
  ethnicity?: string;
  persona?: string;
  tone?: string;
  interactionStyle?: string;
  conversationDepth?: string;
  interests: string[];
  boundaries: string[];
  description?: string;
  dob?: string;
  physicalRules?: string;
  psychologicalRules?: string;
  avatarUrl?: string;
  avatarStoragePath?: string;
  extra?: Record<string, unknown>;
}

export interface CompanionApiResponse {
  id: string;
  name?: string;
  description?: string;
  dob?: string;
  physicalRules?: string;
  psychologicalRules?: string;
  jsonRules?: Partial<JsonRules>;
  avatarUrl?: string;
  avatar_url?: string;
  avatarStoragePath?: string;
  createdAt?: string;
  updatedAt?: string;
  sharedMoments?: SharedMomentResponse[];
  // Legacy flat fields (backward compat)
  visualStyle?: string;
  gender?: string;
  ethnicity?: string;
  persona?: string;
  tone?: string;
  interactionStyle?: string;
  conversationDepth?: string;
  interests?: string[] | string;
  boundaries?: string[] | string;
  extra?: Record<string, unknown>;
}

export interface Companion {
  id: string;
  name: string;
  visualStyle: VisualStyle;
  gender: Gender;
  persona: string;
  tone: string;
  interactionStyle: string;
  conversationDepth: string;
  interests: string[];
  boundaries: string[];
  ethnicity?: string;
  description?: string;
  dob?: string;
  physicalRules?: string;
  psychologicalRules?: string;
  avatarUrl?: string;
  avatarStoragePath?: string;
  createdAt?: string;
  updatedAt?: string;
  sharedMoments?: SharedMomentResponse[];
}

// --- Tipos para crear/actualizar (formato plano, el adapter envuelve en jsonRules) ---

export interface CreateCompanionRequest {
  name: string;
  visualStyle?: VisualStyle | string;
  gender?: Gender | string;
  ethnicity?: string;
  persona?: string;
  tone?: string;
  interactionStyle?: string;
  conversationDepth?: string;
  interests?: string[];
  boundaries?: string[];
  description?: string;
  dob?: string;
  physicalRules?: string;
  psychologicalRules?: string;
  avatarUrl?: string;
  avatarStoragePath?: string;
}

export type UpdateCompanionRequest = Partial<CreateCompanionRequest>;
