import { useState, useCallback, ReactNode } from "react";
import { CheckCircle2, XCircle, Info, X, AlertTriangle } from "lucide-react";
import { ToastContext } from "../hooks/useToast";

type ToastType = "success" | "error" | "info" | "warning";

interface Toast {
  id: number;
  type: ToastType;
  message: string;
}

const TOAST_STYLES: Record<
  ToastType,
  { icon: ReactNode; bar: string; ring: string }
> = {
  success: {
    icon: <CheckCircle2 className="text-emerald-500" size={20} />,
    bar: "bg-emerald-500",
    ring: "ring-emerald-200/50 dark:ring-emerald-900/30",
  },
  error: {
    icon: <XCircle className="text-red-500" size={20} />,
    bar: "bg-red-500",
    ring: "ring-red-200/50 dark:ring-red-900/30",
  },
  info: {
    icon: <Info className="text-sky-500" size={20} />,
    bar: "bg-sky-500",
    ring: "ring-sky-200/50 dark:ring-sky-900/30",
  },
  warning: {
    icon: <AlertTriangle className="text-amber-500" size={20} />,
    bar: "bg-amber-500",
    ring: "ring-amber-200/50 dark:ring-amber-900/30",
  },
};

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const toast = useCallback((message: string, type: ToastType = "info") => {
    const id = Date.now() + Math.random();
    setToasts((prev) => [...prev, { id, type, message }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4500);
  }, []);

  const dismiss = (id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2.5">
        {toasts.map((t) => {
          const style = TOAST_STYLES[t.type];
          return (
            <div
              key={t.id}
              className={`glass animate-slide-up flex items-center gap-3 overflow-hidden rounded-xl py-3 pl-4 pr-3 shadow-[0_8px_30px_rgba(14,165,233,0.12)] ring-1 ${style.ring}`}
            >
              <div
                className={`absolute left-0 top-0 h-full w-1 ${style.bar}`}
              />
              <div className="animate-fade-in shrink-0">{style.icon}</div>
              <span className="text-sm font-medium text-slate-700 dark:text-slate-200">
                {t.message}
              </span>
              <button
                onClick={() => dismiss(t.id)}
                className="shrink-0 text-slate-400 transition hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X size={16} />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}
