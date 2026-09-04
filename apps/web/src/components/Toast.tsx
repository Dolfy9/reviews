import { useState, useCallback, ReactNode } from "react";
import { CheckCircle2, XCircle, Info, X } from "lucide-react";
import { ToastContext } from "../hooks/useToast";

type ToastType = "success" | "error" | "info";

interface Toast {
  id: number;
  type: ToastType;
  message: string;
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const toast = useCallback((message: string, type: ToastType = "info") => {
    const id = Date.now() + Math.random();
    setToasts((prev) => [...prev, { id, type, message }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  }, []);

  const dismiss = (id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2">
        {toasts.map((t) => (
          <div
            key={t.id}
            className="animate-slide-up flex items-center gap-3 rounded-lg border bg-white px-4 py-3 shadow-lg dark:border-gray-700 dark:bg-gray-800"
          >
            {t.type === "success" && (
              <CheckCircle2 className="text-emerald-500" size={20} />
            )}
            {t.type === "error" && (
              <XCircle className="text-red-500" size={20} />
            )}
            {t.type === "info" && <Info className="text-indigo-500" size={20} />}
            <span className="text-sm text-gray-700 dark:text-gray-200">
              {t.message}
            </span>
            <button
              onClick={() => dismiss(t.id)}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
            >
              <X size={16} />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}
