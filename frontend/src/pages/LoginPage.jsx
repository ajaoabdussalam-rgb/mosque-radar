import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import Alert from '../components/Alert';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const redirectPath = location.state?.from?.pathname || '/';

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Please provide both email and password');
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      await login(email, password);
      navigate(redirectPath, { replace: true });
    } catch (err) {
      setError(err.message || 'Invalid credentials');
    } finally {
      setSubmitting(false);
    }
  };

  const quickFill = (demoEmail, demoPass) => {
    setEmail(demoEmail);
    setPassword(demoPass);
    setError(null);
  };

  return (
    <div className="auth-container">
      <div className="glass-card auth-card">
        <div className="auth-header">
          <div className="auth-icon-circle">
            <span role="img" aria-label="Key">🔐</span>
          </div>
          <h2>Welcome Back</h2>
          <p>Sign in to manage your mosque submissions and access tools.</p>
        </div>

        {error && <Alert type="error" message={error} onClose={() => setError(null)} />}

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label className="form-label" htmlFor="login-email">
              Email Address
            </label>
            <input
              id="login-email"
              type="email"
              className="form-input"
              placeholder="name@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="login-password">
              Password
            </label>
            <input
              id="login-password"
              type="password"
              className="form-input"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
            />
          </div>

          <button
            type="submit"
            className="btn btn-primary btn-block"
            disabled={submitting}
          >
            {submitting ? 'Signing In...' : 'Sign In →'}
          </button>
        </form>

        {/* Quick fill buttons for testing */}
        <div className="demo-credentials">
          <span className="demo-title">Quick Demo Logins</span>
          <div className="demo-buttons">
            <button
              type="button"
              className="demo-btn"
              onClick={() => quickFill('admin@mosqueradar.com', 'Admin123!')}
            >
              👑 Admin
            </button>
            <button
              type="button"
              className="demo-btn"
              onClick={() => quickFill('mod@mosqueradar.com', 'Mod123!')}
            >
              🛡️ Moderator
            </button>
            <button
              type="button"
              className="demo-btn"
              onClick={() => quickFill('user@mosqueradar.com', 'User123!')}
            >
              👤 Regular User
            </button>
          </div>
        </div>

        <div className="auth-footer">
          <p>
            Don't have an account yet?{' '}
            <Link to="/register" className="auth-link">
              Create one here
            </Link>
          </p>
        </div>
      </div>

      <style>{`
        .auth-container {
          max-width: 440px;
          margin: 40px auto;
          padding: 0 16px;
        }

        .auth-card {
          padding: 36px 28px;
        }

        .auth-header {
          text-align: center;
          margin-bottom: 24px;
        }

        .auth-icon-circle {
          width: 56px;
          height: 56px;
          margin: 0 auto 16px auto;
          background: rgba(16, 185, 129, 0.12);
          border: 1px solid rgba(16, 185, 129, 0.3);
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 1.6rem;
        }

        .auth-header h2 {
          font-size: 1.6rem;
          margin-bottom: 6px;
        }

        .auth-header p {
          color: var(--text-secondary);
          font-size: 0.9rem;
        }

        .auth-form {
          margin-bottom: 24px;
        }

        .btn-block {
          width: 100%;
          padding: 13px;
          margin-top: 8px;
          font-size: 1rem;
        }

        .demo-credentials {
          background: rgba(0, 0, 0, 0.25);
          border: 1px dashed var(--border-subtle);
          border-radius: var(--radius-sm);
          padding: 12px;
          margin-bottom: 20px;
          text-align: center;
        }

        .demo-title {
          display: block;
          font-size: 0.76rem;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          color: var(--text-muted);
          margin-bottom: 8px;
          font-weight: 700;
        }

        .demo-buttons {
          display: flex;
          gap: 6px;
          justify-content: center;
          flex-wrap: wrap;
        }

        .demo-btn {
          font-size: 0.78rem;
          padding: 5px 10px;
          background: rgba(255, 255, 255, 0.06);
          border: 1px solid var(--border-subtle);
          border-radius: var(--radius-sm);
          color: var(--text-secondary);
          cursor: pointer;
          transition: all 0.15s;
          font-family: var(--font-body);
        }

        .demo-btn:hover {
          background: rgba(16, 185, 129, 0.15);
          color: var(--primary-500);
          border-color: rgba(16, 185, 129, 0.3);
        }

        .auth-footer {
          text-align: center;
          font-size: 0.88rem;
          color: var(--text-secondary);
          border-top: 1px solid var(--border-subtle);
          padding-top: 16px;
        }

        .auth-link {
          color: var(--primary-500);
          font-weight: 600;
        }

        .auth-link:hover {
          text-decoration: underline;
        }
      `}</style>
    </div>
  );
}
