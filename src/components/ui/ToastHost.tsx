import { useEffect } from 'react';
import type { UiToast } from '@/types/types';
import { useStore } from '@/store/useStore';

const AUTO_DISMISS_MS = 4000;

type ToastProps = {
  toast: UiToast;
  onDismiss: (id: string) => void;
};

function Toast({ toast, onDismiss }: ToastProps) {
  useEffect(() => {
    const timer = window.setTimeout(() => {
      onDismiss(toast.id);
    }, AUTO_DISMISS_MS);
    return () => window.clearTimeout(timer);
  }, [onDismiss, toast.id]);

  const background =
    toast.type === 'success'
      ? 'var(--toast-success-bg, var(--bg-main))'
      : toast.type === 'error'
        ? 'var(--toast-error-bg, var(--bg-main))'
        : 'var(--toast-info-bg, var(--bg-main))';

  const color =
    toast.type === 'error' ? 'var(--destructive)' : 'var(--text-primary)';

  return (
    <div className="app-toast" style={{ background, color }}>
      <span className="body-m app-toast-message">{toast.message}</span>
      <button
        type="button"
        className="app-toast-dismiss"
        aria-label="Dismiss notification"
        onClick={() => onDismiss(toast.id)}
      >
        ×
      </button>
    </div>
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
