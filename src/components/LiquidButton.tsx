import type { ButtonHTMLAttributes } from 'react';

import { useMotionEnabled } from '~/theme/theme';

/** Filtro SVG del vidrio. Uno solo en el documento (`#container-glass`). */
export function GlassFilter() {
  const { enabled: motion } = useMotionEnabled();

  return (
    <svg className="liquid-glass-filter" aria-hidden="true" focusable="false">
      <defs>
        <filter
          id="container-glass"
          x="0%"
          y="0%"
          width="100%"
          height="100%"
          colorInterpolationFilters="sRGB"
        >
          <feTurbulence
            type="fractalNoise"
            baseFrequency="0.05 0.05"
            numOctaves={1}
            seed={1}
            result="turbulence"
          >
            {motion ? (
              <animate
                attributeName="baseFrequency"
                dur="9s"
                values="0.04 0.05;0.07 0.03;0.04 0.05"
                repeatCount="indefinite"
              />
            ) : null}
          </feTurbulence>
          <feGaussianBlur in="turbulence" stdDeviation={2} result="blurredNoise" />
          <feDisplacementMap
            in="SourceGraphic"
            in2="blurredNoise"
            scale={70}
            xChannelSelector="R"
            yChannelSelector="B"
            result="displaced"
          >
            {motion ? (
              <animate attributeName="scale" dur="8s" values="48;70;48" repeatCount="indefinite" />
            ) : null}
          </feDisplacementMap>
          <feGaussianBlur in="displaced" stdDeviation={4} result="finalBlur" />
          <feComposite in="finalBlur" in2="finalBlur" operator="over" />
        </filter>
      </defs>
    </svg>
  );
}

/** Botón de vidrio. Sin variantes: el tema pinta el resto de la UI. */
export function LiquidButton({
  className = '',
  children,
  type = 'button',
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button type={type} className={`liquid-btn ${className}`.trim()} {...props}>
      <span className="liquid-btn__edge" aria-hidden="true" />
      <span className="liquid-btn__glass" aria-hidden="true" />
      <span className="liquid-btn__label">{children}</span>
    </button>
  );
}
