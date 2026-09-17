import { Navigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import LoadingSpinner from './LoadingSpinner';

/**
 * Route wrapper that ensures the user is authenticated and possesses the required role(s).
 *
 * @param {React.ReactNode} children — Child components to render if authorized
 * @param {string[]} [roles] — Array of allowed roles (e.g. ['moderator', 'admin'])
 */
export default function ProtectedRoute({ children, roles }) {
  const { isAuthenticated, user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div style={{ padding: '80px 20px', textAlign: 'center' }}>
        <LoadingSpinner text="Checking credentials..." />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (roles && !roles.includes(user?.role)) {
    return (
      <div className="glass-card" style={{ maxWidth: '600px', margin: '40px auto', textAlign: 'center', padding: '48px 24px' }}>
        <span style={{ fontSize: '3.5rem', display: 'block', marginBottom: '16px' }} role="img" aria-label="Lock">
          🔒
        </span>
        <h2>Restricted Access</h2>
        <p style={{ color: 'var(--text-secondary)', margin: '12px 0 24px 0', lineHeight: 1.6 }}>
          This section requires <strong>{roles.join(' or ')}</strong> privileges.
          Your current account is registered as <code>{user?.role}</code>.
        </p>
        <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
          <Link to="/" className="btn btn-secondary">
            Return to Radar
          </Link>
          <Link to="/profile" className="btn btn-primary">
            View My Profile
          </Link>
        </div>
      </div>
    );
  }

  return children;
}
