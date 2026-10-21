export type LogoProps = {
  height?: number;
  className?: string;
};

export function Logo({ height = 28, className }: LogoProps) {
  return (
    <img
      src="/logos/principal.png"
      srcSet="/logos/principal@2x.png 2x"
      alt="eJoi"
      height={height}
      style={{ width: 'auto', height }}
      className={className}
    />
  );
}
