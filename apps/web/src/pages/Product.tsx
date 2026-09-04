import { useParams } from "react-router-dom";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { createReviewSchema, CreateReviewInput } from "@product-reviews/shared";
import { productsApi } from "../api/products";
import { reviewsApi } from "../api/reviews";
import { ReviewCard } from "../components/ReviewCard";
import { StarRating } from "../components/StarRating";
import { DetailSkeleton, ReviewSkeleton } from "../components/Skeletons";
import { EmptyState } from "../components/EmptyState";
import { useToast } from "../hooks/useToast";
import { useAuthStore } from "../store/authStore";
import { AlertCircle, CheckCircle2, Tag, Loader2, PenSquare } from "lucide-react";

export default function Product() {
  const { id } = useParams<{ id: string }>();
  const user = useAuthStore((state) => state.user);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const productQuery = useQuery({
    queryKey: ["product", id],
    queryFn: () => productsApi.get(id ?? ""),
    enabled: Boolean(id),
  });

  const reviewsQuery = useQuery({
    queryKey: ["reviews", id],
    queryFn: () => reviewsApi.list(id ?? "", { page: 1, limit: 20 }),
    enabled: Boolean(id),
  });

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<CreateReviewInput>({
    resolver: zodResolver(createReviewSchema),
    defaultValues: { rating: 5, title: "", content: "", images: [] },
  });

  const createReview = useMutation({
    mutationFn: (data: CreateReviewInput) => reviewsApi.create(id ?? "", data),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["reviews", id] });
      await queryClient.invalidateQueries({ queryKey: ["product", id] });
      reset();
      toast("Review submitted!", "success");
    },
    onError: () => {
      toast("Failed to submit review", "error");
    },
  });

  const onSubmit = (data: CreateReviewInput) => {
    createReview.mutate(data);
  };

  if (productQuery.isLoading) return <DetailSkeleton />;
  if (productQuery.isError)
    return (
      <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-400">
        <AlertCircle size={18} />
        Failed to load product.
      </div>
    );
  if (!productQuery.data) return <EmptyState icon="package" title="Product not found" />;

  const product = productQuery.data;

  return (
    <div className="space-y-6">
      <div className="card animate-slide-up p-6">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <h1 className="text-2xl font-bold">{product.name}</h1>
            <p className="mt-2 text-gray-700 dark:text-gray-300">
              {product.description}
            </p>
          </div>
          {product.category && (
            <span className="badge bg-indigo-50 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300">
              <Tag size={10} />
              {product.category}
            </span>
          )}
        </div>
        <div className="mt-4 flex items-center gap-6">
          <span className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">
            ${product.price.toFixed(2)}
          </span>
          <StarRating
            rating={product.averageRating}
            size={20}
            reviewCount={product.reviewCount}
          />
        </div>
      </div>

      {user && (
        <div className="card animate-slide-up p-6">
          <div className="flex items-center gap-2">
            <PenSquare className="text-indigo-600 dark:text-indigo-400" size={20} />
            <h2 className="text-lg font-semibold">Write a review</h2>
          </div>
          {createReview.isError && (
            <div className="mt-3 flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-400">
              <AlertCircle size={16} />
              Failed to submit review. You may have already reviewed this product.
            </div>
          )}
          {createReview.isSuccess && (
            <div className="mt-3 flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950 dark:text-emerald-400">
              <CheckCircle2 size={16} />
              Review submitted successfully.
            </div>
          )}
          <form onSubmit={handleSubmit(onSubmit)} className="mt-4 space-y-4">
            <div>
              <input
                {...register("title")}
                placeholder="Review title"
                className="input"
              />
              {errors.title && (
                <p className="mt-1.5 text-sm text-red-600">{errors.title.message}</p>
              )}
            </div>
            <div>
              <textarea
                {...register("content")}
                rows={4}
                placeholder="Share your thoughts..."
                className="input resize-none"
              />
              {errors.content && (
                <p className="mt-1.5 text-sm text-red-600">{errors.content.message}</p>
              )}
            </div>
            <div className="flex items-end gap-4">
              <div className="w-32">
                <label className="mb-1 block text-sm font-medium text-gray-600 dark:text-gray-400">
                  Rating
                </label>
                <input
                  type="number"
                  {...register("rating", { valueAsNumber: true })}
                  min={1}
                  max={5}
                  className="input"
                />
              </div>
              {errors.rating && (
                <p className="text-sm text-red-600">{errors.rating.message}</p>
              )}
              <button
                type="submit"
                disabled={isSubmitting || createReview.isPending}
                className="btn-primary"
              >
                {(isSubmitting || createReview.isPending) && (
                  <Loader2 className="animate-spin" size={18} />
                )}
                Submit review
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="space-y-4">
        <h2 className="text-lg font-semibold">
          Reviews{" "}
          <span className="text-sm font-normal text-gray-400">
            ({product.reviewCount})
          </span>
        </h2>
        {reviewsQuery.isLoading ? (
          <div className="space-y-3">
            <ReviewSkeleton />
            <ReviewSkeleton />
          </div>
        ) : reviewsQuery.data?.data.length ? (
          reviewsQuery.data.data.map((review) => (
            <ReviewCard key={review.id} review={review} productId={id ?? ""} />
          ))
        ) : (
          <EmptyState
            icon="reviews"
            title="No reviews yet"
            description="Be the first to share your experience."
          />
        )}
      </div>
    </div>
  );
}
