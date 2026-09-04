import { ReviewDto, VoteType } from "@product-reviews/shared";
import { reviewsApi } from "../api/reviews";
import { useQueryClient } from "@tanstack/react-query";
import { useAuthStore } from "../store/authStore";
import { useToast } from "../hooks/useToast";
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
    } catch {
      toast("Failed to vote", "error");
    }
  };

  return (
    <div className="card animate-slide-up p-5">
      <div className="flex items-start justify-between">
        <div>
          <h4 className="font-semibold">{review.title}</h4>
          <div className="mt-1 flex items-center gap-2">
            <StarRating rating={review.rating} showValue={false} size={14} />
            <span className="text-xs text-gray-400">{review.rating}/5</span>
          </div>
        </div>
        <span className="text-sm text-gray-500 dark:text-gray-400">
          {review.authorName ?? "Anonymous"}
        </span>
      </div>
      <p className="mt-3 text-sm text-gray-700 dark:text-gray-300">
        {review.content}
      </p>
      <div className="mt-4 flex items-center gap-3">
        {user && (
          <>
            <button
              type="button"
              onClick={() => vote("HELPFUL")}
              className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium text-gray-600 transition hover:bg-emerald-50 hover:text-emerald-700 dark:text-gray-400 dark:hover:bg-emerald-950 dark:hover:text-emerald-400"
            >
              <ThumbsUp size={14} />
              Helpful ({review.helpfulCount})
            </button>
            <button
              type="button"
              onClick={() => vote("NOT_HELPFUL")}
              className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium text-gray-600 transition hover:bg-red-50 hover:text-red-700 dark:text-gray-400 dark:hover:bg-red-950 dark:hover:text-red-400"
            >
              <ThumbsDown size={14} />
              Not helpful ({review.notHelpfulCount})
            </button>
          </>
        )}
        {!user && (
          <span className="text-xs text-gray-400 dark:text-gray-600">
            {review.helpfulCount} found this helpful
          </span>
        )}
      </div>
    </div>
  );
}
