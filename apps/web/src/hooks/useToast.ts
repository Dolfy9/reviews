import { useContext, createContext } from "react";

export interface ToastContextValue {
  toast: (message: string, type?: "success" | "error" | "info") => void;
}

export const ToastContext = createContext<ToastContextValue | null>(null);

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within ToastProvider");
  return ctx;
}
