import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { api } from '../services/api';
import Badge from '../components/Badge';
import LoadingSpinner from '../components/LoadingSpinner';
import MosqueSkeleton from '../components/MosqueSkeleton';

export default function ProfilePage() {
  const { user, logout, isModerator, isAdmin } = useAuth();
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let ignore = false;

    async function fetchSubmissions() {
      setLoading(true);
      setError(null);
      try {
        const res = await api.getMySubmissions();
        if (!ignore && res.success) {
          setSubmissions(res.data || []);
        }
      } catch (err) {
        if (!ignore) {
          setError(err.message || 'Failed to load submissions');
        }
      } finally {
        if (!ignore) {
          setLoading(false);
        }
      }
    }

    fetchSubmissions();

    return () => {
      ignore = true;
    };
  }, []);

  const getStatusBadge = (status) => {
    switch (status) {
      case 'verified':
        return <Badge variant="verified" icon="✓">Verified</Badge>;
      case 'rejected':
        return <Badge variant="rejected" icon="✕">Rejected</Badge>;
      default:
        return <Badge variant="pending" icon="⏳">Under Review</Badge>;
    }
  };

  return (
    <div className="profile-page">
      {/* User Info Header */}
      <div className="profile-header glass-card">
        <div className="profile-info-row">
          <div className="avatar-circle">
            <span>{user?.name ? user.name.charAt(0).toUpperCase() : 'U'}</span>
          </div>

          <div className="profile-details">
            <div className="name-role-row">
              <h2>{user?.name}</h2>
              {isAdmin ? (
                <span className="role-pill role-admin">👑 Administrator</span>
              ) : isModerator ? (
                <span className="role-pill role-mod">🛡️ Moderator</span>
              ) : (
                <span className="role-pill role-user">👤 Community Member</span>
              )}
            </div>
            <p className="profile-email">{user?.email}</p>
            <p className="profile-joined">
              Member since {user?.createdAt ? new Date(user.createdAt).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' }) : 'recently'}
            </p>
          </div>

          <div className="profile-actions">
            <Link to="/submit" className="btn btn-primary">
              + Submit Mosque
            </Link>
            {isModerator && (
              <Link to="/moderation" className="btn btn-secondary">
                Review Queue 🛡️
              </Link>
            )}
            <button
              type="button"
              onClick={logout}
              className="btn btn-danger"
              title="Sign out of Mosque Radar"
            >
              Sign Out
            </button>
          </div>
        </div>
      </div>

      {/* Submissions Section */}
      <div className="submissions-section">
        <div className="section-header">
          <div>
            <h3>My Mosque Submissions</h3>
            <p className="section-sub">
              Track the verification status of mosques you have contributed to Mosque Radar.
            </p>
          </div>
          <span className="submissions-count">
            {submissions.length} {submissions.length === 1 ? 'submission' : 'submissions'}
          </span>
        </div>

        {error && (
          <div className="alert alert-error" style={{ marginBottom: '24px' }}>
            <span>⚠️</span> {error}
          </div>
        )}

        {loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <LoadingSpinner text="Retrieving your submissions..." />
            <MosqueSkeleton count={2} />
          </div>
        ) : submissions.length > 0 ? (
          <div className="submissions-list">
            {submissions.map((mosque) => (
              <div key={mosque._id} className="submission-card glass-card">
                <div className="submission-main">
                  <div className="submission-header-row">
                    <h4 className="submission-title">
                      <Link to={`/mosque/${mosque._id}`}>{mosque.name}</Link>
                    </h4>
                    {getStatusBadge(mosque.status)}
                  </div>

                  <p className="submission-address">🗺️ {mosque.address}</p>

                  <div className="submission-meta">
                    <span>
                      Submitted on {new Date(mosque.createdAt).toLocaleDateString()}
                    </span>
                    {mosque.location?.coordinates && (
                      <span className="meta-coords">
                        GPS: {mosque.location.coordinates[1].toFixed(4)}, {mosque.location.coordinates[0].toFixed(4)}
                      </span>
                    )}
                  </div>

                  {mosque.status === 'rejected' && mosque.rejectionReason && (
                    <div className="rejection-box">
                      <strong>Reason: </strong> {mosque.rejectionReason}
                    </div>
                  )}
                </div>

                <div className="submission-links">
                  <Link to={`/mosque/${mosque._id}`} className="btn btn-secondary btn-sm">
                    View Details →
                  </Link>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="empty-state glass-card">
            <span className="empty-icon" role="img" aria-label="Mosque">🕌</span>
            <h4>No Submissions Yet</h4>
            <p>
              You haven't submitted any mosques yet. Help the community by adding mosques and prayer facilities in your area!
            </p>
            <Link to="/submit" className="btn btn-primary" style={{ marginTop: '16px' }}>
              + Submit a Mosque
            </Link>
          </div>
        )}
      </div>

      <style>{`
        .profile-page {
          max-width: 900px;
          margin: 0 auto;
        }

        .profile-header {
          padding: 28px;
          margin-bottom: 36px;
        }

        .profile-info-row {
          display: flex;
          align-items: center;
          gap: 24px;
          flex-wrap: wrap;
        }

        .avatar-circle {
          width: 72px;
          height: 72px;
          border-radius: 50%;
          background: linear-gradient(135deg, var(--primary-500) 0%, var(--primary-800) 100%);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 2rem;
          font-weight: 800;
          color: white;
          box-shadow: 0 4px 16px rgba(16, 185, 129, 0.35);
          flex-shrink: 0;
        }

        .profile-details {
          flex: 1;
          min-width: 220px;
        }

        .name-role-row {
          display: flex;
          align-items: center;
          gap: 12px;
          flex-wrap: wrap;
          margin-bottom: 4px;
        }

        .name-role-row h2 {
          margin: 0;
          font-size: 1.5rem;
        }

        .role-pill {
          font-size: 0.76rem;
          font-weight: 700;
          padding: 3px 10px;
          border-radius: var(--radius-full);
          text-transform: uppercase;
          letter-spacing: 0.04em;
        }

        .role-admin {
          background: rgba(245, 158, 11, 0.2);
          color: #fbbf24;
          border: 1px solid rgba(245, 158, 11, 0.4);
        }

        .role-mod {
          background: rgba(59, 130, 246, 0.2);
          color: #60a5fa;
          border: 1px solid rgba(59, 130, 246, 0.4);
        }

        .role-user {
          background: rgba(16, 185, 129, 0.15);
          color: #34d399;
          border: 1px solid rgba(16, 185, 129, 0.3);
        }

        .profile-email {
          color: var(--text-secondary);
          font-size: 0.95rem;
          margin: 0 0 4px 0;
        }

        .profile-joined {
          color: var(--text-muted);
          font-size: 0.82rem;
          margin: 0;
        }

        .profile-actions {
          display: flex;
          gap: 10px;
          align-items: center;
          flex-wrap: wrap;
        }

        .section-header {
          display: flex;
          align-items: baseline;
          justify-content: space-between;
          margin-bottom: 20px;
          flex-wrap: wrap;
          gap: 12px;
        }

        .section-header h3 {
          font-size: 1.3rem;
          margin-bottom: 4px;
        }

        .section-sub {
          color: var(--text-secondary);
          font-size: 0.88rem;
          margin: 0;
        }

        .submissions-count {
          font-size: 0.85rem;
          color: var(--text-muted);
          font-weight: 600;
          background: rgba(255, 255, 255, 0.06);
          padding: 4px 12px;
          border-radius: var(--radius-full);
          border: 1px solid var(--border-subtle);
        }

        .submissions-list {
          display: flex;
          flex-direction: column;
          gap: 14px;
        }

        .submission-card {
          padding: 20px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 20px;
          flex-wrap: wrap;
        }

        .submission-main {
          flex: 1;
          min-width: 260px;
        }

        .submission-header-row {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 6px;
          flex-wrap: wrap;
        }

        .submission-title {
          font-size: 1.1rem;
          margin: 0;
        }

        .submission-title a {
          color: var(--text-primary);
          text-decoration: none;
        }

        .submission-title a:hover {
          color: var(--primary-500);
        }

        .submission-address {
          font-size: 0.88rem;
          color: var(--text-secondary);
          margin-bottom: 8px;
        }

        .submission-meta {
          display: flex;
          gap: 16px;
          font-size: 0.8rem;
          color: var(--text-muted);
          flex-wrap: wrap;
        }

        .meta-coords {
          font-family: monospace;
          background: rgba(0, 0, 0, 0.2);
          padding: 2px 6px;
          border-radius: 4px;
        }

        .rejection-box {
          margin-top: 10px;
          padding: 8px 12px;
          background: rgba(239, 68, 68, 0.12);
          border-left: 3px solid #ef4444;
          border-radius: var(--radius-sm);
          font-size: 0.82rem;
          color: #fca5a5;
        }

        .btn-sm {
          padding: 8px 14px;
          font-size: 0.85rem;
        }

        .empty-state {
          text-align: center;
          padding: 50px 20px;
        }

        .empty-icon {
          font-size: 2.8rem;
          display: block;
          margin-bottom: 12px;
        }

        .empty-state h4 {
          margin-bottom: 8px;
        }

        .empty-state p {
          color: var(--text-secondary);
          max-width: 440px;
          margin: 0 auto;
        }

        @media (max-width: 640px) {
          .profile-info-row {
            flex-direction: column;
            text-align: center;
          }

          .name-role-row {
            justify-content: center;
          }

          .profile-actions {
            justify-content: center;
            width: 100%;
          }

          .submission-card {
            flex-direction: column;
            align-items: flex-start;
          }

          .submission-links {
            width: 100%;
          }

          .submission-links a {
            width: 100%;
            text-align: center;
          }
        }
      `}</style>
    </div>
  );
}
