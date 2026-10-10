import { NuqsAdapter } from "nuqs/adapters/react";
import { useQueryState, parseAsString, parseAsBoolean } from "nuqs";
import { useDebounce } from "@/hooks/debounce";
import { useSearch } from "@/hooks/search";
import { SearchSection } from "./search-results";
import { SearchDrawer } from "./search-drawer";

interface SearchIslandProps {
  maxResults?: number;
  /** Compact variant for embedding on other pages: section heading, no tag filters. */
  embedded?: boolean;
}

function SearchInner({ maxResults, embedded }: SearchIslandProps) {
  const [query, setQuery] = useQueryState("q", parseAsString);
  const [tag, setTag] = useQueryState("tag", parseAsString);
  const [showDeprecated, setShowDeprecated] = useQueryState(
    "deprecated",
    parseAsBoolean.withDefault(false),
  );
  const debouncedQuery = useDebounce(query, 300);
  const { results, allIcons, isLoading, isError } = useSearch(debouncedQuery);

  const tagged = tag ? results.filter((icon) => icon.tags?.includes(tag)) : results;
  const deprecatedCount = tagged.filter((icon) => icon.deprecated).length;
  const visible = showDeprecated
    ? tagged
    : tagged.filter((icon) => !icon.deprecated);

  return (
    <>
      <SearchSection
        results={visible}
        allIcons={allIcons}
        deprecatedCount={deprecatedCount}
        isLoading={isLoading}
        isError={isError}
        query={query}
        resultQuery={debouncedQuery}
        setQuery={setQuery}
        tag={tag}
        setTag={setTag}
        showDeprecated={showDeprecated}
        setShowDeprecated={setShowDeprecated}
        maxResults={maxResults}
        embedded={embedded}
      />
      <SearchDrawer allIcons={allIcons} />
    </>
  );
}

export function SearchIsland({ maxResults, embedded }: SearchIslandProps = {}) {
  return (
    <NuqsAdapter>
      <SearchInner maxResults={maxResults} embedded={embedded} />
    </NuqsAdapter>
  );
}
