import { useState } from 'react';
import { clsx } from 'clsx';
import { SvgActions } from '../ui/svg-actions';

export type IconVariant = 'icon' | 'font';
export type IconBackground = 'dark' | 'light' | 'grid';

const bgStyles: Record<IconBackground, string> = {
  dark: 'bg-surface',
  light: 'bg-white',
  grid: 'bg-[length:20px_20px] bg-surface',
};

interface PreviewControlsProps {
  variant: IconVariant;
  onVariantChange: (v: IconVariant) => void;
  bg: IconBackground;
  onBgChange: (b: IconBackground) => void;
}

export function PreviewControls({
  variant,
  onVariantChange,
  bg,
  onBgChange,
}: PreviewControlsProps) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
      <div role="tablist" aria-label="Icon variant" className="tab-group">
        <button
          role="tab"
          onClick={() => onVariantChange('icon')}
          aria-selected={variant === 'icon'}
          className="tab-item">
          Color
        </button>
        <button
          role="tab"
          onClick={() => onVariantChange('font')}
          aria-selected={variant === 'font'}
          className="tab-item">
          Monochrome
        </button>
      </div>
      <div role="tablist" aria-label="Preview background" className="tab-group">
        {(['dark', 'light', 'grid'] as const).map(b => (
          <button
            key={b}
            role="tab"
            type="button"
            onClick={() => onBgChange(b)}
            aria-label={`${b} background`}
            aria-selected={bg === b}
            className={clsx('tabs__swatch', `tabs__swatch--${b}`)}
          />
        ))}
      </div>
    </div>
  );
}

interface IconPreviewGridProps {
  icons: string[];
  name: string;
  variant: IconVariant;
  bg: IconBackground;
  badInDark?: boolean;
  badInLight?: boolean;
  gridClassName?: string;
  tilePaddingClassName?: string;
  iconMaxClassName?: string;
}

// Brutalist backdrop card — a solid inset rectangle sits behind the logo on
// tiles where the background would otherwise swallow it (e.g. a black Vercel
// mark on a dark tile). Flat fill, hard edges, sized so the logo rests on it
// like a product shot on a card.
const BACKDROP_COLORS: Record<'dark' | 'light', string> = {
  dark: '#f5f5f5',
  light: '#0a0a0a',
};

export function IconPreviewGrid({
  icons,
  name,
  variant,
  bg,
  badInDark,
  badInLight,
  gridClassName = 'grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4',
  tilePaddingClassName = 'p-6 sm:p-8',
  iconMaxClassName = 'max-w-[120px] max-h-[120px]',
}: IconPreviewGridProps) {
  const needsBackdrop =
    variant === 'icon' &&
    ((bg === 'dark' && badInDark) || (bg === 'light' && badInLight));
  const backdropColor =
    needsBackdrop && (bg === 'dark' || bg === 'light')
      ? BACKDROP_COLORS[bg]
      : null;

  return (
    <div className={gridClassName}>
      {icons.map((iconFile, index) => (
        <div key={iconFile} className="flex flex-col">
          <div
            className={clsx(
              'aspect-square flex items-center justify-center rounded-xl border border-border relative overflow-hidden',
              tilePaddingClassName,
              bgStyles[bg],
              bg === 'grid' &&
                'bg-[repeating-conic-gradient(#262626_0%_25%,#1a1a1a_0%_50%)]',
            )}>
            {backdropColor && (
              <span
                aria-hidden="true"
                className="absolute inset-[10%] rounded-lg pointer-events-none"
                style={{ background: backdropColor }}
              />
            )}
            {variant === 'font' ? (
              <div
                role="img"
                aria-label={`${name} logo (${iconFile})`}
                className={clsx(
                  'relative z-10 w-full h-full bg-accent',
                  iconMaxClassName,
                )}
                style={{
                  maskImage: `url(/devicons/font/${iconFile}.svg)`,
                  WebkitMaskImage: `url(/devicons/font/${iconFile}.svg)`,
                  maskSize: 'contain',
                  WebkitMaskSize: 'contain',
                  maskRepeat: 'no-repeat',
                  WebkitMaskRepeat: 'no-repeat',
                  maskPosition: 'center',
                  WebkitMaskPosition: 'center',
                }}
              />
            ) : (
              <img
                src={`/devicons/icons/${iconFile}.svg`}
                alt={
                  index === 0
                    ? `${name} logo`
                    : `${name} logo, ${iconFile} variant`
                }
                width={120}
                height={120}
                fetchPriority={index === 0 ? 'high' : 'auto'}
                decoding="async"
                className={clsx(
                  'relative z-10 w-full h-full object-contain',
                  iconMaxClassName,
                )}
              />
            )}
          </div>
          <div className="flex items-center justify-center pt-2">
            <SvgActions iconFile={iconFile} variant={variant} />
          </div>
        </div>
      ))}
    </div>
  );
}

export function useIconPreviewState(
  initialVariant: IconVariant = 'icon',
  initialBg: IconBackground = 'dark',
) {
  const [variant, setVariant] = useState<IconVariant>(initialVariant);
  const [bg, setBg] = useState<IconBackground>(initialBg);
  return { variant, setVariant, bg, setBg };
}
