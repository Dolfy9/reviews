import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { productsApi } from "../api/products";
import { searchApi } from "../api/search";
import { ProductCard } from "../components/ProductCard";
import { AutocompleteSearch } from "../components/AutocompleteSearch";
import { ProductGridSkeleton } from "../components/Skeletons";
import { EmptyState } from "../components/EmptyState";
import { ProductListQuery, ProductDto } from "@product-reviews/shared";
import {
  AlertCircle,
  Waves,
  TrendingUp,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Check,
  SlidersHorizontal,
} from "lucide-react";

const SORT_OPTIONS: { value: ProductListQuery["sort"]; label: string }[] = [
  { value: "newest", label: "Newest" },
  { value: "rating", label: "Top Rated" },
  { value: "reviews", label: "Most Reviewed" },
  { value: "price_asc", label: "Price: Low to High" },
  { value: "price_desc", label: "Price: High to Low" },
];

const PAGE_SIZE = 12;

export default function Home() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [sort, setSort] = useState<ProductListQuery["sort"]>("newest");
  const [page, setPage] = useState(1);
  const [showFilters, setShowFilters] = useState(false);
  const [selectedSubcategory, setSelectedSubcategory] = useState<
    string | undefined
  >(undefined);

  const categoriesQuery = useQuery({
    queryKey: ["categories"],
    queryFn: () => productsApi.categories(),
  });

  // Fetch subcategories when exactly one parent category is selected
  const activeCategory =
    selectedCategories.length === 1 ? selectedCategories[0] : undefined;
  const subcategoriesQuery = useQuery({
    queryKey: ["subcategories", activeCategory],
    queryFn: () => productsApi.subcategories(activeCategory!),
    enabled: Boolean(activeCategory),
  });

  const productParams: ProductListQuery = {
    page,
    limit: PAGE_SIZE,
    sort,
    ...(selectedCategories.length > 0 && { categories: selectedCategories }),
    ...(selectedSubcategory && { subcategory: selectedSubcategory }),
  };

  const isSearching = Boolean(searchQuery);

  const productsQuery = useQuery<{
    data: ProductDto[];
    meta: { total: number; totalPages: number };
  }>({
    queryKey: ["products", productParams, searchQuery],
    queryFn: () => {
      if (isSearching) {
        return searchApi.searchProducts({
          q: searchQuery,
          mode: "hybrid",
          page,
          limit: PAGE_SIZE,
        });
      }
      return productsApi.list(productParams);
    },
  });

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    setPage(1);
  };

  const toggleCategory = (cat: string) => {
    setSelectedCategories((prev) =>
      prev.includes(cat) ? prev.filter((c) => c !== cat) : [...prev, cat],
    );
    setSelectedSubcategory(undefined);
    setPage(1);
  };

  const clearCategories = () => {
    setSelectedCategories([]);
    setSelectedSubcategory(undefined);
    setPage(1);
  };

  const selectSubcategory = (sub: string | undefined) => {
    setSelectedSubcategory(sub);
    setPage(1);
  };

  const handleSort = (s: ProductListQuery["sort"]) => {
    setSort(s);
    setPage(1);
  };

  const productCount = productsQuery.data?.meta.total ?? 0;
  const totalPages = productsQuery.data?.meta.totalPages ?? 1;
  const hasActiveFilters =
    selectedCategories.length > 0 || searchQuery || selectedSubcategory;

  return (
    <div className="space-y-5">
      {/* Compact hero — only on first load with no filters */}
      {!searchQuery &&
        selectedCategories.length === 0 &&
        !selectedSubcategory && (
          <section className="animate-fade-in relative rounded-2xl border border-sky-100/50 bg-gradient-to-br from-sky-50 via-slate-50 to-cyan-50 px-6 py-8 dark:border-sky-900/20 dark:from-sky-950/20 dark:via-[#0c1929] dark:to-cyan-950/20">
            <div className="pointer-events-none absolute inset-0 overflow-hidden">
              <div className="absolute -top-16 left-1/2 h-32 w-80 -translate-x-1/2 rounded-full bg-sky-500/10 blur-3xl" />
            </div>
            <div className="relative flex flex-col items-center gap-3 text-center">
              <div className="inline-flex items-center gap-2 rounded-full border border-sky-200/50 bg-white/60 px-3 py-1 text-xs font-semibold text-sky-700 dark:border-sky-800/50 dark:bg-sky-950/30 dark:text-sky-300">
                <Waves size={12} />
                Trusted Reviews Platform
              </div>
              <h1 className="text-balance text-2xl font-extrabold tracking-tight sm:text-3xl">
                Discover products you'll love.{" "}
                <span className="gradient-text">
                  Share reviews that matter.
                </span>
              </h1>
              <p className="max-w-lg text-sm text-slate-500 dark:text-slate-400">
                Find the best products through authentic reviews from real data
                sources.
              </p>
              <div className="mt-1 w-full max-w-md">
                <AutocompleteSearch onSearch={handleSearch} />
              </div>
            </div>
          </section>
        )}

      {/* Search bar when filtering */}
      {hasActiveFilters && (
        <div className="flex items-center gap-3">
          <div className="flex-1">
            <AutocompleteSearch
              initialQuery={searchQuery}
              onSearch={handleSearch}
            />
          </div>
        </div>
      )}

      {/* Compact filter bar — sticky, single row */}
      <div className="sticky top-16 z-30 -mx-2 rounded-xl bg-white/80 px-3 py-2.5 backdrop-blur-md dark:bg-[#0c1929]/80">
        <div className="flex flex-wrap items-center gap-2">
          {/* Title + count */}
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-sky-500 to-cyan-500 shadow-[0_2px_8px_rgba(14,165,233,0.2)]">
              <TrendingUp className="text-white" size={16} />
            </div>
            <span className="text-sm font-bold tracking-tight">
              {searchQuery
                ? "Search results"
                : selectedCategories.length === 1
                  ? selectedCategories[0]
                  : selectedCategories.length > 1
                    ? `${selectedCategories.length} categories`
                    : "All products"}
            </span>
            <span className="text-xs text-slate-400 dark:text-slate-500">
              {productCount > 0 ? `${productCount}` : "—"}
            </span>
          </div>

          <div className="flex-1" />

          {/* Category chips — inline, compact */}
          {categoriesQuery.data && categoriesQuery.data.length > 0 && (
            <div className="flex items-center gap-1.5">
              <button
                onClick={clearCategories}
                className={`rounded-lg px-2.5 py-1 text-xs font-semibold transition ${
                  selectedCategories.length === 0
                    ? "bg-gradient-to-r from-sky-500 to-cyan-500 text-white"
                    : "border border-slate-200 bg-white text-slate-600 hover:border-sky-300 dark:border-slate-700 dark:bg-slate-800/50 dark:text-slate-400"
                }`}
              >
                All
              </button>
              {categoriesQuery.data.slice(0, 6).map((cat) => {
                const isSelected = selectedCategories.includes(cat);
                return (
                  <button
                    key={cat}
                    onClick={() => toggleCategory(cat)}
                    className={`flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-semibold transition ${
                      isSelected
                        ? "bg-gradient-to-r from-sky-500 to-cyan-500 text-white"
                        : "border border-slate-200 bg-white text-slate-600 hover:border-sky-300 dark:border-slate-700 dark:bg-slate-800/50 dark:text-slate-400"
                    }`}
                  >
                    {isSelected && <Check size={10} />}
                    {cat}
                  </button>
                );
              })}
              {categoriesQuery.data.length > 6 && (
                <button
                  onClick={() => setShowFilters(!showFilters)}
                  className="flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs font-semibold text-slate-600 transition hover:border-sky-300 dark:border-slate-700 dark:bg-slate-800/50 dark:text-slate-400"
                >
                  <SlidersHorizontal size={10} />
                  More
                </button>
              )}
              {selectedCategories.length > 0 && (
                <button
                  onClick={clearCategories}
                  className="text-xs font-medium text-slate-400 hover:text-red-500 transition"
                >
                  Clear
                </button>
              )}
            </div>
          )}

          {/* Sort dropdown */}
          <select
            value={sort}
            onChange={(e) =>
              handleSort(e.target.value as ProductListQuery["sort"])
            }
            className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-600 transition hover:border-sky-300 dark:border-slate-700 dark:bg-slate-800/50 dark:text-slate-400"
          >
            {SORT_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        {/* Expanded filters for many categories */}
        {showFilters &&
          categoriesQuery.data &&
          categoriesQuery.data.length > 6 && (
            <div className="mt-2 flex flex-wrap items-center gap-1.5 border-t border-slate-100 pt-2 dark:border-slate-800">
              {categoriesQuery.data.slice(6).map((cat) => {
                const isSelected = selectedCategories.includes(cat);
                return (
                  <button
                    key={cat}
                    onClick={() => toggleCategory(cat)}
                    className={`flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-semibold transition ${
                      isSelected
                        ? "bg-gradient-to-r from-sky-500 to-cyan-500 text-white"
                        : "border border-slate-200 bg-white text-slate-600 hover:border-sky-300 dark:border-slate-700 dark:bg-slate-800/50 dark:text-slate-400"
                    }`}
                  >
                    {isSelected && <Check size={10} />}
                    {cat}
                  </button>
                );
              })}
            </div>
          )}

        {/* Subcategory chips — shown when exactly one parent category is selected */}
        {activeCategory &&
          subcategoriesQuery.data &&
          subcategoriesQuery.data.length > 0 && (
            <div className="mt-2 flex flex-wrap items-center gap-1.5 border-t border-slate-100 pt-2 dark:border-slate-800">
              <span className="text-xs font-semibold text-slate-400">
                Subcategories:
              </span>
              <button
                onClick={() => selectSubcategory(undefined)}
                className={`rounded-lg px-2.5 py-1 text-xs font-semibold transition ${
                  !selectedSubcategory
                    ? "bg-sky-100 text-sky-700 dark:bg-sky-900/40 dark:text-sky-300"
                    : "border border-slate-200 bg-white text-slate-500 hover:border-sky-300 dark:border-slate-700 dark:bg-slate-800/50 dark:text-slate-400"
                }`}
              >
                All
              </button>
              {subcategoriesQuery.data.map((sub) => {
                const isSelected = selectedSubcategory === sub;
                return (
                  <button
                    key={sub}
                    onClick={() =>
                      selectSubcategory(isSelected ? undefined : sub)
                    }
                    className={`flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-semibold transition ${
                      isSelected
                        ? "bg-sky-100 text-sky-700 dark:bg-sky-900/40 dark:text-sky-300"
                        : "border border-slate-200 bg-white text-slate-500 hover:border-sky-300 dark:border-slate-700 dark:bg-slate-800/50 dark:text-slate-400"
                    }`}
                  >
                    {isSelected && <Check size={10} />}
                    {sub}
                  </button>
                );
              })}
            </div>
          )}
      </div>

      {/* Error */}
      {productsQuery.isError && (
        <div className="flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/30 dark:text-red-400">
          <AlertCircle size={18} />
          Failed to load products.
        </div>
      )}

      {/* Grid */}
      {productsQuery.isLoading ? (
        <ProductGridSkeleton />
      ) : productsQuery.data?.data.length ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {productsQuery.data.data.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      ) : (
        <EmptyState
          icon="search"
          title="No products found"
          description={
            searchQuery
              ? `No results for "${searchQuery}". Try a different search term.`
              : selectedCategories.length > 0 || selectedSubcategory
                ? `No products match the selected filters.`
                : "There are no products yet."
          }
        />
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex flex-wrap items-center justify-center gap-1.5 pt-2">
          <button
            onClick={() => setPage(1)}
            disabled={page === 1}
            aria-label="First page"
            className="h-9 rounded-xl border border-slate-200 bg-white px-2.5 text-xs font-semibold text-slate-600 transition hover:border-sky-300 hover:text-sky-600 disabled:cursor-not-allowed disabled:opacity-40 dark:border-slate-700 dark:bg-slate-800/50 dark:text-slate-400"
          >
            First
          </button>
          <button
            onClick={() => setPage(Math.max(1, page - 5))}
            disabled={page === 1}
            aria-label="Previous 5 pages"
            className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 transition hover:border-sky-300 hover:text-sky-600 disabled:cursor-not-allowed disabled:opacity-40 dark:border-slate-700 dark:bg-slate-800/50 dark:text-slate-400"
          >
            <ChevronsLeft size={16} />
          </button>
          <button
            onClick={() => setPage(Math.max(1, page - 1))}
            disabled={page === 1}
            aria-label="Previous page"
            className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 transition hover:border-sky-300 hover:text-sky-600 disabled:cursor-not-allowed disabled:opacity-40 dark:border-slate-700 dark:bg-slate-800/50 dark:text-slate-400"
          >
            <ChevronLeft size={16} />
          </button>
          {Array.from({ length: totalPages }, (_, i) => i + 1)
            .filter(
              (p) => p === 1 || p === totalPages || Math.abs(p - page) <= 2,
            )
            .map((p, idx, arr) => (
              <span key={p} className="flex items-center gap-1">
                {idx > 0 && arr[idx - 1] !== p - 1 && (
                  <span className="px-1 text-slate-400">…</span>
                )}
                <button
                  onClick={() => setPage(p)}
                  className={`flex h-9 min-w-9 items-center justify-center rounded-xl px-3 text-sm font-semibold transition ${
                    p === page
                      ? "bg-gradient-to-r from-sky-500 to-cyan-500 text-white shadow-[0_4px_14px_rgba(14,165,233,0.25)]"
                      : "border border-slate-200 bg-white text-slate-600 hover:border-sky-300 hover:text-sky-600 dark:border-slate-700 dark:bg-slate-800/50 dark:text-slate-400"
                  }`}
                >
                  {p}
                </button>
              </span>
            ))}
          <button
            onClick={() => setPage(Math.min(totalPages, page + 1))}
            disabled={page === totalPages}
            aria-label="Next page"
            className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 transition hover:border-sky-300 hover:text-sky-600 disabled:cursor-not-allowed disabled:opacity-40 dark:border-slate-700 dark:bg-slate-800/50 dark:text-slate-400"
          >
            <ChevronRight size={16} />
          </button>
          <button
            onClick={() => setPage(Math.min(totalPages, page + 5))}
            disabled={page === totalPages}
            aria-label="Next 5 pages"
            className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 transition hover:border-sky-300 hover:text-sky-600 disabled:cursor-not-allowed disabled:opacity-40 dark:border-slate-700 dark:bg-slate-800/50 dark:text-slate-400"
          >
            <ChevronsRight size={16} />
          </button>
          <button
            onClick={() => setPage(totalPages)}
            disabled={page === totalPages}
            aria-label="Last page"
            className="h-9 rounded-xl border border-slate-200 bg-white px-2.5 text-xs font-semibold text-slate-600 transition hover:border-sky-300 hover:text-sky-600 disabled:cursor-not-allowed disabled:opacity-40 dark:border-slate-700 dark:bg-slate-800/50 dark:text-slate-400"
          >
            Last
          </button>
        </div>
      )}
    </div>
  );
}
