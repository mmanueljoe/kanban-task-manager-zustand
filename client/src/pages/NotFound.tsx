import { Link } from 'react-router';
import { Button } from '@components/ui/Button';

export function NotFound() {
  return (
    <div className="app-main">
      <h1 className="heading-xl app-section-title">Page not found</h1>
      <p className="body-l">The page you’re looking for doesn’t exist.</p>
      <Link to="/">
        <Button variant="primary" size="large">
          Go to Dashboard
        </Button>
      </Link>
    </div>
  );
}
