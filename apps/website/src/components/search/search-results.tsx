import { useCallback, useEffect, useRef, useState, memo } from 'react';
import { useQueryState, parseAsString } from 'nuqs';
import { clsx } from 'clsx';
import { SearchInput } from '../ui/search-input';
import { Badge } from '../ui/badge';
import { Tag } from '../ui/tag';
import { GITHUB_URL } from '@/consts';
import type { IconEntry } from '@/hooks/search';

const ICON_GRID_CLASS =
  'grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8';

// Curated over raw frequency: the most common tags ("open-source",
// "development") are too broad to be useful filters.
const FEATURED_TAGS = [
  'ai',
  'cloud',
  'database',
  'frontend',
  'backend',
  'devops',
  'framework',
  'programming-language',
  'testing',
  'security',
  'monitoring',
  'mobile',
];

type Background = 'dark' | 'light' | 'grid';

const bgStyles: Record<Background, string> = {
  dark: 'bg-surface',
  light: 'bg-white',
  grid: 'bg-[length:20px_20px] bg-surface',
};

const BACKDROP_COLORS: Record<'dark' | 'light', string> = {
  dark: '#f5f5f5',
  light: '#0a0a0a',
};

const formatCount = (n: number) => n.toLocaleString('en-US');
const tagLabel = (tag: string) => tag.replace(/-/g, ' ');

const actionBase =
  'inline-flex items-center px-3 py-2 border font-mono text-xs font-semibold uppercase tracking-[0.18em] leading-none transition-colors cursor-pointer focus:outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent';
const actionClass = clsx(
  actionBase,
  'border-border text-text-secondary hover:text-text hover:border-text-muted',
);
const actionPrimaryClass = clsx(
  actionBase,
  'border-accent/40 text-accent hover:border-accent hover:text-accent-hover',
);

const IconCard = memo(
  ({
    icon,
    bg,
    onIconClick,
  }: {
    icon: IconEntry;
    bg: Background;
    onIconClick: (id: string) => void;
  }) => {
    const variants = icon.icons.length;

    return (
      <button
        type="button"
        onClick={() => onIconClick(icon.id)}
        title={icon.name}
        className="group relative -ml-px -mt-px h-36 flex flex-col items-center justify-center gap-3 px-4 border border-border bg-bg hover:bg-surface transition-colors cursor-pointer w-full hover:border-accent hover:z-10 focus:z-10 focus-visible:z-10 focus:outline-none focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-accent [content-visibility:auto] [contain-intrinsic-size:auto_9rem]">
        {icon.popular && (
          <>
            <span
              aria-hidden="true"
              className="absolute top-2 right-2 w-1 h-1 bg-accent"
            />
            <span className="sr-only">Popular: </span>
          </>
        )}
        <span
          className={clsx(
            'w-12 h-12 shrink-0 flex items-center justify-center rounded p-1.5 relative overflow-hidden',
            bgStyles[bg],
            bg === 'grid' &&
              'bg-[repeating-conic-gradient(#262626_0%_25%,#1a1a1a_0%_50%)]',
          )}>
          {((bg === 'dark' && icon.badInDark) ||
            (bg === 'light' && icon.badInLight)) && (
            <span
              aria-hidden="true"
              className="absolute inset-[10%] rounded pointer-events-none"
              style={{
                background: BACKDROP_COLORS[bg as 'dark' | 'light'],
              }}
            />
          )}
          {icon.icons[0] && (
            <img
              src={`/devicons/icons/${icon.icons[0]}.svg`}
              alt=""
              width={48}
              height={48}
              loading="lazy"
              decoding="async"
              className="relative z-10 w-full h-full object-contain"
            />
          )}
        </span>
        <span className="type-card-title truncate w-full text-center">
          {icon.name}
        </span>
        <span className="h-4 flex items-center">
          {icon.deprecated ? (
            <Badge variant="destructive">Deprecated</Badge>
          ) : (
            variants > 1 && (
              <span className="type-meta">{variants} styles</span>
            )
          )}
        </span>
      </button>
    );
  },
);
IconCard.displayName = 'IconCard';

interface SearchSectionProps {
  results: IconEntry[];
  allIcons: IconEntry[];
  deprecatedCount: number;
  isLoading: boolean;
  isError: boolean;
  query: string | null;
  resultQuery: string | null;
  setQuery: (q: string | null) => void;
  tag: string | null;
  setTag: (tag: string | null) => void;
  showDeprecated: boolean;
  setShowDeprecated: (show: boolean | null) => void;
  maxResults?: number;
  embedded?: boolean;
}

function ResultSummary({
  count,
  query,
  tag,
}: {
  count: number;
  query: string | null;
  tag: string | null;
}) {
  const q = query?.trim();
  if (!q && !tag) {
    return (
      <>
        {formatCount(count)} icons
        <span className="hidden sm:inline-flex items-center gap-2 ml-4 text-text-muted">
          <span aria-hidden="true" className="w-1 h-1 bg-accent" />
          Popular first
        </span>
      </>
    );
  }
  return (
    <>
      {formatCount(count)} {count === 1 ? 'result' : 'results'}
      {q && (
        <>
          {' '}
          for <span className="text-text">“{q}”</span>
        </>
      )}
      {tag && (
        <>
          {' '}
          in <span className="text-text">{tagLabel(tag)}</span>
        </>
      )}
    </>
  );
}

export function SearchSection({
  results,
  allIcons,
  deprecatedCount,
  isLoading,
  isError,
  query,
  resultQuery,
  setQuery,
  tag,
  setTag,
  showDeprecated,
  setShowDeprecated,
  maxResults,
  embedded,
}: SearchSectionProps) {
  const [iconParam, setIcon] = useQueryState('icon', parseAsString);
  const [bg, setBg] = useState<Background>('dark');
  const inputRef = useRef<HTMLInputElement>(null);

  const handleIconClick = useCallback((id: string) => setIcon(id), [setIcon]);
  // The field owns its text locally so fast typing never waits on the URL
  // round-trip; every change is mirrored to ?q=.
  const [draft, setDraft] = useState(query ?? '');
  const applyQuery = useCallback(
    (value: string) => {
      setDraft(value);
      setQuery(value || null);
    },
    [setQuery],
  );

  // "/" and Cmd/Ctrl+K jump to the search field from anywhere on the page.
  useEffect(() => {
    if (iconParam) return;
    const onKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      const typing =
        target.isContentEditable ||
        /^(INPUT|TEXTAREA|SELECT)$/.test(target.tagName);
      const isSlash =
        e.key === '/' && !typing && !e.metaKey && !e.ctrlKey && !e.altKey;
      const isCmdK = e.key === 'k' && (e.metaKey || e.ctrlKey);
      if (!isSlash && !isCmdK) return;
      e.preventDefault();
      inputRef.current?.focus();
      inputRef.current?.select();
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [iconParam]);

  const handleInputKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key !== 'Escape') return;
      if (e.currentTarget.value) {
        e.preventDefault();
        applyQuery('');
      } else {
        e.currentTarget.blur();
      }
    },
    [applyQuery],
  );

  const clearAll = useCallback(() => {
    applyQuery('');
    setTag(null);
    inputRef.current?.focus();
  }, [applyQuery, setTag]);

  const chipTags =
    tag && !FEATURED_TAGS.includes(tag) ? [tag, ...FEATURED_TAGS] : FEATURED_TAGS;
  const suggestions = allIcons
    .filter(icon => icon.popular && !icon.deprecated)
    .slice(0, 6);
  const shown = maxResults ? results.slice(0, maxResults) : results;
  const trimmedQuery = resultQuery?.trim() ?? '';

  return (
    <section id="icons" className="min-h-screen" aria-label="Icon search">
      {/* Sticky search bar */}
      <div className="sticky top-14 z-30 bg-bg border-b border-border">
        <div className="max-w-[1400px] mx-auto px-6 py-4">
          <div className="flex items-center gap-4 sm:gap-6">
            {embedded && (
              <h2 className="type-h2 shrink-0 hidden sm:block">Icons</h2>
            )}
            <div className="flex-1 min-w-0">
              <SearchInput
                ref={inputRef}
                value={draft}
                onValueChange={applyQuery}
                onKeyDown={handleInputKeyDown}
                aria-label="Search icons"
                placeholder="Search icons…"
                shortcut="/"
              />
            </div>

            <div
              role="group"
              aria-label="Preview background"
              className="flex gap-1 shrink-0 tab-group">
              {(['dark', 'light', 'grid'] as const).map(b => (
                <button
                  key={b}
                  type="button"
                  onClick={() => setBg(b)}
                  aria-label={`${b[0].toUpperCase()}${b.slice(1)} background`}
                  title={`${b[0].toUpperCase()}${b.slice(1)} background`}
                  aria-pressed={bg === b}
                  className={clsx('tabs__swatch', `tabs__swatch--${b}`)}
                />
              ))}
            </div>
          </div>

          {!embedded && (
            <div className="relative -mx-6 mt-3 [mask-image:linear-gradient(to_right,transparent,black_1.5rem,black_calc(100%-3rem),transparent)]">
              <div
                role="group"
                aria-label="Filter by category"
                className="flex gap-2 overflow-x-auto px-6 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                <Tag
                  active={!tag}
                  onClick={() => setTag(null)}
                  className="shrink-0 px-3 py-1.5">
                  All
                </Tag>
                {chipTags.map(t => (
                  <Tag
                    key={t}
                    active={tag === t}
                    onClick={() => setTag(tag === t ? null : t)}
                    className="shrink-0 px-3 py-1.5">
                    {tagLabel(t)}
                  </Tag>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Results grid */}
      <div className="max-w-[1400px] mx-auto px-6 pt-6 pb-8">
        {!isError && (
          <div className="flex items-center justify-between gap-4 min-h-8 mb-4">
            <p className="type-mono-sm" aria-live="polite">
              {isLoading ? (
                'Loading icons…'
              ) : (
                <ResultSummary
                  count={results.length}
                  query={resultQuery}
                  tag={tag}
                />
              )}
            </p>
            {(deprecatedCount > 0 || showDeprecated) && (
              <button
                type="button"
                onClick={() => setShowDeprecated(showDeprecated ? null : true)}
                aria-pressed={showDeprecated}
                className="group/toggle inline-flex items-center gap-2 shrink-0 type-mono-sm hover:text-text transition-colors cursor-pointer focus:outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent">
                <span
                  aria-hidden="true"
                  className={clsx(
                    'w-3.5 h-3.5 border flex items-center justify-center transition-colors',
                    showDeprecated
                      ? 'border-accent bg-accent text-accent-fg'
                      : 'border-text-muted group-hover/toggle:border-text',
                  )}>
                  {showDeprecated && (
                    <svg
                      width="10"
                      height="10"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="4">
                      <path d="M5 12l5 5L20 7" />
                    </svg>
                  )}
                </span>
                Show deprecated ({formatCount(deprecatedCount)})
              </button>
            )}
          </div>
        )}

        {isError ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <p className="type-body text-text">Couldn’t load the icon index</p>
            <p className="type-body-sm mt-2">
              Check your connection, then reload the page.
            </p>
            <button
              type="button"
              onClick={() => window.location.reload()}
              className={clsx(actionClass, 'mt-6')}>
              Reload
            </button>
          </div>
        ) : isLoading ? (
          <div className={ICON_GRID_CLASS} aria-hidden="true">
            {Array.from({ length: 24 }).map((_, i) => (
              <div
                key={i}
                className="-ml-px -mt-px h-36 border border-border bg-bg flex flex-col items-center justify-center gap-3">
                <span className="w-12 h-12 rounded bg-surface animate-pulse" />
                <span className="w-20 h-3 bg-surface animate-pulse" />
              </div>
            ))}
          </div>
        ) : results.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <p className="type-body text-text">
              {trimmedQuery ? (
                <>
                  No icons match <span className="font-mono">“{trimmedQuery}”</span>
                </>
              ) : (
                'No icons here yet'
              )}
              {tag && <> in {tagLabel(tag)}</>}
            </p>
            <p className="type-body-sm mt-2 max-w-[48ch]">
              Check the spelling or try the brand’s full name. Or start from a
              popular one:
            </p>
            {suggestions.length > 0 && (
              <div className="flex flex-wrap justify-center gap-2 mt-4">
                {suggestions.map(icon => (
                  <Tag
                    key={icon.id}
                    onClick={() => {
                      setTag(null);
                      applyQuery(icon.name);
                    }}
                    className="px-3 py-1.5">
                    {icon.name}
                  </Tag>
                ))}
              </div>
            )}
            <div className="flex flex-wrap justify-center gap-3 mt-8">
              {(trimmedQuery || tag) && (
                <button type="button" onClick={clearAll} className={actionClass}>
                  Clear {trimmedQuery && tag ? 'filters' : tag ? 'category' : 'search'}
                </button>
              )}
              {deprecatedCount > 0 && !showDeprecated && (
                <button
                  type="button"
                  onClick={() => setShowDeprecated(true)}
                  className={actionClass}>
                  Show {deprecatedCount} deprecated{' '}
                  {deprecatedCount === 1 ? 'match' : 'matches'}
                </button>
              )}
              <a
                href={`${GITHUB_URL}/issues/new?title=${encodeURIComponent(
                  `Icon request: ${trimmedQuery || 'name'}`,
                )}`}
                target="_blank"
                rel="noopener noreferrer"
                className={actionPrimaryClass}>
                Request this icon
                <span className="sr-only"> (opens GitHub in a new tab)</span>
              </a>
            </div>
          </div>
        ) : (
          <>
            <div className={ICON_GRID_CLASS}>
              {shown.map(icon => (
                <IconCard
                  key={icon.id}
                  icon={icon}
                  bg={bg}
                  onIconClick={handleIconClick}
                />
              ))}
            </div>
            {maxResults && results.length > maxResults && (
              <div className="flex items-center justify-center gap-3 py-8 border-t border-border">
                <p className="type-mono">
                  Showing {maxResults} of {formatCount(results.length)} results
                </p>
                <a
                  href={`/search/${query ? `?q=${encodeURIComponent(query)}` : ''}`}
                  className="font-mono text-xs font-semibold uppercase tracking-[0.18em] leading-none text-accent hover:text-accent-hover transition-colors shrink-0">
                  View all
                </a>
              </div>
            )}
          </>
        )}
      </div>
    </section>
  );
}
