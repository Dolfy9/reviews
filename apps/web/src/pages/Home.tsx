import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { productsApi } from "../api/products";
import { ProductCard } from "../components/ProductCard";
import { SearchBar } from "../components/SearchBar";
import { ProductGridSkeleton } from "../components/Skeletons";
import { EmptyState } from "../components/EmptyState";
import { ProductListQuery } from "@product-reviews/shared";
import { AlertCircle, Package } from "lucide-react";

export default function Home() {
  const [searchQuery, setSearchQuery] = useState("");

  const productParams: ProductListQuery = {
    page: 1,
    limit: 20,
    sort: "newest",
    search: searchQuery || undefined,
  };

  const productsQuery = useQuery({
    queryKey: ["products", productParams],
    queryFn: () => productsApi.list(productParams),
  });

  const handleSearch = (query: string) => {
    setSearchQuery(query);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4">
        <div className="flex items-center gap-3">
          <Package className="text-indigo-600 dark:text-indigo-400" size={28} />
          <h1 className="text-2xl font-bold">Products</h1>
        </div>
        <SearchBar initialQuery={searchQuery} onSearch={handleSearch} />
      </div>

      {productsQuery.isError && (
        <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-400">
          <AlertCircle size={18} />
          Failed to load products.
        </div>
      )}
      {productsQuery.isLoading ? (
        <ProductGridSkeleton />
      ) : productsQuery.data?.data.length ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
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
              : "There are no products yet."
          }
        />
      )}
    </div>
  );
}
