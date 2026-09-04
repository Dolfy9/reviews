import { Link } from "react-router-dom";
import { Tag } from "lucide-react";
import { ProductDto } from "@product-reviews/shared";
import { StarRating } from "./StarRating";

export function ProductCard({ product }: { product: ProductDto }) {
  return (
    <Link
      to={`/products/${product.id}`}
      className="card animate-slide-up group flex flex-col p-5"
    >
      <div className="flex items-start justify-between">
        <h3 className="text-lg font-semibold transition group-hover:text-indigo-600 dark:group-hover:text-indigo-400">
          {product.name}
        </h3>
        {product.category && (
          <span className="badge bg-indigo-50 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300">
            <Tag size={10} />
            {product.category}
          </span>
        )}
      </div>
      <p className="mt-2 line-clamp-2 text-sm text-gray-600 dark:text-gray-400">
        {product.description}
      </p>
      <div className="mt-auto flex items-center justify-between pt-4">
        <span className="text-lg font-bold text-indigo-600 dark:text-indigo-400">
          ${product.price.toFixed(2)}
        </span>
        <StarRating
          rating={product.averageRating}
          reviewCount={product.reviewCount}
        />
      </div>
    </Link>
  );
}
