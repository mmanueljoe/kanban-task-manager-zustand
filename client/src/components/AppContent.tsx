import { UiProvider } from "@/context/UiContext";
import { useTheme } from "@/hooks/useTheme";
import { RouteProvider } from "@/routes/RouteProvider";
import { LoadingOverlay } from "@/components/ui/LoadingOverlay";
import { ToastHost } from "@/components/ui/ToastHost";

export function AppContent() {
  const { theme } = useTheme();
  return (
    <div data-theme={theme} className="app-root">
      <UiProvider>
        <RouteProvider />
        <LoadingOverlay />
        <ToastHost />
      </UiProvider>
    </div>
  );
}
