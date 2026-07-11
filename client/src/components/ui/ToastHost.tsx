import { useEffect } from "react";
import type { UiToast } from "@/types/types";
import { useStore } from "@/store/useStore";

const AUTO_DISMISS_MS = 4000;

// Solid, unambiguous colors so a toast reads as feedback regardless of theme.
const TOAST_BG: Record<UiToast["type"], string> = {
  success: "#21c17a",
  error: "#ea5555",
  info: "#635fc7",
};

type ToastProps = {
  toast: UiToast;
  onDismiss: (id: string) => void;
};

function Toast({ toast, onDismiss }: Readonly<ToastProps>) {
  useEffect(() => {
    const timer = window.setTimeout(() => {
      onDismiss(toast.id);
    }, AUTO_DISMISS_MS);
    return () => window.clearTimeout(timer);
  }, [onDismiss, toast.id]);

  return (
    <output
      className="app-toast"
      style={{
        background: TOAST_BG[toast.type],
        color: "#ffffff",
        borderColor: "transparent",
      }}
    >
      <span className="body-m app-toast-message">{toast.message}</span>
      <button
        type="button"
        className="app-toast-dismiss"
        aria-label="Dismiss notification"
        style={{ color: "#ffffff" }}
        onClick={() => onDismiss(toast.id)}
      >
        ×
      </button>
    </output>
  );
}

export function ToastHost() {
  const toasts = useStore((state) => state.toasts);
  const dismissToast = useStore((state) => state.removeToast);

  if (toasts.length === 0) return null;

  return (
    <div className="app-toast-container">
      {toasts.map((toast) => (
        <Toast key={toast.id} toast={toast} onDismiss={dismissToast} />
      ))}
    </div>
  );
}
