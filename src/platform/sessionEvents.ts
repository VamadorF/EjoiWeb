/** Fin de sesión (refresh fallido o logout): el orquestador de sesión vuelve a `/`. */
export const SESSION_EXPIRED_EVENT = 'ejoi:session-expired';

export function notifySessionExpired(): void {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent(SESSION_EXPIRED_EVENT));
  }
}
