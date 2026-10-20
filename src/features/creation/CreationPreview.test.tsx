import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { applyCssVars } from '~/theme/cssVars';

import { CreationPreview } from './CreationPreview';

describe('CreationPreview', () => {
  it('cambia el retrato al cambiar estilo en el mismo render', () => {
    applyCssVars();
    const base = {
      gender: 'femenino' as const,
      persona: '',
      tone: '',
      interactionStyle: '',
      conversationDepth: '',
      interests: [],
      boundaries: [],
    };
    const { rerender } = render(
      <CreationPreview data={{ ...base, visualStyle: 'realista' }} tagTimeline={['style']} />,
    );
    const img = screen.getByTestId('creation-portrait') as HTMLImageElement;
    expect(img.getAttribute('src')).toContain('realista-femenino');

    rerender(<CreationPreview data={{ ...base, visualStyle: 'anime' }} tagTimeline={['style']} />);
    expect((screen.getByTestId('creation-portrait') as HTMLImageElement).getAttribute('src')).toContain(
      'ilustrado-femenino',
    );
  });

  it('marca la última etiqueta como destacada', () => {
    applyCssVars();
    const { container } = render(
      <CreationPreview
        data={{
          visualStyle: 'realista',
          gender: 'femenino',
          persona: '',
          tone: '',
          interactionStyle: '',
          conversationDepth: '',
          interests: ['Arte y cultura', 'Música'],
          boundaries: [],
        }}
        tagTimeline={['gender', 'style', 'interest:Arte y cultura', 'interest:Música']}
      />,
    );
    const tags = container.querySelectorAll('.creation-preview__tag');
    const last = tags[tags.length - 1];
    expect(last?.textContent).toBe('Música');
    expect(last?.classList.contains('creation-preview__tag--latest')).toBe(true);
  });
});
