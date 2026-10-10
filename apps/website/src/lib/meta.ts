// Search engines truncate titles at roughly 60 characters and descriptions at
// roughly 160. Templated pages pass candidates longest-first; the first one
// that fits wins, and the last one is used as-is when none fit.
export const TITLE_MAX = 60;
export const DESCRIPTION_MAX = 160;

export const fitTitle = (...candidates: string[]) =>
  candidates.find(c => c.length <= TITLE_MAX) ?? candidates[candidates.length - 1];

const truncate = (text: string, max: number) => {
  if (text.length <= max) return text;
  const cut = text.slice(0, max - 1);
  return `${cut.slice(0, cut.lastIndexOf(' ')).replace(/[,;:.\s]+$/, '')}…`;
};

// Keeps `lead` (cut at a word boundary if it alone overflows) and appends the
// first call-to-action that still fits. CTAs are ordered longest-first.
export const fitDescription = (lead: string | undefined, ...ctas: string[]) => {
  const base = lead?.trim();
  if (!base) {
    return truncate(ctas[0] ?? '', DESCRIPTION_MAX);
  }
  const head = truncate(base, DESCRIPTION_MAX);
  const cta = ctas.find(c => head.length + 1 + c.length <= DESCRIPTION_MAX);
  return cta ? `${head} ${cta}` : head;
};
