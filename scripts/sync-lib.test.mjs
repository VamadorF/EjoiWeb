import { describe, expect, it } from 'vitest';
import { checkImport, parseImports, resolveSpecifier } from './sync-lib.mjs';

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
});
