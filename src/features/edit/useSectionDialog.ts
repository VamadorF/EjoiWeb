import { useCallback, useEffect, useRef } from 'react';

/** Abre/cierra `<dialog>` nativo y devuelve el foco al disparador (DU-12). */
export function useSectionDialog(onClose?: () => void) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const triggerRef = useRef<HTMLElement | null>(null);

  const open = useCallback((trigger: HTMLElement | null) => {
    triggerRef.current = trigger;
    dialogRef.current?.showModal();
  }, []);

  const close = useCallback(() => {
    dialogRef.current?.close();
  }, []);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    const handleClose = () => {
      triggerRef.current?.focus();
      onClose?.();
    };
    dialog.addEventListener('close', handleClose);
    return () => dialog.removeEventListener('close', handleClose);
  }, [onClose]);

  return { dialogRef, open, close };
}
