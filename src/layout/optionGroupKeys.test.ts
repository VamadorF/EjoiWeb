import { describe, expect, it } from 'vitest';

import { groupButtons, moveRovingFocus, syncRovingTabIndex } from './optionGroupKeys';

function mountGroup(html: string) {
  const root = document.createElement('div');
  root.innerHTML = html;
  document.body.appendChild(root);
  return root;
}

describe('optionGroupKeys', () => {
  it('roving tabindex favorece la opción seleccionada en radio', () => {
    const root = mountGroup(`
      <button type="button" aria-checked="false">a</button>
      <button type="button" aria-checked="true">b</button>
    `);
    syncRovingTabIndex(root, 'radio');
    const buttons = groupButtons(root);
    expect(buttons[0].tabIndex).toBe(-1);
    expect(buttons[1].tabIndex).toBe(0);
    root.remove();
  });

  it('flecha abajo mueve el foco sin activar', () => {
    const root = mountGroup(`
      <button type="button" aria-checked="true">a</button>
      <button type="button" aria-checked="false">b</button>
    `);
    syncRovingTabIndex(root, 'radio');
    root.querySelectorAll('button')[0].focus();
    moveRovingFocus({
      key: 'ArrowDown',
      currentTarget: root,
      preventDefault: () => {},
    } as unknown as KeyboardEvent);
    expect(document.activeElement?.textContent).toBe('b');
    root.remove();
  });
});
