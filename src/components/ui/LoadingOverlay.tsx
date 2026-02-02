import { useUi } from '@hooks/useUi';

export function LoadingOverlay() {
  const { isLoading } = useUi();

  if (!isLoading()) return null;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.35)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 40,
      }}
    >
      <div
        style={{
          padding: '16px 20px',
          borderRadius: 999,
          backgroundColor: 'var(--bg-main)',
          color: 'var(--text-primary)',
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.2)',
        }}
      >
        <span
          style={{
            width: 16,
            height: 16,
            borderRadius: '999px',
            border: '2px solid var(--lines)',
            borderTopColor: 'var(--accent, var(--primary, #635FC7))',
            animation: 'app-spinner 0.8s linear infinite',
          }}
        />
        <span className="body-m">Loading…</span>
      </div>
    </div>
  );
}
