// AUTO-SINCRONIZADO desde ejoiFE origin/develop@b20f6d62a97a0266796ebfb82e772f0961ed9136:src/shared/utils/logger.ts. No editar: npm run sync:app
/**
 * Utilidad de logging
 */

const isDevelopment = __DEV__;

/** Resumen seguro de una URL para logs de diagnóstico (p. ej. avatar del companion). */
export const summarizeUrlForLog = (url?: string | null) => {
  const trimmed = url?.trim() ?? '';
  return {
    hasValue: trimmed.length > 0,
    length: trimmed.length,
    preview: isDevelopment && trimmed ? `${trimmed.slice(0, 48)}${trimmed.length > 48 ? '…' : ''}` : undefined,
  };
};

export const logger = {
  log: (...args: any[]) => {
    if (isDevelopment) {
      console.log('[LOG]', ...args);
    }
  },
  
  info: (...args: any[]) => {
    if (isDevelopment) {
      console.info('[INFO]', ...args);
    }
  },
  
  warn: (...args: any[]) => {
    if (isDevelopment) {
      console.warn('[WARN]', ...args);
    }
  },
  
  error: (...args: any[]) => {
    console.error('[ERROR]', ...args);
  },
  
  debug: (...args: any[]) => {
    if (isDevelopment) {
      console.debug('[DEBUG]', ...args);
    }
  },
};

