import { ReviewDto, VoteType } from "@product-reviews/shared";
import { reviewsApi } from "../api/reviews";
import { useQueryClient } from "@tanstack/react-query";
import { useAuthStore } from "../store/authStore";

interface ReviewCardProps {
  review: ReviewDto;
  productId: string;
}

export function ReviewCard({ review, productId }: ReviewCardProps) {
  const queryClient = useQueryClient();
  const user = useAuthStore((state) => state.user);

  const vote = async (type: VoteType) => {
    await reviewsApi.vote(review.id, { type });
    await queryClient.invalidateQueries({ queryKey: ["reviews", productId] });
  };

  return (
    <div className="rounded-lg border bg-white p-4">
      <div className="flex items-center justify-between">
        <h4 className="font-semibold">{review.title}</h4>
        <span className="text-sm text-gray-500">
          {review.authorName ?? "Anonymous"}
        </span>
      </div>
      <p className="mt-2 text-sm text-gray-700">{review.content}</p>
      <div className="mt-3 flex items-center gap-4 text-sm text-gray-600">
        <span>Rating: {review.rating}/5</span>
        {user && (
          <>
            <button
              type="button"
              onClick={() => vote("HELPFUL")}
              className="hover:text-indigo-600"
            >
              Helpful ({review.helpfulCount})
            </button>
            <button
              type="button"
              onClick={() => vote("NOT_HELPFUL")}
              className="hover:text-indigo-600"
            >
              Not helpful ({review.notHelpfulCount})
            </button>
          </>
        )}
      </div>
    </div>
  );
}
