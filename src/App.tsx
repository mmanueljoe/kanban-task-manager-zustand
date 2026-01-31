import { ThemeProvider } from '@context/ThemeContext';
import { AuthProvider } from '@context/AuthContext';
import { RouteProvider } from '@routes/RouteProvider';
import { useTheme } from '@hooks/useTheme';
function AppContent() {
  const { theme } = useTheme();
  return (
    <div data-theme={theme} className="app-root">
      <AuthProvider>
        <RouteProvider />
      </AuthProvider>
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
