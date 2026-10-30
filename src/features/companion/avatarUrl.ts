/**
 * La URL firmada de GCS supera el `@MaxLength(400)` de `avatarUrl` en eJoi-BE (400 silencioso).
 * Sin la firma sigue identificando el objeto; el BE la re-firma desde `avatarStoragePath`.
 */
export function toPersistedAvatarUrl(url: string): string {
  return url.trim().split(/[?#]/)[0];
}
