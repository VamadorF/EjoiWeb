import type { KeyboardEvent as ReactKeyboardEvent } from 'react';

export type OptionGroupMode = 'radio' | 'toggle';

export function groupButtons(root: HTMLElement): HTMLButtonElement[] {
  return [...root.querySelectorAll<HTMLButtonElement>(':scope button:not([disabled])')];
}

export function syncRovingTabIndex(root: HTMLElement, mode: OptionGroupMode) {
  const buttons = groupButtons(root);
  if (buttons.length === 0) return;

  let focusIdx = -1;
  if (mode === 'radio') {
    focusIdx = buttons.findIndex((b) => b.getAttribute('aria-checked') === 'true');
  } else {
    focusIdx = buttons.findIndex((b) => b.tabIndex === 0);
  }
  if (focusIdx < 0) focusIdx = 0;

  buttons.forEach((btn, i) => {
    btn.tabIndex = i === focusIdx ? 0 : -1;
  });
}

export function moveRovingFocus(event: ReactKeyboardEvent<HTMLElement> | KeyboardEvent) {
  const root = event.currentTarget as HTMLElement;
  const buttons = groupButtons(root);
  if (buttons.length === 0) return;

  const active = document.activeElement as HTMLElement | null;
  let idx = active ? buttons.indexOf(active as HTMLButtonElement) : -1;
  if (idx < 0) idx = buttons.findIndex((b) => b.tabIndex === 0);
  if (idx < 0) idx = 0;

  const key = event.key;
  if (key === ' ' || key === 'Spacebar') {
    event.preventDefault();
    if (active && buttons.includes(active as HTMLButtonElement)) {
      (active as HTMLButtonElement).click();
    }
    return;
  }

  let next = idx;
  if (key === 'ArrowDown' || key === 'ArrowRight') {
    event.preventDefault();
    next = (idx + 1) % buttons.length;
  } else if (key === 'ArrowUp' || key === 'ArrowLeft') {
    event.preventDefault();
    next = (idx - 1 + buttons.length) % buttons.length;
  } else if (key === 'Home') {
    event.preventDefault();
    next = 0;
  } else if (key === 'End') {
    event.preventDefault();
    next = buttons.length - 1;
  } else {
    return;
  }

  buttons[next].focus();
  buttons.forEach((btn, i) => {
    btn.tabIndex = i === next ? 0 : -1;
  });
}
