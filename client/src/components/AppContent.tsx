import { useEffect } from "react";
import { UiProvider } from "@/context/UiContext";
import { useTheme } from "@/hooks/useTheme";
import { RouteProvider } from "@/routes/RouteProvider";
import { LoadingOverlay } from "@/components/ui/LoadingOverlay";
import { ToastHost } from "@/components/ui/ToastHost";

export function AppContent() {
  const { theme } = useTheme();
  // Theme lives on <html> so <body> and everything that inherits its color
  // (e.g. .body-l / .body-m, which set no color of their own) flip too — not
  // just the elements that use var(--text-primary) directly.
  useEffect(() => {
    document.documentElement.dataset.theme = theme;
  }, [theme]);
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
