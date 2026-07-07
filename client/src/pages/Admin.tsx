import { Button } from "@components/ui/Button";
import { useMe, useLogout } from "@hooks/useAuthQueries";
import { useNavigate } from "react-router";

export function Admin() {
  const { data: user } = useMe();
  const logout = useLogout();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout.mutate(undefined, {
      onSuccess: () => void navigate("/login", { replace: true }),
    });
  };

  return (
    <div className="app-main">
      <h1 className="heading-xl app-section-title">Admin</h1>
      <p className="body-l">Logged in as {user?.name ?? "—"}</p>
      <Button variant="secondary" size="large" onClick={handleLogout}>
        Log out
      </Button>
    </div>
  );
}
