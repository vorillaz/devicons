// Mirrors `iconToComponentName` in packages/utils (split on `-` only) so
// snippets on the site match what @dev.icons/react, /vue and /svelte export.
const RESERVED = new Set(['React', 'Vue', 'Svelte', 'Astro']);

export function toComponentName(iconFile: string): string {
  const pascal = iconFile
    .split('.')[0]
    .split('-')
    .map(part => part.charAt(0).toUpperCase() + part.slice(1))
    .join('');
  return RESERVED.has(pascal) ? `_${pascal}` : pascal;
}
