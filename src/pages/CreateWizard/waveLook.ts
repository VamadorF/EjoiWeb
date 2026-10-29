export type Rgb = [number, number, number];

export type WaveLook = {
  /** 1 = halo luminoso (fondo oscuro), cerca de 0 = trazo de tinta (fondo claro). */
  glow: number;
  alpha: number;
  core: Rgb;
  hot: Rgb;
  deep: Rgb;
};

const BRAND: Rgb = [242, 10, 100];

function clamp(n: number, min: number, max: number) {
  return Math.min(max, Math.max(min, n));
}

export function parseHex(input: string): Rgb {
  const hex = input.trim().replace('#', '');
  const full = hex.length === 3 ? [...hex].map((c) => c + c).join('') : hex;
  const n = Number.parseInt(full.slice(0, 6), 16);
  if (!Number.isFinite(n) || full.length < 6) return BRAND;
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

export function rgbLuma([r, g, b]: Rgb): number {
  const lin = (c: number) => {
    const x = c / 255;
    return x <= 0.04045 ? x / 12.92 : ((x + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
}

function rgbToHsl([r, g, b]: Rgb): [number, number, number] {
  const R = r / 255;
  const G = g / 255;
  const B = b / 255;
  const max = Math.max(R, G, B);
  const min = Math.min(R, G, B);
  const l = (max + min) / 2;
  if (max === min) return [0, 0, l];
  const d = max - min;
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
  let h = 0;
  if (max === R) h = (G - B) / d + (G < B ? 6 : 0);
  else if (max === G) h = (B - R) / d + 2;
  else h = (R - G) / d + 4;
  return [h * 60, s, l];
}

function hslToRgb(h: number, s: number, l: number): Rgb {
  const H = ((h % 360) + 360) % 360;
  const c = (1 - Math.abs(2 * l - 1)) * s;
  const hp = H / 60;
  const x = c * (1 - Math.abs((hp % 2) - 1));
  let rgb: [number, number, number] = [0, 0, 0];
  if (hp < 1) rgb = [c, x, 0];
  else if (hp < 2) rgb = [x, c, 0];
  else if (hp < 3) rgb = [0, c, x];
  else if (hp < 4) rgb = [0, x, c];
  else if (hp < 5) rgb = [x, 0, c];
  else rgb = [c, 0, x];
  const m = l - c / 2;
  return rgb.map((v) => Math.round(clamp(v + m, 0, 1) * 255)) as Rgb;
}

function hueDelta(a: number, b: number) {
  const d = Math.abs(a - b) % 360;
  return d > 180 ? 360 - d : d;
}

/** Tono del género; claridad y halo según la luminancia del fondo. */
export function waveLook(color: string, backdrop: Rgb): WaveLook {
  const [h, s] = rgbToHsl(parseHex(color));
  const [bh, bs, bl] = rgbToHsl(backdrop);
  const luma = rgbLuma(backdrop);
  const dark = luma < 0.5;
  let hue = h;
  if (bs > 0.18 && hueDelta(h, bh) < 22) {
    const signed = ((h - bh + 540) % 360) - 180;
    hue += signed >= 0 ? 18 : -18;
  }
  const sat = clamp(Math.max(s, 0.75), 0.75, 0.96);
  let light = dark ? 0.66 : 0.34;
  if (Math.abs(light - bl) < 0.22) light = dark ? bl + 0.3 : bl - 0.3;
  light = clamp(light, dark ? 0.56 : 0.22, dark ? 0.74 : 0.4);
  const core = hslToRgb(hue, sat, light);
  return {
    glow: dark ? 0.92 : 0.14,
    alpha: dark ? 0.88 : 0.82,
    core,
    hot: hslToRgb(hue + 14, sat, clamp(light + (dark ? 0.1 : -0.05), 0.16, 0.86)),
    deep: hslToRgb(hue - 16, sat, clamp(light + (dark ? -0.08 : 0.04), 0.14, 0.8)),
  };
}

export function parseCssColor(value: string): Rgb | null {
  const m = value.match(/[\d.]+/g);
  if (!m || m.length < 3) return null;
  const alpha = m.length >= 4 ? Number(m[3]) : 1;
  if (alpha < 0.35) return null;
  return [Number(m[0]), Number(m[1]), Number(m[2])];
}

export function averageRgb(colors: Rgb[]): Rgb {
  const n = colors.length || 1;
  const sum = colors.reduce(
    (acc, c) => [acc[0] + c[0], acc[1] + c[1], acc[2] + c[2]] as Rgb,
    [0, 0, 0] as Rgb,
  );
  return [Math.round(sum[0] / n), Math.round(sum[1] / n), Math.round(sum[2] / n)];
}

export function readBackdrop(el: HTMLElement): Rgb {
  let node: HTMLElement | null = el.parentElement;
  while (node) {
    const style = getComputedStyle(node);
    const solid = parseCssColor(style.backgroundColor);
    if (solid) return solid;
    const stops = [...style.backgroundImage.matchAll(/rgba?\([^)]+\)|#[0-9a-fA-F]{3,8}/g)]
      .map((match) => parseCssColor(match[0]))
      .filter((c): c is Rgb => c !== null);
    if (stops.length) return averageRgb(stops);
    node = node.parentElement;
  }
  return [27, 25, 24];
}
