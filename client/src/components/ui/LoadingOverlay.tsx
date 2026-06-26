import { useStore } from '@/store/useStore';

export function LoadingOverlay() {
  const loadingKeys = useStore((state) => state.loadingKeys);

  if (loadingKeys.length === 0) return null;

  return (
    <div className="app-loading-overlay">
      <div className="app-loading-overlay-panel">
        <span className="app-loading-spinner" />
        <span className="body-m">Loading…</span>
      </div>
    </div>
  );
}
