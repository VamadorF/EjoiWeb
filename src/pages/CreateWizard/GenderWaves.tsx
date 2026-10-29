import { useEffect, useRef } from 'react';
import { Mesh, Program, Renderer, Triangle } from 'ogl';

import { readBackdrop, waveLook, type Rgb, type WaveLook } from './waveLook';

const VERT = `#version 300 es
in vec2 position;
void main() {
  gl_Position = vec4(position, 0.0, 1.0);
}
`;

const FRAG = `#version 300 es
precision highp float;

uniform vec2 uResolution;
uniform float uTime;
uniform vec3 uCore;
uniform vec3 uHot;
uniform vec3 uDeep;
uniform float uGlow;
uniform float uAlpha;

out vec4 fragColor;

float ribbon(float y, float center, float width) {
  float d = y - center;
  return exp(-(d * d) / (width * width));
}

void main() {
  vec2 uv = gl_FragCoord.xy / uResolution;
  float t = uTime;
  vec2 q = (uv - vec2(0.5, 0.46)) * vec2(1.2, 1.45);
  float away = smoothstep(0.22, 0.7, length(q));
  vec3 col = vec3(0.0);
  float cover = 0.0;

  for (int i = 0; i < 10; i++) {
    float fi = float(i);
    float right = step(5.0, fi);
    float g = right > 0.5 ? fi - 5.0 : fi;
    float reach = right > 0.5
      ? smoothstep(0.62, 0.9, uv.x)
      : smoothstep(0.38, 0.1, uv.x);
    float y0 = (g < 3.0 ? 0.12 + g * 0.055 : 0.74 + (g - 3.0) * 0.08) + right * 0.05;
    float phase = fi * 1.8;
    float speed = 0.16 + g * 0.04;
    float alongX = right > 0.5 ? uv.x : 1.0 - uv.x;
    float amp = 0.055 + 0.02 * sin(fi);
    float y = y0
      + amp * sin(alongX * 7.5 + t * speed + phase)
      + amp * 0.45 * sin(alongX * 3.4 - t * speed * 0.55 + phase * 1.3);
    float glowW = mix(0.012, 0.038, uGlow);
    float line = ribbon(uv.y, y, 0.0022);
    float halo = ribbon(uv.y, y, glowW);
    float along = 0.5 + 0.5 * sin(alongX * 3.2 + t * 0.32 + fi);
    vec3 tint = mix(uDeep, uHot, along);
    tint = mix(tint, uCore, 0.7);
    float strand = (line + halo * mix(0.14, 0.4, uGlow)) * reach * away;
    col += tint * strand;
    cover += strand;
  }

  for (int i = 0; i < 7; i++) {
    float fi = float(i);
    float right = step(3.5, fi);
    float px = right > 0.5
      ? 0.78 + 0.16 * fract(fi * 0.37)
      : 0.06 + 0.16 * fract(fi * 0.41);
    float py = fract(0.12 + fi * 0.17);
    py = py > 0.45 && py < 0.62 ? py + 0.28 : py;
    px += 0.012 * sin(t * 0.2 + fi);
    vec2 d = (uv - vec2(px, py)) * vec2(uResolution.x / max(uResolution.y, 1.0), 1.0);
    float speck = exp(-dot(d, d) / 0.000028) * away;
    col += mix(uCore, uHot, 0.45) * speck * 0.4;
    cover += speck * 0.16;
  }

  vec3 rgb = col / max(cover, 1e-3);
  float a = clamp(cover, 0.0, 1.0) * uAlpha;
  fragColor = vec4(min(rgb, vec3(1.0)) * a, a);
}
`;

function unit(rgb: Rgb): [number, number, number] {
  return [rgb[0] / 255, rgb[1] / 255, rgb[2] / 255];
}

function lerp(a: number, b: number, t: number) {
  return a + (b - a) * t;
}

function lerpLook(current: WaveLook, target: WaveLook, t: number): WaveLook {
  const mix = (a: Rgb, b: Rgb): Rgb => [
    lerp(a[0], b[0], t),
    lerp(a[1], b[1], t),
    lerp(a[2], b[2], t),
  ];
  return {
    glow: lerp(current.glow, target.glow, t),
    alpha: lerp(current.alpha, target.alpha, t),
    core: mix(current.core, target.core),
    hot: mix(current.hot, target.hot),
    deep: mix(current.deep, target.deep),
  };
}

export default function GenderWaves({ color }: { color: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const colorRef = useRef(color);
  const wakeRef = useRef<(() => void) | null>(null);
  colorRef.current = color;

  useEffect(() => {
    wakeRef.current?.();
  }, [color]);

  useEffect(() => {
    const el = ref.current;
    if (!el) return undefined;

    let renderer: Renderer;
    try {
      renderer = new Renderer({
        alpha: true,
        premultipliedAlpha: true,
        antialias: false,
        depth: false,
        // ponytail: dpr cap 1.5; subirlo si las ondas se ven blandas en pantallas grandes
        dpr: Math.min(window.devicePixelRatio || 1, 1.5),
      });
    } catch {
      return undefined;
    }
    if (!renderer.isWebgl2) {
      renderer.gl.getExtension('WEBGL_lose_context')?.loseContext();
      return undefined;
    }

    const gl = renderer.gl;
    const canvas = gl.canvas as HTMLCanvasElement;
    canvas.setAttribute('aria-hidden', 'true');
    canvas.style.display = 'block';
    el.appendChild(canvas);

    const uniforms = {
      uResolution: { value: [1, 1] },
      uTime: { value: 0 },
      uCore: { value: [1, 0.2, 0.45] },
      uHot: { value: [1, 0.45, 0.7] },
      uDeep: { value: [0.7, 0.05, 0.3] },
      uGlow: { value: 1 },
      uAlpha: { value: 0.6 },
    };
    const program = new Program(gl, {
      vertex: VERT,
      fragment: FRAG,
      uniforms,
      transparent: true,
      depthTest: false,
      depthWrite: false,
    });
    const mesh = new Mesh(gl, { geometry: new Triangle(gl), program });

    let backdrop = readBackdrop(el);
    let look = waveLook(colorRef.current, backdrop);
    let raf = 0;
    let last = performance.now();
    let alive = true;
    const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
    let reduced = motion.matches;

    const apply = (next: WaveLook) => {
      uniforms.uCore.value = unit(next.core);
      uniforms.uHot.value = unit(next.hot);
      uniforms.uDeep.value = unit(next.deep);
      uniforms.uGlow.value = next.glow;
      uniforms.uAlpha.value = next.alpha;
    };
    apply(look);

    const sample = () => {
      backdrop = readBackdrop(el);
    };

    const resize = () => {
      const w = el.clientWidth;
      const h = el.clientHeight;
      if (w < 2 || h < 2) return;
      renderer.setSize(w, h);
      uniforms.uResolution.value = [gl.canvas.width, gl.canvas.height];
    };

    const frame = (now: number) => {
      raf = 0;
      if (!alive) return;
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      const target = waveLook(colorRef.current, backdrop);
      look = lerpLook(look, target, 1 - Math.exp(-dt * 3));
      apply(look);
      if (!reduced) uniforms.uTime.value += dt;
      gl.clearColor(0, 0, 0, 0);
      renderer.render({ scene: mesh });
      if (!reduced && !document.hidden) raf = requestAnimationFrame(frame);
    };

    const start = () => {
      if (raf || !alive) return;
      last = performance.now();
      raf = requestAnimationFrame(frame);
    };

    const onMotion = () => {
      reduced = motion.matches;
      start();
    };
    const onVisible = () => {
      if (!document.hidden) start();
    };

    const resizeObserver = new ResizeObserver(() => {
      resize();
      start();
    });
    resizeObserver.observe(el);
    const themeObserver = new MutationObserver(() => {
      sample();
      start();
    });
    themeObserver.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['data-theme', 'style', 'class'],
    });
    motion.addEventListener('change', onMotion);
    document.addEventListener('visibilitychange', onVisible);
    wakeRef.current = start;
    resize();
    sample();
    start();

    return () => {
      alive = false;
      wakeRef.current = null;
      cancelAnimationFrame(raf);
      resizeObserver.disconnect();
      themeObserver.disconnect();
      motion.removeEventListener('change', onMotion);
      document.removeEventListener('visibilitychange', onVisible);
      gl.getExtension('WEBGL_lose_context')?.loseContext();
      canvas.remove();
    };
  }, []);

  return <div ref={ref} style={{ position: 'absolute', inset: 0 }} />;
}
