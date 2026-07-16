import { Navigate } from "react-router";
import { Button } from "@components/ui/Button";
import { PageLoader } from "@components/ui/PageLoader";
import { useMe } from "@hooks/useAuthQueries";
import { useUsers, useSetUserRole } from "@hooks/useAdminQueries";

export function Admin() {
  const { data: me, isPending: mePending } = useMe();
  const isAdmin = me?.role === "ADMIN";
  const { data: users = [], isPending } = useUsers(isAdmin);
  const setRole = useSetUserRole();

  if (mePending) {
    return (
      <div className="app-main">
        <PageLoader label="Loading…" />
      </div>
    );
  }

  // Client-side guard is UX only — the server enforces admin on every endpoint.
  if (!isAdmin) return <Navigate to="/" replace />;

  return (
    <div className="app-main">
      <h1 className="heading-xl app-section-title">Admin · Users</h1>

      {isPending ? (
        <PageLoader label="Loading users…" />
      ) : (
        <div className="app-user-table">
          {users.map((user) => {
            const admin = user.role === "ADMIN";
            const isSelf = user.id === me?.id;
            return (
              <div key={user.id} className="app-user-row">
                <div>
                  <div className="body-m">{user.name}</div>
                  <div
                    className="body-s"
                    style={{ color: "var(--text-muted)" }}
                  >
                    {user.email}
                  </div>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <span
                    className={`app-user-role ${admin ? "" : "app-user-role--user"}`}
                  >
                    {user.role}
                  </span>
                  <Button
                    variant="secondary"
                    size="small"
                    disabled={isSelf || setRole.isPending}
                    onClick={() =>
                      setRole.mutate({
                        userId: user.id,
                        role: admin ? "USER" : "ADMIN",
                      })
                    }
                  >
                    {admin ? "Make user" : "Make admin"}
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
