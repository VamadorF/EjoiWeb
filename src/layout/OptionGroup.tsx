import { useEffect, useRef, type KeyboardEvent, type ReactNode } from 'react';

import { OptionGrid, type OptionGridCols } from './OptionGrid';
import { moveRovingFocus, syncRovingTabIndex, type OptionGroupMode } from './optionGroupKeys';

export type OptionGroupProps = {
  mode: OptionGroupMode;
  'aria-labelledby': string;
  cols?: OptionGridCols;
  layout?: 'grid' | 'inline';
  className?: string;
  children: ReactNode;
};

export function OptionGroup({
  mode,
  'aria-labelledby': labelledBy,
  cols = 3,
  layout = 'grid',
  className,
  children,
}: OptionGroupProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return undefined;
    syncRovingTabIndex(el, mode);
    const observer = new MutationObserver(() => syncRovingTabIndex(el, mode));
    observer.observe(el, {
      subtree: true,
      attributes: true,
      attributeFilter: ['aria-checked', 'aria-pressed', 'disabled', 'class'],
    });
    return () => observer.disconnect();
  }, [mode, children]);

  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    moveRovingFocus(event);
  };

  const body =
    layout === 'grid' ? <OptionGrid cols={cols}>{children}</OptionGrid> : children;

  return (
    <div
      ref={ref}
      role={mode === 'radio' ? 'radiogroup' : 'group'}
      aria-labelledby={labelledBy}
      className={className}
      onKeyDown={onKeyDown}
    >
      {body}
    </div>
  );
}
