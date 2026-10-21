import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { ONBOARDING_STEPS } from '@/features/onboarding/constants/onboardingSteps';

import { applyCssVars } from '~/theme/cssVars';

import { CreationPreview } from './CreationPreview';

const emptyData = {
  gender: '' as const,
  visualStyle: '' as const,
  persona: '',
  tone: '',
  interactionStyle: '',
  conversationDepth: '',
  interests: [] as string[],
  boundaries: [] as string[],
};

describe('CreationPreview', () => {
  it('muestra retratos atenuados cuando hay género pero no estilo', () => {
    applyCssVars();
    render(
      <CreationPreview
        data={{ ...emptyData, gender: 'femenino' }}
        currentStep={ONBOARDING_STEPS.gender}
      />,
    );
    expect(screen.getByTestId('creation-preview-empty')).toBeTruthy();
    expect(document.querySelectorAll('.creation-preview__empty-portrait').length).toBe(2);
  });

  it('cambia el retrato al cambiar estilo en el mismo render', () => {
    applyCssVars();
    const base = {
      gender: 'femenino' as const,
      visualStyle: '' as const,
      persona: '',
      tone: '',
      interactionStyle: '',
      conversationDepth: '',
      interests: [] as string[],
      boundaries: [] as string[],
    };
    const { rerender } = render(
      <CreationPreview
        data={{ ...base, visualStyle: 'realista' }}
        currentStep={ONBOARDING_STEPS.visualStyle}
      />,
    );
    const img = screen.getByTestId('creation-portrait') as HTMLImageElement;
    const realistaSrc = img.src;
    rerender(
      <CreationPreview data={{ ...base, visualStyle: 'anime' }} currentStep={ONBOARDING_STEPS.visualStyle} />,
    );
    expect((screen.getByTestId('creation-portrait') as HTMLImageElement).src).not.toBe(realistaSrc);
  });
});
