export type LogoProps = {
  /** Ancho mínimo del manual UX v2 (≥ 64 px). */
  width?: number;
  className?: string;
};

const LOGO_ASPECT = 83 / 104;

export function Logo({ width = 64, className }: LogoProps) {
  const height = Math.round(width * LOGO_ASPECT);
  return (
    <img
      src="/logos/principal.png"
      srcSet="/logos/principal@2x.png 2x"
      alt="eJoi"
      width={width}
      height={height}
      style={{ width, height: 'auto' }}
      className={className}
    />
  );
}
