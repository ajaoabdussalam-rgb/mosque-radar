import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import Alert from '../components/Alert';

export default function RegisterPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const { register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!name.trim() || !email.trim() || !password) {
      setError('Please fill in all required fields');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters long');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      await register(name.trim(), email.trim(), password);
      navigate('/profile', { replace: true });
    } catch (err) {
      setError(err.message || 'Failed to create account');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="glass-card auth-card">
        <div className="auth-header">
          <div className="auth-icon-circle">
            <span role="img" aria-label="User">🕌</span>
          </div>
          <h2>Create Account</h2>
          <p>Join the Mosque Radar community to submit mosques and track status.</p>
        </div>

        {error && <Alert type="error" message={error} onClose={() => setError(null)} />}

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label className="form-label" htmlFor="reg-name">
              Full Name
            </label>
            <input
              id="reg-name"
              type="text"
              className="form-input"
              placeholder="e.g. Tariq Mansoor"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              autoComplete="name"
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="reg-email">
              Email Address
            </label>
            <input
              id="reg-email"
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
            <label className="form-label" htmlFor="reg-password">
              Password (min. 6 characters)
            </label>
            <input
              id="reg-password"
              type="password"
              className="form-input"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="new-password"
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="reg-confirm-password">
              Confirm Password
            </label>
            <input
              id="reg-confirm-password"
              type="password"
              className="form-input"
              placeholder="••••••••"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              autoComplete="new-password"
            />
          </div>

          <button
            type="submit"
            className="btn btn-primary btn-block"
            disabled={submitting}
          >
            {submitting ? 'Creating Account...' : 'Register Account →'}
          </button>
        </form>

        <div className="auth-footer">
          <p>
            Already have an account?{' '}
            <Link to="/login" className="auth-link">
              Sign in here
            </Link>
          </p>
        </div>
      </div>

      <style>{`
        .auth-container {
          max-width: 460px;
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
