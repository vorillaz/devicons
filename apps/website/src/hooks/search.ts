import { useEffect, useState, useRef } from "react";
import MiniSearch from "minisearch";
import { SEARCH_OPTIONS, rankByMatch } from "@dev.icons/agent/search";

export interface IconEntry {
  id: string;
  name: string;
  description: string;
  icons: string[];
  tags: string[];
  deprecated: boolean;
  popular: boolean;
  badInDark?: boolean;
  badInLight?: boolean;
  deprecatedOn?: string;
  version?: string;
  aliases?: string[];
  website?: string;
  license?: string;
  brandGuidelines?: string;
  mainColor?: string;
  otherColors?: string[];
}

// Module-level cache — survives remounts and navigation
let cachedIcons: IconEntry[] | null = null;
let cachedIndex: MiniSearch<IconEntry> | null = null;

// Same fields, boosts, and ranking as /api/v1/search and the MCP server.
function buildIndex(icons: IconEntry[]): MiniSearch<IconEntry> {
  const ms = new MiniSearch<IconEntry>(SEARCH_OPTIONS);
  ms.addAll(icons);
  return ms;
}

export function useSearch(query: string | null) {
  const [allIcons, setAllIcons] = useState<IconEntry[]>(cachedIcons ?? []);
  const [isLoading, setIsLoading] = useState(!cachedIcons);
  const [isError, setIsError] = useState(false);
  const indexRef = useRef<MiniSearch<IconEntry> | null>(cachedIndex);

  useEffect(() => {
    if (cachedIcons) return;

    let mounted = true;
    fetch("/search-index.json")
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then((data: IconEntry[]) => {
        if (!mounted) return;
        cachedIcons = data;
        cachedIndex = buildIndex(data);
        indexRef.current = cachedIndex;
        setAllIcons(data);
        setIsLoading(false);
      })
      .catch(() => {
        if (!mounted) return;
        setIsError(true);
        setIsLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, []);

  const results = (() => {
    if (isLoading || isError || !allIcons.length) return [];
    if (!query?.trim()) {
      return [...allIcons].sort((a, b) => {
        if (a.popular !== b.popular) return a.popular ? -1 : 1;
        return a.name.localeCompare(b.name);
      });
    }

    const searchResults = indexRef.current?.search(query) ?? [];
    const idToIcon = new Map(allIcons.map((icon) => [icon.id, icon]));
    const ranked = searchResults
      .map((r) => idToIcon.get(r.id))
      .filter((icon): icon is IconEntry => !!icon);

    return rankByMatch(ranked, query);
  })();

  return { results, allIcons, isLoading, isError };
}
