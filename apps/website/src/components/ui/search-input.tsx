import { forwardRef } from "react";
import { clsx } from "clsx";

interface SearchInputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "value"> {
  value?: string;
  onValueChange?: (value: string) => void;
  /** Keyboard hint rendered inside the field while it is empty. */
  shortcut?: string;
}

export const SearchInput = forwardRef<HTMLInputElement, SearchInputProps>(
  ({ className, onValueChange, value, shortcut, ...props }, ref) => {
    const hasValue = !!value;

    return (
      <div className="relative w-full">
        <svg
          aria-hidden="true"
          className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none"
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <circle cx="11" cy="11" r="8" />
          <path d="m21 21-4.3-4.3" />
        </svg>
        <input
          ref={ref}
          type="search"
          autoComplete="off"
          spellCheck={false}
          value={value}
          onChange={(e) => onValueChange?.(e.target.value)}
          className={clsx(
            "type-mono w-full pl-12 pr-12 py-3 bg-surface border border-border",
            "text-text placeholder:text-text-muted",
            "focus:outline-none focus:border-text-muted",
            "transition-colors duration-150",
            "[&::-webkit-search-cancel-button]:appearance-none",
            className
          )}
          {...props}
        />
        {hasValue ? (
          <button
            type="button"
            onClick={() => onValueChange?.("")}
            aria-label="Clear search"
            className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 flex items-center justify-center text-text-muted hover:text-text transition-colors cursor-pointer focus:outline-none focus-visible:outline-2 focus-visible:outline-accent"
          >
            <svg
              aria-hidden="true"
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
            >
              <path d="M18 6 6 18M6 6l12 12" />
            </svg>
          </button>
        ) : (
          shortcut && (
            <kbd
              aria-hidden="true"
              className="absolute right-3 top-1/2 -translate-y-1/2 hidden sm:inline-flex items-center justify-center min-w-6 h-6 px-1.5 border border-border bg-bg font-mono text-xs text-text-muted pointer-events-none"
            >
              {shortcut}
            </kbd>
          )
        )}
      </div>
    );
  }
);
SearchInput.displayName = "SearchInput";
