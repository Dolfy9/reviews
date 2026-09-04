import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { adminApi } from "../api/admin";
import { useAuthStore } from "../store/authStore";
import { useToast } from "../hooks/useToast";
import { EmptyState } from "../components/EmptyState";
import { ReviewSkeleton } from "../components/Skeletons";
import {
  Shield,
  CheckCircle2,
  XCircle,
  Trash2,
  AlertCircle,
  Clock,
} from "lucide-react";

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
    onError: () => toast("Failed to update review status", "error"),
  });

  const deleteReview = useMutation({
    mutationFn: (id: string) => adminApi.deleteReview(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-reviews"] });
      toast("Review deleted", "success");
    },
    onError: () => toast("Failed to delete review", "error"),
  });

  if (!user || user.role !== "ADMIN") {
    return (
      <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-gray-300 py-16 dark:border-gray-700">
        <Shield className="text-gray-300 dark:text-gray-600" size={48} />
        <h3 className="mt-4 text-lg font-semibold text-gray-700 dark:text-gray-300">
          Admin access required
        </h3>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          You must be an admin to view this page.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Shield className="text-indigo-600 dark:text-indigo-400" size={28} />
        <h1 className="text-2xl font-bold">Pending reviews</h1>
      </div>

      {reviewsQuery.isError && (
        <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-400">
          <AlertCircle size={18} />
          Failed to load reviews.
        </div>
      )}
      {updateStatus.isError && (
        <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-400">
          <AlertCircle size={18} />
          Failed to update review status.
        </div>
      )}
      {deleteReview.isError && (
        <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-400">
          <AlertCircle size={18} />
          Failed to delete review.
        </div>
      )}

      {reviewsQuery.isLoading ? (
        <div className="space-y-3">
          <ReviewSkeleton />
          <ReviewSkeleton />
          <ReviewSkeleton />
        </div>
      ) : reviewsQuery.data?.data.length ? (
        <div className="space-y-4">
          {reviewsQuery.data.data.map((review) => (
            <div key={review.id} className="card animate-slide-up p-5">
              <div className="flex items-start justify-between">
                <h3 className="font-semibold">{review.title}</h3>
                <span className="badge bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-400">
                  <Clock size={10} />
                  {review.status}
                </span>
              </div>
              <p className="mt-2 text-sm text-gray-700 dark:text-gray-300">
                {review.content}
              </p>
              <div className="mt-4 flex gap-2">
                <button
                  type="button"
                  onClick={() =>
                    updateStatus.mutate({ id: review.id, status: "APPROVED" })
                  }
                  disabled={updateStatus.isPending}
                  className="btn-success !px-3 !py-1.5"
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
                  className="inline-flex items-center justify-center gap-2 rounded-lg bg-amber-600 px-3 py-1.5 text-sm font-medium text-white shadow-sm transition-all hover:bg-amber-700 disabled:opacity-50"
                >
                  <XCircle size={16} />
                  Reject
                </button>
                <button
                  type="button"
                  onClick={() => deleteReview.mutate(review.id)}
                  disabled={deleteReview.isPending}
                  className="btn-danger !px-3 !py-1.5"
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
