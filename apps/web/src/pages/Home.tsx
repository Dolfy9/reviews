import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { productsApi } from "../api/products";
import { ProductCard } from "../components/ProductCard";
import { SearchBar } from "../components/SearchBar";
import { ProductListQuery } from "@product-reviews/shared";

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
      <h1 className="text-2xl font-bold">Products</h1>
      <SearchBar initialQuery={searchQuery} onSearch={handleSearch} />

      {productsQuery.isLoading ? (
        <p>Loading...</p>
      ) : productsQuery.data?.data.length ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {productsQuery.data.data.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      ) : (
        <p className="text-gray-500">No products found.</p>
      )}
    </div>
  );
}
