import { describe, expect, it } from 'vitest';

import { parseHex, rgbLuma, waveLook, type Rgb } from './waveLook';

const dark: Rgb = [27, 25, 24];
const light: Rgb = [251, 247, 244];

describe('waveLook', () => {
  it('aclara el trazo sobre fondo oscuro y lo oscurece sobre fondo claro', () => {
    const onDark = waveLook('#F20A64', dark);
    const onLight = waveLook('#F20A64', light);
    expect(rgbLuma(onDark.core)).toBeGreaterThan(rgbLuma(onLight.core));
    expect(onDark.glow).toBeGreaterThan(onLight.glow);
    expect(Math.abs(rgbLuma(onLight.core) - rgbLuma(light))).toBeGreaterThan(0.35);
  });

  it('conserva el tono del género', () => {
    const pink = waveLook('#F20A64', dark).core;
    const violet = waveLook('#6E5CE0', dark).core;
    const green = waveLook('#1E9A62', dark).core;
    expect(pink[0] - pink[2]).toBeGreaterThan(violet[0] - violet[2]);
    expect(violet[2]).toBeGreaterThan(violet[0]);
    expect(green[1]).toBeGreaterThan(green[0]);
  });

  it('levanta el verde para que no se hunda en el fondo oscuro', () => {
    const raw = parseHex('#1E9A62');
    expect(rgbLuma(waveLook('#1E9A62', dark).core)).toBeGreaterThan(rgbLuma(raw));
  });

  it('no lava rosa y violeta al mismo color', () => {
    const pink = waveLook('#F20A64', dark).core;
    const violet = waveLook('#6E5CE0', dark).core;
    const delta = Math.abs(pink[0] - violet[0]) + Math.abs(pink[2] - violet[2]);
    expect(delta).toBeGreaterThan(40);
  });
});
