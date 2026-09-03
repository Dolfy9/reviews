import { Link } from "react-router-dom";
import { ProductDto } from "@product-reviews/shared";

export function ProductCard({ product }: { product: ProductDto }) {
  return (
    <Link
      to={`/products/${product.id}`}
      className="flex flex-col rounded-lg border bg-white p-4 shadow-sm transition hover:shadow-md"
    >
      <h3 className="text-lg font-semibold">{product.name}</h3>
      <p className="mt-1 line-clamp-2 text-sm text-gray-600">
        {product.description}
      </p>
      <div className="mt-4 flex items-center justify-between">
        <span className="font-bold text-indigo-600">
          ${product.price.toFixed(2)}
        </span>
        <span className="text-sm text-gray-500">
          {product.averageRating.toFixed(1)} ({product.reviewCount} reviews)
        </span>
      </div>
    </Link>
  );
}
