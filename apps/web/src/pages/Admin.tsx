import { useState, useRef, useEffect } from "react";
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
  Download,
  Package,
  Users,
  Star,
  TrendingUp,
  Activity,
  Wifi,
} from "lucide-react";
import {
  adminApi,
  type SourceId,
  SOURCE_LABELS,
  type SourceResult,
  type MiningEvent,
} from "../api/admin";

const SOURCE_OPTIONS: SourceId[] = [
  "all",
  "off",
  "itunes_movies",
  "itunes_podcasts",
  "itunes_apps",
  "openlibrary",
];

interface SourceProgress {
  source: string;
  status: "pending" | "fetching" | "inserting" | "done" | "error";
  fetched: number;
  inserted: number;
  skipped: number;
  processed: number;
  total: number;
}

const STEP_ICONS: Record<string, typeof Activity> = {
  start: TrendingUp,
  fetching: Wifi,
  fetched: Download,
  inserting: Database,
  product_inserted: Package,
  source_done: CheckCircle2,
  source_error: AlertCircle,
  complete: CheckCircle2,
};

const STEP_COLORS: Record<string, string> = {
  start: "text-sky-500",
  fetching: "text-amber-500",
  fetched: "text-sky-500",
  inserting: "text-violet-500",
  product_inserted: "text-emerald-500",
  source_done: "text-emerald-500",
  source_error: "text-red-500",
  complete: "text-emerald-500",
};

export default function Admin() {
  const user = useAuthStore((state) => state.user);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const reviewsQuery = useQuery({
    queryKey: ["admin-reviews", "PENDING"],
    queryFn: () =>
      adminApi.getReviews({ status: "PENDING", page: 1, limit: 20 }),
  });

  const statsQuery = useQuery({
    queryKey: ["admin-stats"],
    queryFn: () => adminApi.getStats(),
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
      queryClient.invalidateQueries({ queryKey: ["admin-stats"] });
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
      queryClient.invalidateQueries({ queryKey: ["admin-stats"] });
      toast("Review deleted", "success");
    },
    onError: (err) => toast(friendlyErrorMessage(err), "error"),
  });

  const [selectedSource, setSelectedSource] = useState<SourceId>("all");
  const [sourceMenuOpen, setSourceMenuOpen] = useState(false);
  const [isMining, setIsMining] = useState(false);
  const [events, setEvents] = useState<MiningEvent[]>([]);
  const [sourceProgress, setSourceProgress] = useState<
    Record<string, SourceProgress>
  >({});
  const eventSourceRef = useRef<EventSource | null>(null);
  const logEndRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    return () => {
      eventSourceRef.current?.close();
    };
  }, []);

  const handleMining = () => {
    setIsMining(true);
    setEvents([]);
    setSourceProgress({});

    const es = adminApi.seedStream(selectedSource, 100);
    eventSourceRef.current = es;

    es.onmessage = (e) => {
      try {
        const event: MiningEvent = JSON.parse(e.data);
        setEvents((prev) => [...prev, event]);

        if (event.source) {
          setSourceProgress((prev) => {
            const existing = prev[event.source!] ?? {
              source: event.source!,
              status: "pending",
              fetched: 0,
              inserted: 0,
              skipped: 0,
              processed: 0,
              total: 0,
            };
            const updated = { ...existing };

            if (event.step === "fetching") updated.status = "fetching";
            if (event.step === "fetched" && event.data?.count) {
              updated.status = "inserting";
              updated.fetched = event.data.count as number;
              updated.total = event.data.count as number;
            }
            if (event.step === "inserting" && event.data?.total) {
              updated.total = event.data.total as number;
            }
            if (event.step === "product_inserted" && event.data) {
              updated.processed =
                (event.data.processed as number | undefined) ??
                updated.processed;
              updated.inserted = event.data.inserted as number;
              updated.skipped = event.data.skipped as number;
            }
            if (event.step === "source_done" && event.data) {
              updated.status = "done";
              updated.fetched = event.data.fetched as number;
              updated.inserted = event.data.inserted as number;
              updated.skipped = event.data.skipped as number;
              updated.processed = updated.total;
            }
            if (event.step === "source_error") updated.status = "error";

            return { ...prev, [event.source!]: updated };
          });
        }

        if (event.step === "complete") {
          setIsMining(false);
          es.close();
          eventSourceRef.current = null;
          queryClient.invalidateQueries({ queryKey: ["admin-stats"] });
          queryClient.invalidateQueries({ queryKey: ["products"] });
          const results =
            (event.data?.results as SourceResult[] | undefined) ?? [];
          const totalInserted = results.reduce(
            (s, r) => s + (r.inserted ?? 0),
            0,
          );
          toast(
            `Mining complete: ${totalInserted} products inserted`,
            "success",
          );
        }
      } catch {
        // ignore parse errors
      }
    };

    es.onerror = () => {
      setIsMining(false);
      es.close();
      eventSourceRef.current = null;
      toast("Mining stream disconnected", "error");
    };
  };

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
  const stats = statsQuery.data;
  const totalInserted = Object.values(sourceProgress).reduce(
    (s, r) => s + r.inserted,
    0,
  );
  const totalFetched = Object.values(sourceProgress).reduce(
    (s, r) => s + r.fetched,
    0,
  );
  const totalSkipped = Object.values(sourceProgress).reduce(
    (s, r) => s + r.skipped,
    0,
  );

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-sky-500 to-cyan-500 shadow-[0_4px_14px_rgba(14,165,233,0.25)]">
            <Shield className="text-white" size={22} />
          </div>
          <div>
            <h1 className="text-2xl font-extrabold tracking-tight">
              Admin Dashboard
            </h1>
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
              disabled={isMining}
              className="btn-secondary !py-2.5 disabled:opacity-50"
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
            onClick={handleMining}
            disabled={isMining}
            className="btn-primary"
          >
            {isMining ? (
              <Loader2 className="animate-spin" size={18} />
            ) : (
              <Database size={18} />
            )}
            {isMining ? "Mining..." : "Mine Products"}
          </button>
        </div>
      </div>

      {/* Stats cards */}
      {stats && (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          {[
            {
              label: "Products",
              value: stats.products,
              icon: Package,
              color: "from-sky-500 to-cyan-500",
            },
            {
              label: "Reviews",
              value: stats.reviews,
              icon: Star,
              color: "from-amber-500 to-orange-500",
            },
            {
              label: "Users",
              value: stats.users,
              icon: Users,
              color: "from-violet-500 to-purple-500",
            },
            {
              label: "Pending",
              value: stats.pendingReviews,
              icon: Clock,
              color: "from-rose-500 to-pink-500",
            },
          ].map((stat) => (
            <div key={stat.label} className="card animate-slide-up p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-400 dark:text-slate-500">
                    {stat.label}
                  </p>
                  <p className="mt-1 text-2xl font-extrabold tracking-tight">
                    {stat.value.toLocaleString()}
                  </p>
                </div>
                <div
                  className={`flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br ${stat.color} shadow-lg`}
                >
                  <stat.icon className="text-white" size={18} />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Category breakdown */}
      {stats && stats.byCategory.length > 0 && (
        <div className="card animate-slide-up p-5">
          <h3 className="mb-4 text-sm font-bold tracking-tight text-slate-600 dark:text-slate-400">
            Products by Category
          </h3>
          <div className="flex flex-wrap gap-2">
            {stats.byCategory.map((cat) => (
              <span
                key={cat.category}
                className="inline-flex items-center gap-2 rounded-lg bg-slate-100 px-3 py-1.5 text-sm font-medium text-slate-600 dark:bg-slate-800 dark:text-slate-400"
              >
                {cat.category}
                <span className="rounded-md bg-slate-200 px-1.5 py-0.5 text-xs font-bold text-slate-700 dark:bg-slate-700 dark:text-slate-300">
                  {cat._count}
                </span>
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Mining dashboard */}
      {isMining || events.length > 0 ? (
        <div className="card animate-slide-up overflow-hidden">
          <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4 dark:border-slate-800">
            <div className="flex items-center gap-2.5">
              <Activity
                className={
                  isMining ? "animate-pulse text-sky-500" : "text-emerald-500"
                }
                size={20}
              />
              <h3 className="text-sm font-bold tracking-tight">
                Mining Dashboard
              </h3>
              {isMining && (
                <span className="flex items-center gap-1 text-xs font-medium text-sky-500">
                  <span className="h-2 w-2 animate-pulse rounded-full bg-sky-500" />
                  Live
                </span>
              )}
            </div>
            <div className="flex items-center gap-4 text-sm">
              <span className="font-semibold text-slate-600 dark:text-slate-400">
                Fetched: <span className="text-sky-500">{totalFetched}</span>
              </span>
              <span className="font-semibold text-slate-600 dark:text-slate-400">
                Inserted:{" "}
                <span className="text-emerald-500">{totalInserted}</span>
              </span>
              <span className="font-semibold text-slate-600 dark:text-slate-400">
                Skipped: <span className="text-amber-500">{totalSkipped}</span>
              </span>
            </div>
          </div>

          {/* Per-source progress */}
          {Object.keys(sourceProgress).length > 0 && (
            <div className="space-y-3 border-b border-slate-100 px-5 py-4 dark:border-slate-800">
              {Object.values(sourceProgress).map((sp) => {
                const pct =
                  sp.status === "done"
                    ? 100
                    : sp.total > 0
                      ? Math.min(
                          100,
                          Math.round((sp.processed / sp.total) * 100),
                        )
                      : 0;
                return (
                  <div key={sp.source}>
                    <div className="mb-1.5 flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-slate-700 dark:text-slate-300">
                          {SOURCE_LABELS[sp.source as SourceId] ?? sp.source}
                        </span>
                        {sp.status === "fetching" && (
                          <span className="flex items-center gap-1 text-xs text-amber-500">
                            <Loader2 className="animate-spin" size={12} />{" "}
                            Fetching...
                          </span>
                        )}
                        {sp.status === "inserting" && (
                          <span className="flex items-center gap-1 text-xs text-violet-500">
                            <Loader2 className="animate-spin" size={12} />{" "}
                            Inserting...
                          </span>
                        )}
                        {sp.status === "done" && (
                          <span className="flex items-center gap-1 text-xs text-emerald-500">
                            <CheckCircle2 size={12} /> Done
                          </span>
                        )}
                        {sp.status === "error" && (
                          <span className="flex items-center gap-1 text-xs text-red-500">
                            <AlertCircle size={12} /> Error
                          </span>
                        )}
                      </div>
                      <span className="text-xs font-medium text-slate-400">
                        {sp.status === "done"
                          ? `${sp.total}/${sp.total} (100%)`
                          : `${sp.processed}/${sp.total} (${pct}%)`}
                      </span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${
                          sp.status === "error"
                            ? "bg-red-500"
                            : sp.status === "done"
                              ? "bg-emerald-500"
                              : "bg-gradient-to-r from-sky-500 to-cyan-500"
                        }`}
                        style={{
                          width: `${sp.status === "fetching" ? 5 : pct}%`,
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Live event log */}
          <div className="max-h-64 overflow-y-auto px-5 py-4">
            <div className="space-y-1.5 font-mono text-xs">
              {events.map((event, idx) => {
                const Icon = STEP_ICONS[event.step] ?? Activity;
                const color = STEP_COLORS[event.step] ?? "text-slate-400";
                return (
                  <div key={idx} className="flex items-start gap-2">
                    <span className="shrink-0 text-slate-300 dark:text-slate-600">
                      {new Date(event.timestamp).toLocaleTimeString()}
                    </span>
                    <Icon className={`shrink-0 ${color}`} size={13} />
                    <span className="text-slate-600 dark:text-slate-400">
                      {event.source && (
                        <span className="font-semibold text-slate-700 dark:text-slate-300">
                          [
                          {SOURCE_LABELS[event.source as SourceId] ??
                            event.source}
                          ]{" "}
                        </span>
                      )}
                      {event.message}
                    </span>
                  </div>
                );
              })}
              <div ref={logEndRef} />
            </div>
          </div>
        </div>
      ) : null}

      {/* Error states */}
      {reviewsQuery.isError && (
        <div className="flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/30 dark:text-red-400">
          <AlertCircle size={18} />
          Failed to load reviews.
        </div>
      )}

      {/* Reviews moderation */}
      <div className="space-y-4">
        <div className="flex items-center gap-2.5">
          <Clock className="text-amber-500" size={20} />
          <h2 className="text-lg font-bold tracking-tight">
            Pending Reviews{" "}
            <span className="text-sm font-normal text-slate-400 dark:text-slate-500">
              ({pendingCount})
            </span>
          </h2>
        </div>
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
                  <h3 className="font-bold tracking-tight text-slate-800 dark:text-slate-200">
                    {review.title}
                  </h3>
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
    </div>
  );
}
