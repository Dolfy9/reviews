import { useParams } from "react-router-dom";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { createReviewSchema, CreateReviewInput } from "@product-reviews/shared";
import { productsApi } from "../api/products";
import { reviewsApi } from "../api/reviews";
import { ReviewCard } from "../components/ReviewCard";
import { useAuthStore } from "../store/authStore";

export default function Product() {
  const { id } = useParams<{ id: string }>();
  const user = useAuthStore((state) => state.user);
  const queryClient = useQueryClient();

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
    },
  });

  const onSubmit = (data: CreateReviewInput) => {
    createReview.mutate(data);
  };

  if (productQuery.isLoading) return <p>Loading...</p>;
  if (!productQuery.data) return <p>Product not found.</p>;

  const product = productQuery.data;

  return (
    <div className="space-y-6">
      <div className="rounded-lg border bg-white p-6">
        <h1 className="text-2xl font-bold">{product.name}</h1>
        <p className="mt-2 text-gray-700">{product.description}</p>
        <div className="mt-4 flex items-center gap-4">
          <span className="text-xl font-bold text-indigo-600">
            ${product.price.toFixed(2)}
          </span>
          <span className="text-gray-500">
            {product.averageRating.toFixed(1)} / 5 ({product.reviewCount}{" "}
            reviews)
          </span>
        </div>
      </div>

      {user && (
        <div className="rounded-lg border bg-white p-6">
          <h2 className="text-lg font-semibold">Write a review</h2>
          <form onSubmit={handleSubmit(onSubmit)} className="mt-4 space-y-3">
            <input
              {...register("title")}
              placeholder="Title"
              className="w-full rounded-md border px-3 py-2"
            />
            {errors.title && (
              <p className="text-sm text-red-600">{errors.title.message}</p>
            )}
            <textarea
              {...register("content")}
              rows={4}
              placeholder="Your review"
              className="w-full rounded-md border px-3 py-2"
            />
            {errors.content && (
              <p className="text-sm text-red-600">{errors.content.message}</p>
            )}
            <input
              type="number"
              {...register("rating", { valueAsNumber: true })}
              min={1}
              max={5}
              className="w-full rounded-md border px-3 py-2"
            />
            {errors.rating && (
              <p className="text-sm text-red-600">{errors.rating.message}</p>
            )}
            <button
              type="submit"
              disabled={isSubmitting}
              className="rounded-md bg-indigo-600 px-4 py-2 text-white hover:bg-indigo-700 disabled:bg-gray-400"
            >
              Submit review
            </button>
          </form>
        </div>
      )}

      <div className="space-y-4">
        <h2 className="text-lg font-semibold">Reviews</h2>
        {reviewsQuery.isLoading ? (
          <p>Loading reviews...</p>
        ) : reviewsQuery.data?.data.length ? (
          reviewsQuery.data.data.map((review) => (
            <ReviewCard key={review.id} review={review} productId={id ?? ""} />
          ))
        ) : (
          <p className="text-gray-500">No reviews yet.</p>
        )}
      </div>
    </div>
  );
}
