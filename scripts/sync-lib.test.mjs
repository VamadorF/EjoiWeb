import { describe, expect, it } from 'vitest';
import { checkImport, parseImports, portraitPipeline, resolveSpecifier } from './sync-lib.mjs';

const config = {
  shims: { '@/shared/services/http/client': 'src/platform/http.ts' },
  allowedPackages: ['react'],
  typeOnlyPackages: ['@expo/vector-icons'],
};

describe('sync-lib', () => {
  it('rechaza react-native con cadena implícita en el spec', () => {
    const src = `import { View } from 'react-native';\n`;
    const imp = parseImports(src)[0];
    const result = checkImport(imp.spec, imp.isTypeOnly, config);
    expect(result.status).toBe('prohibido');
    expect(result.motivo).toMatch(/React Native/);
  });

  it('acepta import type de @expo/vector-icons', () => {
    const src = `import type { Ionicons } from '@expo/vector-icons';\n`;
    const imp = parseImports(src)[0];
    expect(checkImport(imp.spec, imp.isTypeOnly, config).status).toBe('ok');
  });

  it('resuelve shim http client', () => {
    expect(checkImport('@/shared/services/http/client', false, config).status).toBe('shim');
    expect(resolveSpecifier('@/shared/utils/uuid', 'src/features/auth/api/auth.api.ts')).toBe(
      'src/shared/utils/uuid.ts',
    );
  });

  it('portraitPipeline prioriza crop explícito sobre resize', () => {
    expect(
      portraitPipeline({ crop: { left: 257, top: 0, size: 560 }, resize: 640 }),
    ).toEqual({
      kind: 'crop',
      extract: { left: 257, top: 0, width: 560, height: 560 },
      outputSize: 512,
    });
    expect(portraitPipeline({ resize: 640 })).toEqual({ kind: 'attention', resize: 640 });
    expect(portraitPipeline({})).toBeNull();
  });
});
