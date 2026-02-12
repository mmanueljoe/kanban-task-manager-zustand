import { UiProvider } from '@/context/UiContext';
import { useTheme } from '@/hooks/useTheme';
import { StoreHydration } from '@/store/StoreHydration';
import { RouteProvider } from '@/routes/RouteProvider';
import { LoadingOverlay } from '@/components/ui/LoadingOverlay';
import { ToastHost } from '@/components/ui/ToastHost';

export function AppContent() {
  const { theme } = useTheme();
  return (
    <div data-theme={theme} className="app-root">
      <UiProvider>
        <StoreHydration>
          <RouteProvider />
        </StoreHydration>
        <LoadingOverlay />
        <ToastHost />
      </UiProvider>
    </div>
  );
}
