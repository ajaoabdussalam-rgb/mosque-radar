import { useState, useEffect } from 'react';
import { api } from '../services/api';
import LoadingSpinner from '../components/LoadingSpinner';

export default function ModerationPage() {
  const [queue, setQueue] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actionFeedback, setActionFeedback] = useState(null);

  // Rejection modal state
  const [rejectModalMosque, setRejectModalMosque] = useState(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [processingId, setProcessingId] = useState(null);

  const fetchQueue = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.getModerationQueue();
      setQueue(res.data || []);
    } catch (err) {
      setError(err.message || 'Failed to load moderation queue');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQueue();
  }, []);

  const handleApprove = async (id, name) => {
    try {
      setProcessingId(id);
      await api.verifyMosque(id, {
        status: 'verified',
        verifiedBy: 'Community Moderator'
      });
      setActionFeedback(`Approved "${name}" — now live on public radar!`);
      setQueue((prev) => prev.filter((m) => m._id !== id));
    } catch (err) {
      setError(`Failed to approve: ${err.message}`);
    } finally {
      setProcessingId(null);
    }
  };

  const handleConfirmReject = async (e) => {
    e.preventDefault();
    if (!rejectModalMosque || !rejectionReason.trim()) return;

    try {
      setProcessingId(rejectModalMosque._id);
      await api.verifyMosque(rejectModalMosque._id, {
        status: 'rejected',
        rejectionReason: rejectionReason.trim(),
        verifiedBy: 'Community Moderator'
      });
      setActionFeedback(`Rejected "${rejectModalMosque.name}".`);
      setQueue((prev) => prev.filter((m) => m._id !== rejectModalMosque._id));
      setRejectModalMosque(null);
      setRejectionReason('');
    } catch (err) {
      setError(`Failed to reject: ${err.message}`);
    } finally {
      setProcessingId(null);
    }
  };

  return (
    <div className="moderation-page">
      <div className="moderation-header">
        <h1>Moderation Queue</h1>
        <p className="moderation-sub">
          Review community-submitted mosques before publishing them to the public radar.
        </p>
      </div>

      {actionFeedback && (
        <div className="alert alert-success">
          <span>✓ {actionFeedback}</span>
          <button
            onClick={() => setActionFeedback(null)}
            style={{ marginLeft: 'auto', background: 'transparent', border: 'none', color: 'inherit', cursor: 'pointer' }}
          >
            ✕
          </button>
        </div>
      )}

      {error && <div className="alert alert-error">{error}</div>}

      {loading ? (
        <LoadingSpinner text="Fetching pending submissions..." />
      ) : queue.length > 0 ? (
        <div className="queue-list">
          {queue.map((mosque) => {
            const lat = mosque.location?.coordinates?.[1];
            const lng = mosque.location?.coordinates?.[0];
            const isProcessing = processingId === mosque._id;

            return (
              <div key={mosque._id} className="queue-item glass-card">
                <div className="queue-media">
                  {mosque.images && mosque.images.length > 0 ? (
                    <img src={mosque.images[0]} alt={mosque.name} className="queue-img" />
                  ) : (
                    <div className="queue-no-img">🕌</div>
                  )}
                </div>

                <div className="queue-info">
                  <div className="queue-top">
                    <span className="badge badge-pending">Pending Review</span>
                    <span className="queue-date">
                      Submitted: {new Date(mosque.createdAt).toLocaleDateString()}
                    </span>
                  </div>

                  <h3 className="queue-title">{mosque.name}</h3>
                  <p className="queue-address">📍 {mosque.address}</p>
                  <p className="queue-coords">
                    Coordinates: <code>{lat?.toFixed(5)}, {lng?.toFixed(5)}</code>
                  </p>
                  <p className="queue-submitter">
                    By: <strong>{mosque.submittedBy || 'Anonymous'}</strong>
                  </p>
                </div>

                <div className="queue-actions">
                  <button
                    disabled={isProcessing}
                    onClick={() => handleApprove(mosque._id, mosque.name)}
                    className="btn btn-primary btn-sm"
                  >
                    ✓ Approve & Publish
                  </button>

                  <button
                    disabled={isProcessing}
                    onClick={() => {
                      setRejectModalMosque(mosque);
                      setRejectionReason('');
                    }}
                    className="btn btn-danger btn-sm"
                  >
                    ✕ Reject
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="empty-state glass-card">
          <span className="empty-icon">🎉</span>
          <h3>Moderation Queue is Empty!</h3>
          <p>All community submissions have been reviewed and verified.</p>
        </div>
      )}

      {/* Reject Modal */}
      {rejectModalMosque && (
        <div className="modal-overlay">
          <div className="modal-box glass-card">
            <h3>Reject Submission</h3>
            <p className="modal-desc">
              Please provide a reason for rejecting <strong>"{rejectModalMosque.name}"</strong>.
            </p>

            <form onSubmit={handleConfirmReject}>
              <div className="form-group">
                <label className="form-label" htmlFor="reason">
                  Rejection Reason *
                </label>
                <textarea
                  id="reason"
                  rows="3"
                  className="form-textarea"
                  placeholder="e.g. Duplicate submission, invalid coordinates, or non-mosque facility."
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  required
                />
              </div>

              <div className="modal-actions">
                <button
                  type="button"
                  onClick={() => setRejectModalMosque(null)}
                  className="btn btn-secondary"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={processingId === rejectModalMosque._id}
                  className="btn btn-danger"
                >
                  Confirm Rejection
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <style>{`
        .moderation-header {
          margin-bottom: 28px;
        }

        .moderation-sub {
          color: var(--text-secondary);
          margin-top: 6px;
        }

        .queue-list {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .queue-item {
          display: grid;
          grid-template-columns: 140px 1fr auto;
          gap: 20px;
          align-items: center;
          padding: 16px 20px;
        }

        .queue-media {
          width: 140px;
          height: 110px;
          border-radius: var(--radius-sm);
          overflow: hidden;
          background: #0d131f;
        }

        .queue-img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .queue-no-img {
          display: flex;
          align-items: center;
          justify-content: center;
          height: 100%;
          font-size: 2.5rem;
          color: var(--text-muted);
        }

        .queue-info {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .queue-top {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 4px;
        }

        .queue-date {
          font-size: 0.8rem;
          color: var(--text-muted);
        }

        .queue-title {
          font-size: 1.2rem;
          margin: 0;
        }

        .queue-address {
          font-size: 0.9rem;
          color: var(--text-secondary);
        }

        .queue-coords code {
          font-family: monospace;
          background: rgba(255, 255, 255, 0.05);
          padding: 2px 6px;
          border-radius: 4px;
          color: #34d399;
          font-size: 0.85rem;
        }

        .queue-submitter {
          font-size: 0.8rem;
          color: var(--text-muted);
        }

        .queue-actions {
          display: flex;
          flex-direction: column;
          gap: 10px;
        }

        .modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.7);
          backdrop-filter: blur(8px);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 200;
          padding: 20px;
        }

        .modal-box {
          max-width: 480px;
          width: 100%;
          background: #111827;
          padding: 28px;
        }

        .modal-desc {
          color: var(--text-secondary);
          margin: 10px 0 20px 0;
          font-size: 0.95rem;
        }

        .modal-actions {
          display: flex;
          justify-content: flex-end;
          gap: 12px;
          margin-top: 20px;
        }

        @media (max-width: 768px) {
          .queue-item {
            grid-template-columns: 1fr;
            text-align: left;
          }
          .queue-media {
            width: 100%;
            height: 160px;
          }
          .queue-actions {
            flex-direction: row;
          }
        }
      `}</style>
    </div>
  );
}
