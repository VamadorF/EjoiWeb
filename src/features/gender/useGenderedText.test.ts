import { describe, expect, it } from 'vitest';

import { PERSONALITY_OPTIONS } from '@/features/onboarding/data/personalityOptions';
import { getRandomCompanionName } from '@/features/onboarding/data/getRandomCompanionName';
import { validators } from '@/shared/utils/validators';

import i18n from '~/i18n';

import { createGenderedTextWith } from './useGenderedText';

const t = i18n.t.bind(i18n);

describe('createGenderedTextWith', () => {
  const amigable = PERSONALITY_OPTIONS.find((p) => p.toLowerCase().includes('amigable'))!;

  it('formatea rasgos en masculino y neutro', () => {
    expect(createGenderedTextWith('masculino', t).trait(amigable)).toBe('Amigable y empático');
    expect(createGenderedTextWith('neutro', t).trait(amigable)).toBe('Amigable y empátique');
  });

  it('resuelve título listo con género', () => {
    expect(createGenderedTextWith('masculino', t).tg('companion.ready.title_default', { name: 'Leo' })).toBe(
      '¡Leo está listo!',
    );
  });

  it('sin género, companion() no devuelve marcador @', () => {
    const word = createGenderedTextWith('', t).companion();
    expect(word).not.toMatch(/@/);
    expect(word.length).toBeGreaterThan(0);
  });

  it('traduce creando con nombre', () => {
    expect(t('chat.creating_title', { name: 'Alex', ns: 'web' })).toBe('Creando a Alex');
  });
});

describe('validators.name (app-shared)', () => {
  it('acepta y rechaza nombres como en la app', () => {
    expect(validators.name('María José')).toBe(true);
    expect(validators.name("D'Angelo")).toBe(true);
    expect(validators.name('Ana-Luz')).toBe(true);
    expect(validators.name('Ana.')).toBe(false);
    expect(validators.name('ANA')).toBe(false);
    expect(validators.getNameError('Ana.')).toBeTruthy();
    expect(validators.getNameError('ANA')).toBeTruthy();
  });
});

describe('getRandomCompanionName', () => {
  it('no repite el nombre actual cuando hay alternativas', () => {
    const name = getRandomCompanionName('latina', 'femenino', 'Sofía', () => 0);
    expect(name).not.toBe('Sofía');
  });
});
