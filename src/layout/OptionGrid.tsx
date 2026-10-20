import type { ReactNode } from 'react';

import './OptionGrid.css';

export type OptionGridCols = 3 | 4 | 6;

export type OptionGridProps = {
  cols: OptionGridCols;
  children: ReactNode;
};

export function OptionGrid({ cols, children }: OptionGridProps) {
  return (
    <div className="option-grid" data-cols={cols}>
      {children}
    </div>
  );
}
