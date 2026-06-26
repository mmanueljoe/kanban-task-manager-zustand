import { Button } from '@components/ui/Button';
import { useAuth } from '@hooks/useAuth';
import { useNavigate } from 'react-router';

export function Admin() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    void navigate('/login', { replace: true });
  };

  return (
    <div className="app-main">
      <h1 className="heading-xl app-section-title">Admin</h1>
      <p className="body-l">Logged in as {user?.name ?? '—'}</p>
      <Button variant="secondary" size="large" onClick={handleLogout}>
        Log out
      </Button>
    </div>
  );
}
