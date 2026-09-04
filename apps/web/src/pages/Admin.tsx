import { useState } from "react";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { useAuthStore } from "../store/authStore";
import { useToast } from "../hooks/useToast";
import { friendlyErrorMessage } from "../api/client";
import { EmptyState } from "../components/EmptyState";
import { ReviewSkeleton } from "../components/Skeletons";
import {
  Shield,
  CheckCircle2,
  XCircle,
  Trash2,
  AlertCircle,
  Clock,
  Database,
  Loader2,
  ChevronDown,
} from "lucide-react";
import {
  adminApi,
  type SourceId,
  SOURCE_LABELS,
  type SourceResult,
} from "../api/admin";

const SOURCE_OPTIONS: SourceId[] = [
  "all",
  "off",
  "itunes_movies",
  "itunes_podcasts",
  "itunes_apps",
  "openlibrary",
];

export default function Admin() {
  const user = useAuthStore((state) => state.user);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const reviewsQuery = useQuery({
    queryKey: ["admin-reviews", "PENDING"],
    queryFn: () =>
      adminApi.getReviews({ status: "PENDING", page: 1, limit: 20 }),
  });

  const updateStatus = useMutation({
    mutationFn: ({
      id,
      status,
    }: {
      id: string;
      status: "APPROVED" | "REJECTED";
    }) => adminApi.updateReviewStatus(id, status),
    onSuccess: (_data, vars) => {
      queryClient.invalidateQueries({ queryKey: ["admin-reviews"] });
      toast(
        vars.status === "APPROVED" ? "Review approved" : "Review rejected",
        vars.status === "APPROVED" ? "success" : "info",
      );
    },
    onError: (err) => toast(friendlyErrorMessage(err), "error"),
  });

  const deleteReview = useMutation({
    mutationFn: (id: string) => adminApi.deleteReview(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-reviews"] });
      toast("Review deleted", "success");
    },
    onError: (err) => toast(friendlyErrorMessage(err), "error"),
  });

  const [selectedSource, setSelectedSource] = useState<SourceId>("all");
  const [sourceMenuOpen, setSourceMenuOpen] = useState(false);

  const seedProducts = useMutation({
    mutationFn: () => adminApi.seedProducts(selectedSource, 100),
    onSuccess: (results: SourceResult[]) => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
      const totalInserted = results.reduce((sum, r) => sum + r.inserted, 0);
      const totalSkipped = results.reduce((sum, r) => sum + r.skipped, 0);
      const sourceNames = results
        .filter((r) => r.inserted > 0)
        .map((r) => SOURCE_LABELS[r.source as SourceId] ?? r.source)
        .join(", ");
      toast(
        `Imported ${totalInserted} products${sourceNames ? ` from ${sourceNames}` : ""} (${totalSkipped} duplicates skipped)`,
        "success",
      );
    },
    onError: (err) => toast(friendlyErrorMessage(err), "error"),
  });

  if (!user || user.role !== "ADMIN") {
    return (
      <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-sky-200 py-20 dark:border-sky-900/30">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-sky-50 dark:bg-sky-950/30">
          <Shield className="text-sky-400" size={32} />
        </div>
        <h3 className="mt-4 text-lg font-bold tracking-tight text-slate-700 dark:text-slate-300">
          Admin access required
        </h3>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          You must be an admin to view this page.
        </p>
      </div>
    );
  }

  const pendingCount = reviewsQuery.data?.meta.total ?? 0;

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-sky-500 to-cyan-500 shadow-[0_4px_14px_rgba(14,165,233,0.25)]">
            <Shield className="text-white" size={22} />
          </div>
          <div>
            <h1 className="text-2xl font-extrabold tracking-tight">Moderation</h1>
            <p className="text-sm text-slate-400 dark:text-slate-500">
              {pendingCount > 0
                ? `${pendingCount} review${pendingCount !== 1 ? "s" : ""} awaiting approval`
                : "All caught up"}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative">
            <button
              type="button"
              onClick={() => setSourceMenuOpen(!sourceMenuOpen)}
              className="btn-secondary !py-2.5"
            >
              {SOURCE_LABELS[selectedSource]}
              <ChevronDown size={16} />
            </button>
            {sourceMenuOpen && (
              <div className="animate-scale-in absolute right-0 top-full z-50 mt-2 w-48 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-lg dark:border-slate-700 dark:bg-slate-800">
                {SOURCE_OPTIONS.map((src) => (
                  <button
                    key={src}
                    type="button"
                    onClick={() => {
                      setSelectedSource(src);
                      setSourceMenuOpen(false);
                    }}
                    className={`flex w-full items-center px-4 py-2.5 text-left text-sm transition ${
                      selectedSource === src
                        ? "bg-sky-50 font-semibold text-sky-600 dark:bg-sky-950/30 dark:text-sky-400"
                        : "text-slate-600 hover:bg-slate-50 dark:text-slate-400 dark:hover:bg-slate-700/30"
                    }`}
                  >
                    {SOURCE_LABELS[src]}
                  </button>
                ))}
              </div>
            )}
          </div>
          <button
            type="button"
            onClick={() => seedProducts.mutate()}
            disabled={seedProducts.isPending}
            className="btn-primary"
          >
            {seedProducts.isPending ? (
              <Loader2 className="animate-spin" size={18} />
            ) : (
              <Database size={18} />
            )}
            {seedProducts.isPending ? "Mining..." : "Mine Products"}
          </button>
        </div>
      </div>

      {seedProducts.isError && (
        <div className="flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/30 dark:text-red-400">
          <AlertCircle size={18} />
          Failed to fetch products. The Open Food Facts API may be unavailable.
        </div>
      )}

      {reviewsQuery.isError && (
        <div className="flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/30 dark:text-red-400">
          <AlertCircle size={18} />
          Failed to load reviews.
        </div>
      )}

      {reviewsQuery.isLoading ? (
        <div className="space-y-4">
          <ReviewSkeleton />
          <ReviewSkeleton />
          <ReviewSkeleton />
        </div>
      ) : reviewsQuery.data?.data.length ? (
        <div className="space-y-4">
          {reviewsQuery.data.data.map((review) => (
            <div key={review.id} className="card animate-slide-up p-6">
              <div className="flex items-start justify-between">
                <h3 className="font-bold tracking-tight text-slate-800 dark:text-slate-200">{review.title}</h3>
                <span className="badge bg-amber-50 text-amber-700 dark:bg-amber-950/30 dark:text-amber-400">
                  <Clock size={10} />
                  {review.status}
                </span>
              </div>
              <p className="mt-2 text-sm leading-relaxed text-slate-600 dark:text-slate-300">
                {review.content}
              </p>
              <div className="mt-5 flex gap-2">
                <button
                  type="button"
                  onClick={() =>
                    updateStatus.mutate({ id: review.id, status: "APPROVED" })
                  }
                  disabled={updateStatus.isPending}
                  className="btn-success !px-4 !py-2"
                >
                  <CheckCircle2 size={16} />
                  Approve
                </button>
                <button
                  type="button"
                  onClick={() =>
                    updateStatus.mutate({ id: review.id, status: "REJECTED" })
                  }
                  disabled={updateStatus.isPending}
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-amber-500 px-4 py-2 text-sm font-semibold text-white shadow-[0_4px_14px_rgba(245,158,11,0.25)] transition-all duration-300 hover:bg-amber-600 active:scale-[0.98] disabled:opacity-50"
                >
                  <XCircle size={16} />
                  Reject
                </button>
                <button
                  type="button"
                  onClick={() => deleteReview.mutate(review.id)}
                  disabled={deleteReview.isPending}
                  className="btn-danger !px-4 !py-2"
                >
                  <Trash2 size={16} />
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <EmptyState
          icon="reviews"
          title="No pending reviews"
          description="All reviews have been moderated."
        />
      )}
    </div>
  );
}
