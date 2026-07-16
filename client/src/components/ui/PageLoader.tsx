export function PageLoader({ label = "Loading…" }: { label?: string }) {
  return (
    <div className="app-page-loader">
      <span className="app-loading-spinner" />
      <span className="body-m">{label}</span>
    </div>
  );
}
