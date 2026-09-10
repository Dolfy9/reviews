import { ReactNode } from "react";
import { PackageOpen, MessageSquareOff, SearchX } from "lucide-react";

interface EmptyStateProps {
  icon?: "package" | "reviews" | "search";
  title: string;
  description?: string;
  action?: ReactNode;
}

const icons = {
  package: PackageOpen,
  reviews: MessageSquareOff,
  search: SearchX,
};

export function EmptyState({
  icon = "package",
  title,
  description,
  action,
}: EmptyStateProps) {
  const Icon = icons[icon];
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-sky-200 py-20 dark:border-sky-900/30">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-sky-50 dark:bg-sky-950/30">
        <Icon className="text-sky-400" size={32} />
      </div>
      <h3 className="mt-4 text-lg font-bold tracking-tight text-slate-700 dark:text-slate-300">
        {title}
      </h3>
      {description && (
        <p className="mt-1.5 text-sm text-slate-500 dark:text-slate-400">
          {description}
        </p>
      )}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}
