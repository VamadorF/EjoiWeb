import { describe, expect, it } from 'vitest';

import { toPersistedAvatarUrl } from './avatarUrl';

describe('toPersistedAvatarUrl', () => {
  const base = 'https://storage.googleapis.com/ejoi-images/avatars/u1/a.webp';
  const signed =
    base +
    '?X-Goog-Algorithm=GOOG4-RSA-SHA256&X-Goog-Credential=sa%40p.iam.gserviceaccount.com%2F20261030%2Fauto%2Fstorage%2Fgoog4_request' +
    '&X-Goog-Date=20261030T120000Z&X-Goog-Expires=3600&X-Goog-SignedHeaders=host' +
    `&X-Goog-Signature=${'a'.repeat(512)}`;

  it('quita la firma de una URL firmada de GCS', () => {
    expect(signed.length).toBeGreaterThan(400);
    expect(toPersistedAvatarUrl(signed)).toBe(base);
  });

  it('deja igual una URL sin query', () => {
    expect(toPersistedAvatarUrl(base)).toBe(base);
    expect(toPersistedAvatarUrl('/portraits/realista-femenino.webp')).toBe(
      '/portraits/realista-femenino.webp',
    );
  });

  it('quita el fragmento y los espacios', () => {
    expect(toPersistedAvatarUrl(`  ${base}#x  `)).toBe(base);
  });
});
