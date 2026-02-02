import { ThemeProvider } from '@context/ThemeContext';
import { AuthProvider } from '@context/AuthContext';
import { RouteProvider } from '@routes/RouteProvider';
import { useTheme } from '@hooks/useTheme';
import { BoardsProvider } from '@context/BoardsContext';
import { UiProvider } from '@context/UiContext';
import { ToastHost } from '@components/ui/ToastHost';
import { LoadingOverlay } from '@components/ui/LoadingOverlay';
function AppContent() {
  const { theme } = useTheme();
  return (
    <div data-theme={theme} className="app-root">
      <UiProvider>
        <AuthProvider>
          <BoardsProvider>
            <RouteProvider />
          </BoardsProvider>
        </AuthProvider>
        <LoadingOverlay />
        <ToastHost />
      </UiProvider>
    </div>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AppContent />
    </ThemeProvider>
  );
}
