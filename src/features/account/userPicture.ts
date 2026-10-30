import type { User } from '@/features/auth/types';

import { readSessionUser } from '~/features/account/useCurrentUser';
import * as session from '~/platform/session';

/** De mayor a menor. El primero que quepa en localStorage es el que se guarda. */
const STEPS = [
  [256, 0.82],
  [160, 0.66],
  [96, 0.5],
  [48, 0.4],
] as const;

export type PictureSave = 'saved' | 'shrunk' | 'full' | 'unread';

export function userJsonWithPicture(raw: string | null, picture: string, fallback: User | null): string | null {
  let base: Record<string, unknown> | null = null;
  if (raw) {
    try {
      const parsed = JSON.parse(raw) as unknown;
      if (parsed && typeof parsed === 'object') base = { ...(parsed as Record<string, unknown>) };
    } catch {
      base = null;
    }
  }
  if (!base && fallback?.id) base = { ...fallback };
  if (!base || !picture) return null;
  base.picture = picture;
  return JSON.stringify(base);
}

/** Prueba candidatos en orden. Un candidato vacío no escribe. Si ninguno cabe, no toca la foto. */
export function persistPictureCandidates(
  candidates: readonly string[],
  raw: string | null,
  fallback: User | null,
): PictureSave {
  let shrunk = false;
  for (const picture of candidates) {
    if (!picture) continue;
    const json = userJsonWithPicture(raw, picture, fallback);
    if (!json) return 'unread';
    if (session.trySetUserDataJson(json)) return shrunk ? 'shrunk' : 'saved';
    shrunk = true;
  }
  return 'full';
}

async function jpegDataUrl(file: File, maxSide: number, quality: number): Promise<string> {
  const bitmap = await createImageBitmap(file);
  try {
    const longest = Math.max(bitmap.width, bitmap.height) || 1;
    const scale = Math.min(1, maxSide / longest);
    const width = Math.max(1, Math.round(bitmap.width * scale));
    const height = Math.max(1, Math.round(bitmap.height * scale));
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('canvas');
    ctx.drawImage(bitmap, 0, 0, width, height);
    return canvas.toDataURL('image/jpeg', quality);
  } finally {
    bitmap.close();
  }
}

export async function saveUserPicture(file: File): Promise<PictureSave> {
  const raw = session.getUserDataJson();
  const fallback = readSessionUser();
  const candidates: string[] = [];
  for (const [side, quality] of STEPS) {
    try {
      candidates.push(await jpegDataUrl(file, side, quality));
    } catch {
      break;
    }
  }
  if (candidates.length === 0) return 'unread';
  return persistPictureCandidates(candidates, raw, fallback);
}
