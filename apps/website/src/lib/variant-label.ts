// File naming convention: `<slug>-icon` is the mark alone, `<slug>` the full
// logo (mark + wordmark, or the wordmark). Anything else is a named variant.
// Shared by the variants page and the /api/v1 icon detail.
export function variantLabel(slug: string, file: string, files: string[]): string {
  if (files.length === 1) return 'Logo';
  if (/-icon$/.test(file)) return 'Icon (mark only)';
  if (/wordmark|-text$/.test(file)) return 'Wordmark';
  if (file === slug || `${file}-icon` === files.find(v => v.endsWith('-icon'))) {
    return 'Logo with wordmark';
  }
  const suffix = file.startsWith(`${slug}-`) ? file.slice(slug.length + 1) : file;
  const words = suffix.replace(/-icon$/, '').split('-').filter(Boolean);
  const label = words.map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
  return label ? `${label} variant` : 'Variant';
}
