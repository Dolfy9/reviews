import { Star } from "lucide-react";

interface StarRatingProps {
  rating: number;
  size?: number;
  showValue?: boolean;
  reviewCount?: number;
}

export function StarRating({
  rating,
  size = 16,
  showValue = true,
  reviewCount,
}: StarRatingProps) {
  return (
    <div className="flex items-center gap-1.5">
      <div className="flex items-center gap-0.5">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            size={size}
            className={
              star <= Math.round(rating)
                ? "fill-amber-400 text-amber-400"
                : "fill-gray-200 text-gray-200 dark:fill-gray-700 dark:text-gray-700"
            }
          />
        ))}
      </div>
      {showValue && (
        <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
          {rating.toFixed(1)}
        </span>
      )}
      {reviewCount !== undefined && (
        <span className="text-xs text-gray-400 dark:text-gray-500">
          ({reviewCount})
        </span>
      )}
    </div>
  );
}
