import { Link } from "react-router-dom";
import { Tag, ArrowRight, ImageOff, Layers } from "lucide-react";
import { ProductDto } from "@product-reviews/shared";
import { StarRating } from "./StarRating";
import { useState } from "react";

const METADATA_LABELS: Record<string, string> = {
  brand: "Brand",
  developer: "Developer",
  author: "Author",
  authors: "Author",
  director: "Director",
  genre: "Genre",
  pages: "Pages",
  runtime: "Runtime",
  quantity: "Size",
  nutriScore: "Nutri-Score",
  contentRating: "Rated",
  version: "Version",
  fileSize: "Size",
  firstPublished: "Published",
  editions: "Editions",
  episodeCount: "Episodes",
  languages: "Languages",
  minOS: "Requires",
};

function getTopMetadata(metadata: Record<string, unknown> | null | undefined): Array<{ label: string; value: string }> {
  if (!metadata) return [];
  const result: Array<{ label: string; value: string }> = [];
  for (const [key, value] of Object.entries(metadata)) {
    if (result.length >= 3) break;
    const label = METADATA_LABELS[key] ?? key;
    let val: string;
    if (Array.isArray(value)) {
      val = value.slice(0, 2).join(", ");
    } else if (typeof value === "object" && value !== null) {
      continue;
    } else {
      val = String(value);
    }
    if (val.length > 0 && val.length <= 50) {
      result.push({ label, value: val });
    }
  }
  return result;
}

export function ProductCard({ product }: { product: ProductDto }) {
  const [imgError, setImgError] = useState(false);
  const hasImage = product.images.length > 0 && !imgError;
  const topMeta = getTopMetadata(product.metadata);
  const imageCount = product.images.length;

  return (
    <Link
      to={`/products/${product.id}`}
      className="card animate-slide-up group relative flex flex-col overflow-hidden"
    >
      {/* Product image - e-shop style, larger area */}
      <div className="relative aspect-[4/3] w-full overflow-hidden bg-slate-100 dark:bg-slate-800/50">
        {hasImage ? (
          <img
            src={product.images[0]}
            alt={product.name}
            loading="lazy"
            onError={() => setImgError(true)}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-slate-300 dark:text-slate-600">
            <ImageOff size={40} />
          </div>
        )}
        {/* Category badge */}
        {product.category && (
          <span className="badge-brand absolute left-3 top-3 backdrop-blur-sm">
            <Tag size={10} />
            {product.category}
          </span>
        )}
        {/* Multi-image indicator */}
        {imageCount > 1 && (
          <span className="absolute right-3 top-3 flex items-center gap-1 rounded-lg bg-black/60 px-2 py-1 text-xs font-medium text-white backdrop-blur-sm">
            <Layers size={12} />
            {imageCount}
          </span>
        )}
      </div>

      {/* Content */}
      <div className="flex flex-1 flex-col p-4">
        <h3 className="line-clamp-2 text-sm font-bold tracking-tight transition-colors duration-300 group-hover:text-sky-600 dark:group-hover:text-sky-400 min-h-[2.5rem]">
          {product.name}
        </h3>

        {/* Dynamic metadata badges */}
        {topMeta.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1.5">
            {topMeta.map((m) => (
              <span
                key={m.label}
                className="inline-flex items-center rounded-md bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600 dark:bg-slate-800 dark:text-slate-400"
              >
                <span className="text-slate-400 dark:text-slate-500">{m.label}:</span>
                <span className="ml-1 truncate max-w-[80px]">{m.value}</span>
              </span>
            ))}
          </div>
        )}

        {/* Price + rating row */}
        <div className="mt-auto flex items-center justify-between pt-3">
          <div className="flex flex-col">
            <span className="text-lg font-extrabold gradient-text">
              ${product.price.toFixed(2)}
            </span>
            <StarRating
              rating={product.averageRating}
              reviewCount={product.reviewCount}
              size={12}
            />
          </div>
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-sky-50 text-sky-600 opacity-0 transition-all duration-300 group-hover:opacity-100 group-hover:translate-x-0 translate-x-2 dark:bg-sky-950/30 dark:text-sky-400">
            <ArrowRight size={14} />
          </div>
        </div>
      </div>
    </Link>
  );
}
