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

export function EmptyState({ icon = "package", title, description, action }: EmptyStateProps) {
  const Icon = icons[icon];
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-gray-300 py-16 dark:border-gray-700">
      <Icon className="text-gray-300 dark:text-gray-600" size={48} />
      <h3 className="mt-4 text-lg font-semibold text-gray-700 dark:text-gray-300">
        {title}
      </h3>
      {description && (
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          {description}
        </p>
      )}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
