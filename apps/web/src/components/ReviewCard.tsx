import { ReviewDto, VoteType } from "@product-reviews/shared";
import { reviewsApi } from "../api/reviews";
import { useQueryClient, useMutation } from "@tanstack/react-query";
import { useAuthStore } from "../store/authStore";
import { useToast } from "../hooks/useToast";
import { friendlyErrorMessage } from "../api/client";
import { StarRating } from "./StarRating";
import { ReviewImageGallery } from "./ReviewImageGallery";
import {
  ThumbsUp,
  ThumbsDown,
  Loader2,
  AlertCircle,
  Plus,
  Minus,
  Pencil,
  Trash2,
} from "lucide-react";

interface ReviewCardProps {
  review: ReviewDto;
  productId: string;
  onEdit?: (review: ReviewDto) => void;
  onDelete?: (reviewId: string) => void;
}

export function ReviewCard({
  review,
  productId,
  onEdit,
  onDelete,
}: ReviewCardProps) {
  const queryClient = useQueryClient();
  const user = useAuthStore((state) => state.user);
  const { toast } = useToast();

  const isOwn = review.userId === user?.id;
  const isAdmin = user?.role === "ADMIN";

  const voteMutation = useMutation({
    mutationFn: (type: VoteType) => reviewsApi.vote(review.id, { type }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["reviews", productId] });
    },
    onError: (err) => toast(friendlyErrorMessage(err), "error"),
  });

  const handleVote = (type: VoteType) => {
    if (voteMutation.isPending) return;
    voteMutation.mutate(type);
  };

  const userVote = review.userVote ?? null;

  const hasPros = review.pros.length > 0;
  const hasCons = review.cons.length > 0;

  return (
    <div className="card animate-slide-up p-6">
      <div className="flex items-start justify-between">
        <div>
          <h4 className="font-bold tracking-tight text-slate-800 dark:text-slate-200">
            {review.title}
          </h4>
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
          {isOwn && onEdit && (
            <button
              type="button"
              onClick={() => onEdit(review)}
              className="ml-1 rounded-lg p-1.5 text-slate-400 transition hover:bg-sky-50 hover:text-sky-600 dark:hover:bg-sky-950/30 dark:hover:text-sky-300"
              aria-label="Edit review"
            >
              <Pencil size={16} />
            </button>
          )}
          {(isOwn || isAdmin) && onDelete && (
            <button
              type="button"
              onClick={() => onDelete(review.id)}
              className="rounded-lg p-1.5 text-slate-400 transition hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-950/30 dark:hover:text-rose-300"
              aria-label="Delete review"
            >
              <Trash2 size={16} />
            </button>
          )}
        </div>
      </div>
      <p className="mt-3 text-sm leading-relaxed text-slate-600 dark:text-slate-300">
        {review.content}
      </p>

      <ReviewImageGallery images={review.images} altPrefix="Review image" />

      {(hasPros || hasCons) && (
        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
          {hasPros && (
            <div className="rounded-2xl border border-emerald-100 bg-emerald-50/40 p-4 dark:border-emerald-900/30 dark:bg-emerald-950/10">
              <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-emerald-700 dark:text-emerald-400">
                <Plus size={16} />
                Pros
              </div>
              <ul className="space-y-1.5">
                {review.pros.map((pro, i) => (
                  <li
                    key={`pro-${i}`}
                    className="flex items-start gap-2 text-sm text-emerald-800 dark:text-emerald-200"
                  >
                    <Plus
                      size={14}
                      className="mt-0.5 shrink-0 text-emerald-500"
                    />
                    {pro}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {hasCons && (
            <div className="rounded-2xl border border-rose-100 bg-rose-50/40 p-4 dark:border-rose-900/30 dark:bg-rose-950/10">
              <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-rose-700 dark:text-rose-400">
                <Minus size={16} />
                Cons
              </div>
              <ul className="space-y-1.5">
                {review.cons.map((con, i) => (
                  <li
                    key={`con-${i}`}
                    className="flex items-start gap-2 text-sm text-rose-800 dark:text-rose-200"
                  >
                    <Minus
                      size={14}
                      className="mt-0.5 shrink-0 text-rose-500"
                    />
                    {con}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      <div className="mt-4 flex flex-wrap items-center gap-2">
        {user && !isOwn ? (
          <>
            <button
              type="button"
              onClick={() => handleVote("HELPFUL")}
              disabled={voteMutation.isPending}
              className={`inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-semibold transition-all duration-300 disabled:opacity-50 ${
                userVote === "HELPFUL"
                  ? "bg-sky-100 text-sky-700 dark:bg-sky-950/40 dark:text-sky-300"
                  : "text-slate-500 hover:bg-sky-50 hover:text-sky-700 dark:text-slate-400 dark:hover:bg-sky-950/30 dark:hover:text-sky-300"
              }`}
            >
              {voteMutation.isPending &&
              voteMutation.variables === "HELPFUL" ? (
                <Loader2 className="animate-spin" size={14} />
              ) : (
                <ThumbsUp
                  size={14}
                  fill={userVote === "HELPFUL" ? "currentColor" : "none"}
                />
              )}
              Helpful ({review.helpfulCount})
            </button>
            <button
              type="button"
              onClick={() => handleVote("NOT_HELPFUL")}
              disabled={voteMutation.isPending}
              className={`inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-semibold transition-all duration-300 disabled:opacity-50 ${
                userVote === "NOT_HELPFUL"
                  ? "bg-rose-100 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300"
                  : "text-slate-500 hover:bg-slate-100 hover:text-slate-700 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-200"
              }`}
            >
              {voteMutation.isPending &&
              voteMutation.variables === "NOT_HELPFUL" ? (
                <Loader2 className="animate-spin" size={14} />
              ) : (
                <ThumbsDown
                  size={14}
                  fill={userVote === "NOT_HELPFUL" ? "currentColor" : "none"}
                />
              )}
              Not helpful ({review.notHelpfulCount})
            </button>
            {voteMutation.isError && (
              <span className="inline-flex items-center gap-1 text-xs text-red-600 dark:text-red-400">
                <AlertCircle size={12} />
                {friendlyErrorMessage(voteMutation.error)}
              </span>
            )}
          </>
        ) : user ? (
          <span className="text-xs text-slate-400 dark:text-slate-600">
            You cannot vote on your own review
          </span>
        ) : (
          <span className="text-xs text-slate-400 dark:text-slate-600">
            {review.helpfulCount} found this helpful
          </span>
        )}
      </div>
    </div>
  );
}
