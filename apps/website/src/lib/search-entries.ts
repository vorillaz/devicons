// Records for the site's client-side search index and the prebuilt index the
// /api/v1/search Function loads. Both come from here so they never drift.
import { getIcons } from './icons-query';
import type { SearchIndexEntry } from '@dev.icons/agent/schema';

export async function getSearchIndexEntries(): Promise<SearchIndexEntry[]> {
  const icons = await getIcons();
  const entries = icons.map(entry => ({
    id: entry.id,
    name: entry.data.name,
    description: entry.data.description ?? '',
    icons: entry.data.icons,
    tags: entry.data.tags,
    deprecated: entry.data.deprecated ?? false,
    popular: entry.data.popular ?? false,
    badInDark: entry.data.badInDark ?? false,
    badInLight: entry.data.badInLight ?? false,
    ...(entry.data.version && { version: entry.data.version }),
    ...(entry.data.aliases && { aliases: entry.data.aliases }),
  }));
  return entries.sort((a, b) => a.name.localeCompare(b.name));
}
