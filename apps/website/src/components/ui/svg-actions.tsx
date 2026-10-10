import { useState, useCallback } from 'react';
import { clsx } from 'clsx';

interface SvgActionsProps {
  iconFile: string;
  variant?: 'icon' | 'font';
  className?: string;
}

export function SvgActions({
  iconFile,
  variant = 'icon',
  className,
}: SvgActionsProps) {
  const [copied, setCopied] = useState(false);
  const svgPath = `/devicons/${variant === 'icon' ? 'icons' : 'font'}/${iconFile}.svg`;

  const fetchSvg = useCallback(async () => {
    const res = await fetch(svgPath);
    return res.text();
  }, [svgPath]);

  const handleCopy = useCallback(async () => {
    const svg = await fetchSvg();
    await navigator.clipboard.writeText(svg);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [fetchSvg]);

  const handleDownload = useCallback(async () => {
    const svg = await fetchSvg();
    const blob = new Blob([svg], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${iconFile}.svg`;
    a.click();
    URL.revokeObjectURL(url);
  }, [fetchSvg, iconFile]);

  const buttonClass = clsx(
    'py-1 font-mono text-xs font-semibold uppercase tracking-[0.18em] leading-none',
    'text-text-muted hover:text-accent transition-colors duration-150',
    'cursor-pointer select-none whitespace-nowrap',
  );

  return (
    <div className={clsx('flex items-center gap-3', className)}>
      <button
        onClick={handleCopy}
        className={clsx(buttonClass, copied && 'text-accent')}>
        {copied ? 'Copied' : 'Copy SVG'}
      </button>
      <span className="text-text-muted/30 text-xs select-none">|</span>
      <button onClick={handleDownload} className={buttonClass}>
        Download
      </button>
    </div>
  );
}
