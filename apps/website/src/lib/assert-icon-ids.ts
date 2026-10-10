/**
 * Build-time guard for curated icon references (packs, comparisons, use
 * cases). Throws if any id is unknown or points at a deprecated icon, so a
 * typo or a deprecation fails the build instead of silently dropping content.
 */
export function assertIconIds(
  context: string,
  ids: string[],
  activeIds: Set<string>,
): void {
  const invalid = ids.filter(id => !activeIds.has(id));
  if (invalid.length > 0) {
    throw new Error(
      `[${context}] unknown or deprecated icon id(s): ${invalid.join(', ')}. ` +
        'Use the slug of an existing, non-deprecated file in src/content/icons/.',
    );
  }
}
