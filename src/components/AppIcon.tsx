import { useEffect, useState } from 'react';

const iconLoaders = import.meta.glob<string>(
  '../../node_modules/ionicons/dist/svg/*.svg',
  { query: '?raw', import: 'default' },
);

function loaderFor(name: string) {
  return iconLoaders[`../../node_modules/ionicons/dist/svg/${name}.svg`];
}

export type AppIconProps = {
  name: string;
  label?: string;
  className?: string;
};

export function AppIcon({ name, label, className }: AppIconProps) {
  const [svg, setSvg] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    const load = loaderFor(name);
    if (!load) {
      setSvg(null);
      return;
    }
    void load().then((raw) => {
      if (active) setSvg(raw);
    });
    return () => {
      active = false;
    };
  }, [name]);

  if (!svg) return null;

  const classes = ['app-icon', className].filter(Boolean).join(' ');

  return (
    <span
      className={classes}
      aria-hidden={label ? undefined : true}
      aria-label={label}
      role={label ? 'img' : undefined}
      dangerouslySetInnerHTML={{ __html: svg }}
    />
  );
}
