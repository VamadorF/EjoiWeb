export type AparicionBubble = { id: string; role: string; createdAt?: string; pending?: boolean };

export type AparicionWatch = {
  seeded: boolean;
  known: ReadonlySet<string>;
  /** Tope del historial ya pintado. Solo entra lo que llega después y tras un envío. */
  seedBaselineMs: number;
  armed: boolean;
  play: ReadonlySet<string>;
};

export function emptyAparicion(): AparicionWatch {
  return { seeded: false, known: new Set(), seedBaselineMs: 0, armed: false, play: new Set() };
}

export function segmentGraphemes(text: string): string[] {
  if (typeof Intl !== 'undefined' && 'Segmenter' in Intl) {
    return [...new Intl.Segmenter('es', { granularity: 'grapheme' }).segment(text)].map((part) => part.segment);
  }
  return [...text];
}

function atMs(iso?: string): number {
  const t = iso ? Date.parse(iso) : Number.NaN;
  return Number.isFinite(t) ? t : Number.NEGATIVE_INFINITY;
}

function latestMs(messages: readonly AparicionBubble[]): number {
  let max = Number.NEGATIVE_INFINITY;
  for (const m of messages) {
    const t = atMs(m.createdAt);
    if (t > max) max = t;
  }
  return Number.isFinite(max) ? max : 0;
}

/**
 * Marca respuestas nuevas de la compañera. El primer lote es historial (F5, pestaña, scroll).
 * ponytail: no hay flag de streaming; el mismo id no vuelve a entrar aquí. El tramo nuevo lo anima el componente.
 */
export function noteAparicion(
  state: AparicionWatch,
  messages: readonly AparicionBubble[],
  themeOn: boolean,
): AparicionWatch {
  if (!state.seeded) {
    return {
      seeded: true,
      known: new Set(messages.map((m) => m.id)),
      seedBaselineMs: latestMs(messages),
      armed: messages.some((m) => m.role === 'user' && m.pending === true),
      play: new Set(),
    };
  }
  if (messages.every((m) => state.known.has(m.id))) return state;

  const ordered = [...messages].sort((a, b) => atMs(a.createdAt) - atMs(b.createdAt));
  const known = new Set(state.known);
  const play = new Set(state.play);
  let armed = state.armed;
  for (const m of ordered) {
    if (known.has(m.id)) continue;
    known.add(m.id);
    if (m.role === 'user') {
      armed = true;
      continue;
    }
    if (m.role === 'assistant' && armed && themeOn && atMs(m.createdAt) > state.seedBaselineMs) {
      play.add(m.id);
    }
  }
  return { seeded: true, known, seedBaselineMs: state.seedBaselineMs, armed, play };
}
