import { useNavigate } from "react-router";
import { Button } from "@components/ui/Button";
import { ThemeToggle } from "@components/ui/ThemeToggle";
import { PageLoader } from "@components/ui/PageLoader";
import { useMe, useLogout } from "@hooks/useAuthQueries";

export function Account() {
  const { data: user, isPending } = useMe();
  const logout = useLogout();
  const navigate = useNavigate();

  const handleLogout = () =>
    logout.mutate(undefined, {
      onSuccess: () => void navigate("/login", { replace: true }),
    });

  if (isPending) {
    return (
      <div className="app-main">
        <PageLoader label="Loading your account…" />
      </div>
    );
  }

  return (
    <div className="app-main">
      <h1 className="heading-xl app-section-title">Account</h1>

      <div className="app-info-card">
        <div className="app-info-row">
          <span className="body-m app-info-label">Name</span>
          <span className="body-m app-info-value">{user?.name ?? "—"}</span>
        </div>
        <div className="app-info-row">
          <span className="body-m app-info-label">Email</span>
          <span className="body-m app-info-value">{user?.email ?? "—"}</span>
        </div>
        <div className="app-info-row">
          <span className="body-m app-info-label">Role</span>
          <span
            className={`app-user-role ${user?.role === "ADMIN" ? "" : "app-user-role--user"}`}
          >
            {user?.role ?? "—"}
          </span>
        </div>
        <div className="app-info-row" style={{ alignItems: "center" }}>
          <span className="body-m app-info-label">Theme</span>
          <ThemeToggle />
        </div>
      </div>

      <div style={{ marginTop: 24 }}>
        <Button variant="secondary" size="large" onClick={handleLogout}>
          Log out
        </Button>
      </div>
    </div>
  );
}
