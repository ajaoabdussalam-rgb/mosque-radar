import { useState, useEffect, useCallback } from 'react';
import { api } from '../services/api';
import LoadingSpinner from '../components/LoadingSpinner';
import Alert from '../components/Alert';
import Badge from '../components/Badge';
import Modal from '../components/Modal';

export default function ModerationPage() {
  const [queue, setQueue] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actionFeedback, setActionFeedback] = useState(null);

  // Rejection modal state
  const [rejectModalMosque, setRejectModalMosque] = useState(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [processingId, setProcessingId] = useState(null);

  const fetchQueue = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.getModerationQueue();
      setQueue(res.data || []);
    } catch (err) {
      setError(err.message || 'Failed to load moderation queue');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let ignore = false;

    async function loadQueue() {
      try {
        const res = await api.getModerationQueue();
        if (!ignore) {
          setQueue(res.data || []);
          setError(null);
        }
      } catch (err) {
        if (!ignore) {
          setError(err.message || 'Failed to load moderation queue');
        }
      } finally {
        if (!ignore) {
          setLoading(false);
        }
      }
    }

    loadQueue();

    return () => {
      ignore = true;
    };
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
        <div className="header-title-row">
          <h1>Moderation Queue</h1>
          <Badge variant="pending" icon="🛡️">
            Admin / Moderator
          </Badge>
        </div>
        <p className="moderation-sub">
          Review community-submitted mosques before publishing them to the public radar.
        </p>
      </div>

      {actionFeedback && (
        <Alert
          type="success"
          title="Review Updated"
          message={actionFeedback}
          onClose={() => setActionFeedback(null)}
        />
      )}

      {error && (
        <Alert
          type="error"
          title="Moderation Error"
          message={error}
          onClose={() => setError(null)}
          action={
            <button
              type="button"
              onClick={fetchQueue}
              className="btn btn-secondary btn-sm"
            >
              Retry
            </button>
          }
        />
      )}

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
                    <Badge variant="pending">Pending Review</Badge>
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
                    type="button"
                    disabled={isProcessing}
                    onClick={() => handleApprove(mosque._id, mosque.name)}
                    className="btn btn-primary btn-sm"
                  >
                    ✓ Approve & Publish
                  </button>

                  <button
                    type="button"
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
          <span className="empty-icon" role="img" aria-label="celebrate">🎉</span>
          <h3>Moderation Queue is Empty!</h3>
          <p>All community submissions have been reviewed and verified.</p>
        </div>
      )}

      {/* Reusable Modal for Rejection */}
      <Modal
        isOpen={Boolean(rejectModalMosque)}
        onClose={() => setRejectModalMosque(null)}
        title="Reject Submission"
        footer={
          <>
            <button
              type="button"
              onClick={() => setRejectModalMosque(null)}
              className="btn btn-secondary"
            >
              Cancel
            </button>
            <button
              type="submit"
              form="reject-form"
              disabled={Boolean(processingId) || !rejectionReason.trim()}
              className="btn btn-danger"
            >
              Confirm Rejection
            </button>
          </>
        }
      >
        <p style={{ marginTop: 0, color: 'var(--text-secondary)' }}>
          Please provide a reason for rejecting <strong>"{rejectModalMosque?.name}"</strong>.
        </p>

        <form id="reject-form" onSubmit={handleConfirmReject}>
          <div className="form-group" style={{ marginBottom: 0 }}>
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
        </form>
      </Modal>

      <style>{`
        .moderation-header {
          margin-bottom: 28px;
        }

        .header-title-row {
          display: flex;
          align-items: center;
          gap: 12px;
          flex-wrap: wrap;
        }

        .moderation-header h1 {
          margin: 0;
          font-size: 2.2rem;
        }

        .moderation-sub {
          color: var(--text-secondary);
          margin-top: 8px;
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
          background: rgba(255, 255, 255, 0.02);
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
          font-size: 1.25rem;
          margin: 0;
        }

        .queue-address {
          color: var(--text-secondary);
          font-size: 0.9rem;
          margin: 0;
        }

        .queue-coords {
          font-size: 0.82rem;
          color: var(--text-muted);
          margin: 2px 0 0 0;
        }

        .queue-coords code {
          background: rgba(255, 255, 255, 0.05);
          padding: 2px 6px;
          border-radius: 4px;
        }

        .queue-submitter {
          font-size: 0.85rem;
          color: var(--text-secondary);
          margin: 4px 0 0 0;
        }

        .queue-actions {
          display: flex;
          flex-direction: column;
          gap: 8px;
          min-width: 150px;
        }

        @media (max-width: 768px) {
          .queue-item {
            grid-template-columns: 1fr;
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
