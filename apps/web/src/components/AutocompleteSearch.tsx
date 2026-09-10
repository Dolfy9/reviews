import { useState, useEffect, useRef, FormEvent, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { searchApi } from "../api/search";
import { Search, TrendingUp, X, CornerDownLeft } from "lucide-react";
import { ProductDto } from "@product-reviews/shared";

interface AutocompleteSearchProps {
  initialQuery?: string;
  onSearch?: (query: string) => void;
  placeholder?: string;
  variant?: "hero" | "inline";
}

export function AutocompleteSearch({
  initialQuery = "",
  onSearch,
  placeholder = "Search products and reviews...",
  variant = "hero",
}: AutocompleteSearchProps) {
  const [query, setQuery] = useState(initialQuery);
  const [debounced, setDebounced] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(query), 200);
    return () => clearTimeout(timer);
  }, [query]);

  const suggestionsQuery = useQuery({
    queryKey: ["suggestions", debounced],
    queryFn: () =>
      searchApi.searchProducts({
        q: debounced,
        mode: "fulltext",
        page: 1,
        limit: 6,
      }),
    enabled: debounced.length > 0 && isOpen,
  });

  const suggestions = suggestionsQuery.data?.data ?? [];
  const isLoading = suggestionsQuery.isLoading && debounced.length > 0;

  const closeDropdown = useCallback(() => {
    setIsOpen(false);
    setHighlightedIndex(-1);
  }, []);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        closeDropdown();
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [closeDropdown]);

  const submitSearch = (q: string) => {
    if (onSearch) {
      onSearch(q);
    } else {
      navigate(`/?q=${encodeURIComponent(q)}`);
    }
    closeDropdown();
    inputRef.current?.blur();
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (highlightedIndex >= 0 && suggestions[highlightedIndex]) {
      navigate(`/products/${suggestions[highlightedIndex].id}`);
      closeDropdown();
    } else if (query.trim()) {
      submitSearch(query.trim());
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen || suggestions.length === 0) return;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlightedIndex((prev) => (prev + 1) % suggestions.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlightedIndex(
        (prev) => (prev - 1 + suggestions.length) % suggestions.length,
      );
    } else if (e.key === "Escape") {
      closeDropdown();
    }
  };

  const wrapperClass =
    variant === "hero"
      ? "relative w-full max-w-2xl"
      : "relative w-full max-w-2xl";

  return (
    <div ref={containerRef} className={wrapperClass}>
      <form onSubmit={handleSubmit} className="relative flex w-full">
        <Search
          className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
          size={18}
        />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setIsOpen(true);
            setHighlightedIndex(-1);
          }}
          onFocus={() => setIsOpen(true)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className="input !rounded-r-none !pl-11 !text-base"
          autoComplete="off"
        />
        {query && (
          <button
            type="button"
            onClick={() => {
              setQuery("");
              setDebounced("");
              inputRef.current?.focus();
            }}
            className="absolute right-[88px] top-1/2 -translate-y-1/2 text-slate-400 transition hover:text-slate-600 dark:hover:text-slate-200"
          >
            <X size={16} />
          </button>
        )}
        <button
          type="submit"
          className="btn-primary !rounded-l-none !px-6 !text-base"
        >
          Search
        </button>
      </form>

      {/* Dropdown */}
      {isOpen && query.length > 0 && (
        <div className="animate-scale-in absolute left-0 right-0 top-full z-50 mt-2 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_12px_40px_rgba(14,165,233,0.12)] dark:border-slate-700/50 dark:bg-slate-800/95 dark:shadow-[0_12px_40px_rgba(14,165,233,0.08)]">
          {isLoading && (
            <div className="flex items-center gap-3 px-4 py-3 text-sm text-slate-400">
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-sky-500 border-t-transparent" />
              Searching...
            </div>
          )}

          {!isLoading && suggestions.length > 0 && (
            <>
              <div className="px-4 pt-3 pb-1 text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                Products
              </div>
              {suggestions.map((product, index) => (
                <SuggestionItem
                  key={product.id}
                  product={product}
                  highlighted={index === highlightedIndex}
                  onSelect={() => {
                    navigate(`/products/${product.id}`);
                    closeDropdown();
                  }}
                  onHover={() => setHighlightedIndex(index)}
                />
              ))}
              <div className="border-t border-slate-100 px-4 py-2.5 dark:border-slate-700/50">
                <button
                  type="button"
                  onClick={() => submitSearch(query.trim())}
                  className="flex w-full items-center justify-between text-sm font-medium text-sky-600 transition hover:text-sky-700 dark:text-sky-400 dark:hover:text-sky-300"
                >
                  <span>See all results for "{query}"</span>
                  <CornerDownLeft size={14} />
                </button>
              </div>
            </>
          )}

          {!isLoading && suggestions.length === 0 && query.trim() && (
            <div className="px-4 py-6 text-center">
              <p className="text-sm text-slate-500 dark:text-slate-400">
                No products found for "{query}"
              </p>
              <button
                type="button"
                onClick={() => submitSearch(query.trim())}
                className="mt-2 text-sm font-medium text-sky-600 hover:underline dark:text-sky-400"
              >
                Search anyway
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function SuggestionItem({
  product,
  highlighted,
  onSelect,
  onHover,
}: {
  product: ProductDto;
  highlighted: boolean;
  onSelect: () => void;
  onHover: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      onMouseEnter={onHover}
      className={`flex w-full items-center gap-3 px-4 py-2.5 text-left transition-colors ${
        highlighted
          ? "bg-sky-50 dark:bg-sky-950/30"
          : "hover:bg-slate-50 dark:hover:bg-slate-700/30"
      }`}
    >
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-sky-400 to-cyan-500 text-xs font-bold text-white">
        {product.name.charAt(0).toUpperCase()}
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold text-slate-800 dark:text-slate-200">
          {product.name}
        </p>
        <p className="truncate text-xs text-slate-400 dark:text-slate-500">
          {product.category} · ${product.price.toFixed(2)}
        </p>
      </div>
      {product.reviewCount > 0 && (
        <div className="flex shrink-0 items-center gap-1 text-xs text-slate-400">
          <TrendingUp size={12} />
          {product.averageRating.toFixed(1)}
        </div>
      )}
    </button>
  );
}
