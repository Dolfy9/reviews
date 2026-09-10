import { useParams, Link } from "react-router-dom";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  createReviewSchema,
  CreateReviewInput,
  UpdateReviewInput,
  ReviewDto,
} from "@product-reviews/shared";
import { productsApi } from "../api/products";
import { reviewsApi } from "../api/reviews";
import { ReviewCard } from "../components/ReviewCard";
import { ProductCard } from "../components/ProductCard";
import { StarRating } from "../components/StarRating";
import { ReviewImageInput } from "../components/ReviewImageInput";
import { ProsConsInput } from "../components/ProsConsInput";
import { DetailSkeleton, ReviewSkeleton } from "../components/Skeletons";
import { EmptyState } from "../components/EmptyState";
import { useToast } from "../hooks/useToast";
import { useAuthStore } from "../store/authStore";
import { friendlyErrorMessage } from "../api/client";
import {
  AlertCircle,
  CheckCircle2,
  Tag,
  Loader2,
  PenSquare,
  ArrowLeft,
  Waves,
  ImageOff,
  Sparkles,
  LogIn,
  X,
  ZoomIn,
  ChevronLeft,
  ChevronRight,
  Info,
  MessageSquare,
  Pencil,
  Trash2,
} from "lucide-react";
import { useState, useCallback, useEffect } from "react";

export default function Product() {
  const { id } = useParams<{ id: string }>();
  const user = useAuthStore((state) => state.user);
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [mainImageError, setMainImageError] = useState(false);
  const [imgErrors, setImgErrors] = useState<Set<number>>(new Set());
  const [selectedImage, setSelectedImage] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [editingReview, setEditingReview] = useState<ReviewDto | null>(null);

  useEffect(() => {
    setImgErrors(new Set());
    setMainImageError(false);
    setSelectedImage(0);
    setEditingReview(null);
  }, [id]);

  const openLightbox = useCallback(() => setLightboxOpen(true), []);
  const closeLightbox = useCallback(() => setLightboxOpen(false), []);
  const prevImage = useCallback(() => setSelectedImage((p) => p - 1), []);
  const nextImage = useCallback(() => setSelectedImage((p) => p + 1), []);

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

  const myReviewQuery = useQuery({
    queryKey: ["my-review", id],
    queryFn: () => reviewsApi.checkMine(id ?? ""),
    enabled: Boolean(id) && Boolean(user),
  });

  const similarQuery = useQuery({
    queryKey: ["similar", id],
    queryFn: () => productsApi.similar(id ?? "", 4),
    enabled: Boolean(id),
  });

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<CreateReviewInput>({
    resolver: zodResolver(createReviewSchema),
    defaultValues: {
      rating: 5,
      title: "",
      content: "",
      images: [],
      pros: [],
      cons: [],
    },
  });

  useEffect(() => {
    if (editingReview) {
      reset({
        rating: editingReview.rating,
        title: editingReview.title,
        content: editingReview.content,
        images: editingReview.images,
        pros: editingReview.pros,
        cons: editingReview.cons,
      });
    } else {
      reset({
        rating: 5,
        title: "",
        content: "",
        images: [],
        pros: [],
        cons: [],
      });
    }
  }, [editingReview, reset]);

  const createReview = useMutation({
    mutationFn: (data: CreateReviewInput) => reviewsApi.create(id ?? "", data),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["reviews", id] });
      await queryClient.invalidateQueries({ queryKey: ["product", id] });
      await queryClient.invalidateQueries({ queryKey: ["my-review", id] });
      reset();
      toast("Review submitted!", "success");
    },
    onError: (err) => {
      toast(friendlyErrorMessage(err), "error");
    },
  });

  const updateReview = useMutation({
    mutationFn: ({
      reviewId,
      data,
    }: {
      reviewId: string;
      data: UpdateReviewInput;
    }) => reviewsApi.update(reviewId, data),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["reviews", id] });
      await queryClient.invalidateQueries({ queryKey: ["product", id] });
      await queryClient.invalidateQueries({ queryKey: ["my-review", id] });
      setEditingReview(null);
      reset();
      toast("Review updated!", "success");
    },
    onError: (err) => {
      toast(friendlyErrorMessage(err), "error");
    },
  });

  const deleteReview = useMutation({
    mutationFn: (reviewId: string) => reviewsApi.delete(reviewId),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["reviews", id] });
      await queryClient.invalidateQueries({ queryKey: ["product", id] });
      await queryClient.invalidateQueries({ queryKey: ["my-review", id] });
      setEditingReview(null);
      reset();
      toast("Review deleted", "success");
    },
    onError: (err) => {
      toast(friendlyErrorMessage(err), "error");
    },
  });

  const handleDelete = (reviewId: string) => {
    deleteReview.mutate(reviewId);
  };

  const onSubmit = (data: CreateReviewInput) => {
    if (editingReview) {
      updateReview.mutate({ reviewId: editingReview.id, data });
    } else {
      createReview.mutate(data);
    }
  };

  if (productQuery.isLoading) return <DetailSkeleton />;
  if (productQuery.isError)
    return (
      <div className="flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/30 dark:text-red-400">
        <AlertCircle size={18} />
        Failed to load product.
      </div>
    );
  if (!productQuery.data)
    return <EmptyState icon="package" title="Product not found" />;

  const product = productQuery.data;
  const hasImages = product.images.length > 0;
  const mainImageSrc = hasImages ? product.images[selectedImage] : undefined;
  const metadataEntries = product.metadata
    ? Object.entries(product.metadata).filter(([, v]) => {
        if (v === null || v === undefined) return false;
        if (Array.isArray(v)) return v.length > 0;
        if (typeof v === "object") return false;
        return String(v).trim().length > 0;
      })
    : [];

  return (
    <div className="space-y-8">
      <Link
        to="/"
        className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 transition hover:text-sky-600 dark:text-slate-400 dark:hover:text-sky-400"
      >
        <ArrowLeft size={16} />
        Back to products
      </Link>

      {/* Product hero */}
      <div className="card animate-slide-up relative overflow-hidden p-8">
        <div className="pointer-events-none absolute -top-20 -right-20 h-60 w-60 rounded-full bg-sky-500/8 blur-3xl" />
        <div className="relative flex flex-col gap-8 sm:flex-row">
          {/* Image gallery - e-shop style */}
          {hasImages && mainImageSrc && !mainImageError ? (
            <div className="flex flex-col gap-3">
              <button
                onClick={openLightbox}
                className="group/gallery relative h-80 w-80 shrink-0 overflow-hidden rounded-2xl border border-slate-100 bg-slate-50 dark:border-slate-800 dark:bg-slate-800/50"
              >
                <img
                  src={mainImageSrc}
                  alt={product.name}
                  onError={() => setMainImageError(true)}
                  className="h-full w-full object-contain transition-transform duration-300 group-hover/gallery:scale-105"
                />
                <div className="absolute bottom-2 right-2 flex items-center gap-1 rounded-lg bg-black/60 px-2 py-1 text-xs text-white opacity-0 transition group-hover/gallery:opacity-100">
                  <ZoomIn size={14} />
                  View full
                </div>
              </button>
              {product.images.length > 1 && (
                <div className="flex flex-wrap gap-2 max-w-80">
                  {product.images.map((img, idx) => (
                    <button
                      key={idx}
                      onClick={() => setSelectedImage(idx)}
                      className={`h-16 w-16 overflow-hidden rounded-lg border-2 transition ${
                        selectedImage === idx
                          ? "border-sky-500"
                          : "border-slate-200 hover:border-sky-300 dark:border-slate-700"
                      } ${imgErrors.has(idx) ? "bg-slate-100 dark:bg-slate-800" : ""}`}
                    >
                      {imgErrors.has(idx) ? (
                        <div className="flex h-full w-full items-center justify-center text-slate-300 dark:text-slate-600">
                          <ImageOff size={20} />
                        </div>
                      ) : (
                        <img
                          src={img}
                          alt={`${product.name} ${idx + 1}`}
                          className="h-full w-full object-contain"
                          loading="lazy"
                          onError={() =>
                            setImgErrors((prev) => new Set([...prev, idx]))
                          }
                        />
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="flex h-80 w-80 shrink-0 items-center justify-center rounded-2xl border border-slate-100 bg-slate-50 dark:border-slate-800 dark:bg-slate-800/50">
              <ImageOff
                className="text-slate-300 dark:text-slate-600"
                size={48}
              />
            </div>
          )}

          {/* Info */}
          <div className="flex flex-1 flex-col">
            <div className="flex items-start justify-between gap-4">
              <h1 className="text-3xl font-extrabold tracking-tight">
                {product.name}
              </h1>
              {product.category && (
                <span className="badge-brand shrink-0">
                  <Tag size={10} />
                  {product.category}
                </span>
              )}
            </div>
            <p className="mt-3 leading-relaxed text-slate-600 dark:text-slate-300">
              {product.description}
            </p>

            {/* Dynamic metadata parameters */}
            {metadataEntries.length > 0 && (
              <div className="mt-4 rounded-xl border border-slate-100 bg-slate-50/50 p-4 dark:border-slate-800 dark:bg-slate-800/30">
                <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-600 dark:text-slate-400">
                  <Info size={14} />
                  Product Details
                </div>
                <dl className="grid grid-cols-1 gap-x-6 gap-y-2 sm:grid-cols-2">
                  {metadataEntries.map(([key, value]) => (
                    <div
                      key={key}
                      className="flex justify-between gap-2 text-sm"
                    >
                      <dt className="font-medium capitalize text-slate-500 dark:text-slate-400">
                        {key.replace(/([A-Z])/g, " $1").trim()}
                      </dt>
                      <dd className="truncate text-slate-700 dark:text-slate-300">
                        {Array.isArray(value)
                          ? value.join(", ")
                          : String(value)}
                      </dd>
                    </div>
                  ))}
                </dl>
              </div>
            )}

            <div className="mt-auto flex items-center gap-8 border-t border-slate-100 pt-6 dark:border-slate-800/50">
              <span className="text-3xl font-extrabold gradient-text">
                ${product.price.toFixed(2)}
              </span>
              <StarRating
                rating={product.averageRating}
                size={20}
                reviewCount={product.reviewCount}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Lightbox */}
      {lightboxOpen && mainImageSrc && !mainImageError && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm"
          onClick={closeLightbox}
        >
          <button
            onClick={closeLightbox}
            className="absolute right-4 top-4 flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white transition hover:bg-white/20"
          >
            <X size={24} />
          </button>
          {selectedImage > 0 && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                prevImage();
              }}
              className="absolute left-4 flex h-12 w-12 items-center justify-center rounded-full bg-white/10 text-white transition hover:bg-white/20"
            >
              <ChevronLeft size={28} />
            </button>
          )}
          {selectedImage < product.images.length - 1 && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                nextImage();
              }}
              className="absolute right-4 flex h-12 w-12 items-center justify-center rounded-full bg-white/10 text-white transition hover:bg-white/20"
            >
              <ChevronRight size={28} />
            </button>
          )}
          <img
            src={mainImageSrc}
            alt={product.name}
            onClick={(e) => e.stopPropagation()}
            className="max-h-[90vh] max-w-[90vw] rounded-lg object-contain"
          />
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 rounded-full bg-white/10 px-4 py-1.5 text-sm text-white">
            {selectedImage + 1} / {product.images.length}
          </div>
        </div>
      )}

      {/* Review form, already-reviewed banner, or login prompt */}
      {user ? (
        myReviewQuery.isLoading ? (
          <div className="card animate-pulse h-20 bg-slate-100 p-6 dark:bg-slate-800" />
        ) : myReviewQuery.isError ? (
          <div className="flex items-center gap-2 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700 dark:border-amber-900 dark:bg-amber-950/30 dark:text-amber-400">
            <AlertCircle size={18} />
            Could not check your review status. Please refresh the page.
          </div>
        ) : myReviewQuery.data?.review && !editingReview ? (
          <div className="card animate-slide-up flex items-center justify-between gap-4 p-6">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-500 shadow-[0_4px_14px_rgba(16,185,129,0.25)]">
                <MessageSquare className="text-white" size={24} />
              </div>
              <div>
                <h2 className="text-base font-bold tracking-tight">
                  You've already reviewed this product
                </h2>
                <p className="mt-0.5 text-sm text-slate-500 dark:text-slate-400">
                  You rated it {myReviewQuery.data.review.rating}/5 stars. You
                  can only write one review per product.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setEditingReview(myReviewQuery.data.review!)}
                className="inline-flex items-center gap-1.5 rounded-xl px-3 py-2 text-sm font-semibold text-sky-600 transition hover:bg-sky-50 dark:text-sky-400 dark:hover:bg-sky-950/30"
              >
                <Pencil size={14} />
                Edit
              </button>
              <button
                type="button"
                onClick={() => handleDelete(myReviewQuery.data.review!.id)}
                disabled={deleteReview.isPending}
                className="inline-flex items-center gap-1.5 rounded-xl px-3 py-2 text-sm font-semibold text-rose-600 transition hover:bg-rose-50 disabled:opacity-50 dark:text-rose-400 dark:hover:bg-rose-950/30"
              >
                {deleteReview.isPending ? (
                  <Loader2 className="animate-spin" size={14} />
                ) : (
                  <Trash2 size={14} />
                )}
                Delete
              </button>
            </div>
          </div>
        ) : (
          <div className="card animate-slide-up p-8">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-sky-500 to-cyan-500">
                  <PenSquare className="text-white" size={18} />
                </div>
                <h2 className="text-lg font-bold tracking-tight">
                  {editingReview ? "Edit your review" : "Share your experience"}
                </h2>
              </div>
              {editingReview && (
                <button
                  type="button"
                  onClick={() => setEditingReview(null)}
                  className="text-sm font-semibold text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
                >
                  Cancel
                </button>
              )}
            </div>
            {createReview.isError && (
              <div className="mt-4 flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/30 dark:text-red-400">
                <AlertCircle size={16} />
                Failed to submit review. You may have already reviewed this
                product.
              </div>
            )}
            {createReview.isSuccess && (
              <div className="mt-4 flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950/30 dark:text-emerald-400">
                <CheckCircle2 size={16} />
                Review submitted successfully.
              </div>
            )}
            <form onSubmit={handleSubmit(onSubmit)} className="mt-5 space-y-4">
              <div>
                <input
                  {...register("title")}
                  placeholder="Review title"
                  className="input"
                />
                {errors.title && (
                  <p className="mt-1.5 text-sm text-red-600">
                    {errors.title.message}
                  </p>
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
                  <p className="mt-1.5 text-sm text-red-600">
                    {errors.content.message}
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-slate-600 dark:text-slate-400">
                  Rating
                </label>
                <StarRating
                  rating={watch("rating")}
                  size={28}
                  showValue={false}
                  onChange={(n) =>
                    setValue("rating", n, { shouldValidate: true })
                  }
                />
                {errors.rating && (
                  <p className="text-sm text-red-600">
                    {errors.rating.message}
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-slate-600 dark:text-slate-400">
                  Attach pictures
                </label>
                <ReviewImageInput
                  images={watch("images") ?? []}
                  onChange={(images) =>
                    setValue("images", images, { shouldValidate: true })
                  }
                  onError={(msg) => toast(msg, "error")}
                />
                {errors.images && (
                  <p className="text-sm text-red-600">
                    {errors.images.message}
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-slate-600 dark:text-slate-400">
                  Pros and cons
                </label>
                <ProsConsInput
                  pros={watch("pros") ?? []}
                  cons={watch("cons") ?? []}
                  onProsChange={(pros) =>
                    setValue("pros", pros, { shouldValidate: true })
                  }
                  onConsChange={(cons) =>
                    setValue("cons", cons, { shouldValidate: true })
                  }
                />
                {(errors.pros || errors.cons) && (
                  <p className="text-sm text-red-600">
                    {errors.pros?.message || errors.cons?.message}
                  </p>
                )}
              </div>
              <button
                type="submit"
                disabled={
                  isSubmitting ||
                  createReview.isPending ||
                  updateReview.isPending ||
                  deleteReview.isPending
                }
                className="btn-primary"
              >
                {(isSubmitting ||
                  createReview.isPending ||
                  updateReview.isPending) && (
                  <Loader2 className="animate-spin" size={18} />
                )}
                {editingReview ? "Save changes" : "Submit review"}
              </button>
            </form>
          </div>
        )
      ) : (
        <div className="card animate-slide-up flex flex-col items-center gap-4 p-8 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-sky-500 to-cyan-500 shadow-[0_4px_14px_rgba(14,165,233,0.25)]">
            <PenSquare className="text-white" size={24} />
          </div>
          <div>
            <h2 className="text-lg font-bold tracking-tight">
              Share your experience
            </h2>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              You need to be logged in to write a review for this product.
            </p>
          </div>
          <Link to="/login" className="btn-primary">
            <LogIn size={18} />
            Sign in to review
          </Link>
        </div>
      )}

      {/* Reviews list */}
      <div className="space-y-5">
        <div className="flex items-center gap-2.5">
          <Waves className="text-sky-500" size={20} />
          <h2 className="text-lg font-bold tracking-tight">
            Reviews{" "}
            <span className="text-sm font-normal text-slate-400 dark:text-slate-500">
              ({product.reviewCount})
            </span>
          </h2>
        </div>
        {reviewsQuery.isLoading ? (
          <div className="space-y-4">
            <ReviewSkeleton />
            <ReviewSkeleton />
          </div>
        ) : reviewsQuery.isError ? (
          <div className="flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/30 dark:text-red-400">
            <AlertCircle size={18} />
            Failed to load reviews. Please try again.
          </div>
        ) : reviewsQuery.data?.data.length ? (
          reviewsQuery.data.data.map((review) => (
            <ReviewCard
              key={review.id}
              review={review}
              productId={id ?? ""}
              onEdit={setEditingReview}
              onDelete={handleDelete}
            />
          ))
        ) : (
          <EmptyState
            icon="reviews"
            title="No reviews yet"
            description="Be the first to share your experience."
          />
        )}
      </div>

      {/* Similar products */}
      {similarQuery.isLoading ? (
        <div className="space-y-4">
          <div className="h-6 w-48 animate-pulse rounded bg-slate-200 dark:bg-slate-700" />
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div
                key={i}
                className="card h-64 animate-pulse bg-slate-100 dark:bg-slate-800"
              />
            ))}
          </div>
        </div>
      ) : similarQuery.data && similarQuery.data.length > 0 ? (
        <div className="space-y-4">
          <div className="flex items-center gap-2.5">
            <Sparkles className="text-sky-500" size={20} />
            <h2 className="text-lg font-bold tracking-tight">
              Similar products{" "}
              <span className="text-sm font-normal text-slate-400 dark:text-slate-500">
                in {product.category}
              </span>
            </h2>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {similarQuery.data.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}
