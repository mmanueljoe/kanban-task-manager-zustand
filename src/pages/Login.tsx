import { useNavigate } from 'react-router';
import { Button } from '@components/ui/Button';
import { useAuth } from '@hooks/useAuth';

export function Login() {
  const navigate = useNavigate();
  const { login } = useAuth();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    login({
      id: '1',
      name: 'Demo User',
      email: 'demo@example.com',
    });
    void navigate('/', { replace: true });
  };

  return (
    <div className="app-main">
      <h1 className="heading-xl app-section-title">Log in</h1>
      <form onSubmit={handleSubmit} className="app-stack-4 app-login-form">
        <Button type="submit" variant="primary" size="large">
          Log in (mock)
        </Button>
      </form>
    </div>
  );
}
