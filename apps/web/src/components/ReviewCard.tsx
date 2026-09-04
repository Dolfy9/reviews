import { ReviewDto, VoteType } from "@product-reviews/shared";
import { reviewsApi } from "../api/reviews";
import { useQueryClient } from "@tanstack/react-query";
import { useAuthStore } from "../store/authStore";
import { useToast } from "../hooks/useToast";
import { friendlyErrorMessage } from "../api/client";
import { StarRating } from "./StarRating";
import { ThumbsUp, ThumbsDown } from "lucide-react";

interface ReviewCardProps {
  review: ReviewDto;
  productId: string;
}

export function ReviewCard({ review, productId }: ReviewCardProps) {
  const queryClient = useQueryClient();
  const user = useAuthStore((state) => state.user);
  const { toast } = useToast();

  const vote = async (type: VoteType) => {
    try {
      await reviewsApi.vote(review.id, { type });
      await queryClient.invalidateQueries({ queryKey: ["reviews", productId] });
      toast("Vote registered", "success");
    } catch (err) {
      toast(friendlyErrorMessage(err), "error");
    }
  };

  return (
    <div className="card animate-slide-up p-6">
      <div className="flex items-start justify-between">
        <div>
          <h4 className="font-bold tracking-tight text-slate-800 dark:text-slate-200">{review.title}</h4>
          <div className="mt-1.5 flex items-center gap-2">
            <StarRating rating={review.rating} showValue={false} size={14} />
            <span className="text-xs font-semibold text-sky-600 dark:text-sky-400">
              {review.rating}/5
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-sky-500 to-cyan-600 text-xs font-bold text-white">
            {(review.authorName ?? "A").charAt(0).toUpperCase()}
          </div>
          <span className="text-sm font-medium text-slate-500 dark:text-slate-400">
            {review.authorName ?? "Anonymous"}
          </span>
        </div>
      </div>
      <p className="mt-3 text-sm leading-relaxed text-slate-600 dark:text-slate-300">
        {review.content}
      </p>
      <div className="mt-4 flex items-center gap-2">
        {user ? (
          <>
            <button
              type="button"
              onClick={() => vote("HELPFUL")}
              className="inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-semibold text-slate-500 transition-all duration-300 hover:bg-sky-50 hover:text-sky-700 dark:text-slate-400 dark:hover:bg-sky-950/30 dark:hover:text-sky-300"
            >
              <ThumbsUp size={14} />
              Helpful ({review.helpfulCount})
            </button>
            <button
              type="button"
              onClick={() => vote("NOT_HELPFUL")}
              className="inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-semibold text-slate-500 transition-all duration-300 hover:bg-slate-100 hover:text-slate-700 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-200"
            >
              <ThumbsDown size={14} />
              Not helpful ({review.notHelpfulCount})
            </button>
          </>
        ) : (
          <span className="text-xs text-slate-400 dark:text-slate-600">
            {review.helpfulCount} found this helpful
          </span>
        )}
      </div>
    </div>
  );
}
