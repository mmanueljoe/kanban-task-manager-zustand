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
    <div
      className="app-toast"
      style={{
        minWidth: 240,
        maxWidth: 360,
        padding: '12px 16px',
        borderRadius: 8,
        background,
        color,
        boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.2)',
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'space-between',
        gap: 12,
        border: '1px solid var(--lines)',
      }}
    >
      <span
        className="body-m"
        style={{ marginRight: 8, wordBreak: 'break-word' }}
      >
        {toast.message}
      </span>
      <button
        type="button"
        aria-label="Dismiss notification"
        onClick={() => onDismiss(toast.id)}
        style={{
          border: 'none',
          background: 'transparent',
          color: 'var(--text-muted)',
          cursor: 'pointer',
          fontSize: 14,
          padding: 0,
          lineHeight: 1,
        }}
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
    <div
      style={{
        position: 'fixed',
        right: 16,
        bottom: 16,
        zIndex: 50,
        display: 'flex',
        flexDirection: 'column',
        gap: 8,
      }}
    >
      {toasts.map((toast) => (
        <Toast key={toast.id} toast={toast} onDismiss={dismissToast} />
      ))}
    </div>
  );
}
