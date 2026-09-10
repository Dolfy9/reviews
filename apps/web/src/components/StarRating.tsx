import { Star } from "lucide-react";

interface StarRatingProps {
  rating: number;
  size?: number;
  showValue?: boolean;
  reviewCount?: number;
  onChange?: (rating: number) => void;
}

export function StarRating({
  rating,
  size = 16,
  showValue = true,
  reviewCount,
  onChange,
}: StarRatingProps) {
  return (
    <div className="flex items-center gap-1.5">
      <div className="flex items-center gap-0.5">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            disabled={!onChange}
            onClick={() => onChange?.(star)}
            className={`${onChange ? "cursor-pointer hover:scale-110" : "cursor-default"} transition`}
            aria-label={onChange ? `Rate ${star} out of 5` : undefined}
          >
            <Star
              size={size}
              className={
                star <= Math.round(rating)
                  ? "fill-sky-500 text-sky-500"
                  : "fill-slate-200 text-slate-200 dark:fill-slate-700 dark:text-slate-700"
              }
            />
          </button>
        ))}
      </div>
      {showValue && (
        <span className="text-sm font-bold text-slate-700 dark:text-slate-300">
          {rating.toFixed(1)}
        </span>
      )}
      {reviewCount !== undefined && (
        <span className="text-xs text-slate-400 dark:text-slate-500">
          ({reviewCount} reviews)
        </span>
      )}
    </div>
  );
}
