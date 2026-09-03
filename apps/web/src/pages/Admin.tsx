import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { adminApi } from "../api/admin";
import { useAuthStore } from "../store/authStore";

export default function Admin() {
  const user = useAuthStore((state) => state.user);
  const queryClient = useQueryClient();

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
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["admin-reviews"] }),
  });

  const deleteReview = useMutation({
    mutationFn: (id: string) => adminApi.deleteReview(id),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["admin-reviews"] }),
  });

  if (!user || user.role !== "ADMIN") {
    return <p>You must be an admin.</p>;
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Pending reviews</h1>
      {reviewsQuery.isLoading ? (
        <p>Loading...</p>
      ) : reviewsQuery.data?.data.length ? (
        <div className="space-y-4">
          {reviewsQuery.data.data.map((review) => (
            <div key={review.id} className="rounded-lg border bg-white p-4">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold">{review.title}</h3>
                <span className="text-sm text-gray-500">{review.status}</span>
              </div>
              <p className="mt-2 text-sm text-gray-700">{review.content}</p>
              <div className="mt-3 flex gap-2">
                <button
                  type="button"
                  onClick={() =>
                    updateStatus.mutate({ id: review.id, status: "APPROVED" })
                  }
                  className="rounded-md bg-green-600 px-3 py-1 text-sm text-white hover:bg-green-700"
                >
                  Approve
                </button>
                <button
                  type="button"
                  onClick={() =>
                    updateStatus.mutate({ id: review.id, status: "REJECTED" })
                  }
                  className="rounded-md bg-yellow-600 px-3 py-1 text-sm text-white hover:bg-yellow-700"
                >
                  Reject
                </button>
                <button
                  type="button"
                  onClick={() => deleteReview.mutate(review.id)}
                  className="rounded-md bg-red-600 px-3 py-1 text-sm text-white hover:bg-red-700"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-gray-500">No pending reviews.</p>
      )}
    </div>
  );
}
