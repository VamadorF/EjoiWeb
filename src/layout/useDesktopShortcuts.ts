import { useEffect } from 'react';
import { useNavigate } from 'react-router';

type DesktopShortcutsOptions = {
  escapeTo?: string;
  escapeEnabled?: boolean;
  onEnterContinue?: () => void;
  canContinue?: boolean;
};

function fieldHasText(target: EventTarget | null) {
  if (!(target instanceof HTMLElement)) return false;
  if (target instanceof HTMLTextAreaElement) return target.value.trim().length > 0;
  if (target instanceof HTMLInputElement) {
    const type = target.type;
    if (type === 'checkbox' || type === 'radio' || type === 'hidden') return false;
    return target.value.trim().length > 0;
  }
  return false;
}

export function useDesktopShortcuts({
  escapeTo,
  escapeEnabled = true,
  onEnterContinue,
  canContinue = false,
}: DesktopShortcutsOptions) {
  const navigate = useNavigate();

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.isComposing) return;

      if (event.key === 'Escape' && escapeEnabled && escapeTo) {
        if (fieldHasText(event.target)) return;
        event.preventDefault();
        void navigate(escapeTo);
        return;
      }

      if (event.key !== 'Enter' || event.shiftKey) return;
      if (!canContinue || !onEnterContinue) return;

      const target = event.target;
      if (target instanceof HTMLButtonElement) return;
      if (target instanceof HTMLTextAreaElement) return;
      if (target instanceof HTMLInputElement && target.type !== 'checkbox') return;

      event.preventDefault();
      onEnterContinue();
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [canContinue, escapeEnabled, escapeTo, navigate, onEnterContinue]);
}
