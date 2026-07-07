import { Navigate } from "react-router";
import { useMe } from "@hooks/useAuthQueries";

export function ProtectedRoute({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const { data: user, isPending } = useMe();

  if (isPending) {
    return <div className="app-main">Loading…</div>;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}
