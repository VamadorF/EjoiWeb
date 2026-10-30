import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('./env', async (importOriginal) => ({
  ...(await importOriginal<typeof import('./env')>()),
  IMAGE_API_URL: 'https://img.test',
  MOCK_API: false,
}));

vi.mock('./secure', () => ({
  getAuthToken: vi.fn().mockResolvedValue('tok'),
  getUserData: vi.fn().mockResolvedValue(JSON.stringify({ id: 'u1' })),
}));

import { editCompanionImageWithReference } from './image.api.shim';

const referenceUrl = 'https://storage.googleapis.com/ejoi-images/avatars/u1/a.webp?X-Goog-Signature=abc';

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });
}

describe('editCompanionImageWithReference', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('envía la referencia como multipart a generate-with-image', async () => {
    vi.mocked(fetch)
      .mockResolvedValueOnce(new Response(new Blob(['img'], { type: 'image/webp' })))
      .mockResolvedValueOnce(jsonResponse({ fileUrl: 'https://img.test/new.png', storagePath: 'avatars/u1/new.png' }));

    const result = await editCompanionImageWithReference({ prompt: 'Edit the reference image.', referenceUrl });

    expect(result).toEqual({ fileUrl: 'https://img.test/new.png', storagePath: 'avatars/u1/new.png' });
    expect(vi.mocked(fetch).mock.calls[0]![0]).toBe(referenceUrl);

    const [url, init] = vi.mocked(fetch).mock.calls[1]!;
    expect(url).toBe('https://img.test/image/generate-with-image');
    expect(init?.method).toBe('POST');
    expect((init?.headers as Record<string, string>).Authorization).toBe('Bearer tok');
    const body = init?.body as FormData;
    expect(body.get('prompt')).toBe('Edit the reference image.');
    expect(body.get('uuid')).toBe('u1');
    expect(body.get('image')).toBeInstanceOf(Blob);
    expect((body.get('image') as File).name).toBe('companion-reference.webp');
  });

  it('falla si la referencia no se puede descargar', async () => {
    vi.mocked(fetch).mockResolvedValueOnce(new Response('', { status: 403 }));

    await expect(editCompanionImageWithReference({ prompt: 'p', referenceUrl })).rejects.toThrow();
    expect(fetch).toHaveBeenCalledTimes(1);
  });

  it('falla si la respuesta no trae fileUrl', async () => {
    vi.mocked(fetch)
      .mockResolvedValueOnce(new Response(new Blob(['img'], { type: 'image/png' })))
      .mockResolvedValueOnce(jsonResponse({ storagePath: 'x' }));

    await expect(editCompanionImageWithReference({ prompt: 'p', referenceUrl })).rejects.toThrow();
  });
});
