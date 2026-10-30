import { useEffect, useRef, useState } from 'react';

import { segmentGraphemes } from './aparicion';

import './AparicionText.css';

const STAGGER_S = 0.03;

/** Slide-up por grafema. El mismo id que crece solo anima el tramo nuevo. */
export function AparicionText({ text }: { text: string }) {
  const [run, setRun] = useState(false);
  const fromRef = useRef(0);
  const chars = segmentGraphemes(text);
  let visible = 0;
  for (const ch of chars) if (ch !== '\n') visible += 1;
  const boundary = fromRef.current;
  if (visible > fromRef.current) fromRef.current = visible;

  useEffect(() => {
    setRun(true);
  }, []);

  let order = 0;
  return (
    <span className={`aparicion${run ? ' aparicion--run' : ''}`}>
      <span className="visually-hidden aparicion__sr">{text}</span>
      <span aria-hidden="true">
        {chars.map((ch, index) => {
          if (ch === '\n') return <br key={index} />;
          const place = order++;
          const delay = (place < boundary ? place : place - boundary) * STAGGER_S;
          return (
            <span className="aparicion__mask" key={index}>
              <span className="aparicion__char" style={{ animationDelay: `${delay}s` }}>
                {ch}
              </span>
            </span>
          );
        })}
      </span>
    </span>
  );
}
