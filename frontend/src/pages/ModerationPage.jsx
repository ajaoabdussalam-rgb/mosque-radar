import { useState, useEffect, useCallback } from 'react';
import { api } from '../services/api';
import LoadingSpinner from '../components/LoadingSpinner';
import Alert from '../components/Alert';
import Badge from '../components/Badge';
import Modal from '../components/Modal';

export default function ModerationPage() {
  const [activeTab, setActiveTab] = useState('pending'); // 'pending' | 'verified' | 'rejected'
  const [queue, setQueue] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actionFeedback, setActionFeedback] = useState(null);

  // Duplicate detection state: { [mosqueId]: Array<duplicateMosque> }
  const [duplicatesMap, setDuplicatesMap] = useState({});
  const [expandedDuplicates, setExpandedDuplicates] = useState({});

  // Rejection modal state
  const [rejectModalMosque, setRejectModalMosque] = useState(null);
  const [rejectionReason, setRejectionReason] = useState('');

  // Inline Edit modal state
  const [editModalMosque, setEditModalMosque] = useState(null);
  const [editForm, setEditForm] = useState({
    name: '',
    address: '',
    latitude: '',
    longitude: ''
  });
  const [editSaving, setEditSaving] = useState(false);
  const [editError, setEditError] = useState(null);

  const [processingId, setProcessingId] = useState(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const checkAllDuplicates = useCallback(async (mosques) => {
    const results = {};
    await Promise.all(
      mosques.map(async (m) => {
        const lat = m.location?.coordinates?.[1];
        const lng = m.location?.coordinates?.[0];
        try {
          const res = await api.checkDuplicates({
            lat,
            lng,
            name: m.name,
            excludeId: m._id,
            radius: 500
          });
          results[m._id] = res.data || [];
        } catch {
          results[m._id] = [];
        }
      })
    );
    setDuplicatesMap(results);
  }, []);

  useEffect(() => {
    let ignore = false;

    async function fetchSubmissions() {
      setLoading(true);
      setError(null);
      try {
        const res = await api.getModerationQueue({ status: activeTab, limit: 50 });
        if (!ignore) {
          const mosques = res.data || [];
          setQueue(mosques);

          if (activeTab === 'pending' && mosques.length > 0) {
            checkAllDuplicates(mosques);
          }
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

    fetchSubmissions();

    return () => {
      ignore = true;
    };
  }, [activeTab, refreshTrigger, checkAllDuplicates]);

  const toggleExpandDuplicates = (id) => {
    setExpandedDuplicates((prev) => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  // Open Edit Modal
  const handleOpenEdit = (mosque) => {
    const lat = mosque.location?.coordinates?.[1] ?? '';
    const lng = mosque.location?.coordinates?.[0] ?? '';
    setEditForm({
      name: mosque.name || '',
      address: mosque.address || '',
      latitude: lat,
      longitude: lng
    });
    setEditError(null);
    setEditModalMosque(mosque);
  };

  // Submit Edit Form
  const handleSaveEdit = async (e) => {
    e.preventDefault();
    if (!editModalMosque) return;

    setEditSaving(true);
    setEditError(null);

    try {
      const lat = parseFloat(editForm.latitude);
      const lng = parseFloat(editForm.longitude);

      if (isNaN(lat) || lat < -90 || lat > 90) {
        throw new Error('Latitude must be a valid number between -90 and 90');
      }
      if (isNaN(lng) || lng < -180 || lng > 180) {
        throw new Error('Longitude must be a valid number between -180 and 180');
      }

      const updates = {
        name: editForm.name.trim(),
        address: editForm.address.trim(),
        latitude: lat,
        longitude: lng
      };

      const res = await api.updateMosque(editModalMosque._id, updates);
      const updated = res.data;

      // Update in local queue
      setQueue((prev) =>
        prev.map((m) => (m._id === editModalMosque._id ? { ...m, ...updated } : m))
      );

      // Recheck duplicates for this edited item
      try {
        const dupRes = await api.checkDuplicates({
          lat: updated.location?.coordinates?.[1],
          lng: updated.location?.coordinates?.[0],
          name: updated.name,
          excludeId: updated._id,
          radius: 500
        });
        setDuplicatesMap((prev) => ({
          ...prev,
          [updated._id]: dupRes.data || []
        }));
      } catch {
        // Non-fatal duplicate recheck error
      }

      setActionFeedback(`Updated details for "${updated.name}" successfully.`);
      setEditModalMosque(null);
    } catch (err) {
      setEditError(err.message || 'Failed to update mosque details');
    } finally {
      setEditSaving(false);
    }
  };

  // Approve action
  const handleApprove = async (id, name) => {
    try {
      setProcessingId(id);
      await api.verifyMosque(id, {
        status: 'verified',
        verifiedBy: 'Community Moderator'
      });
      setActionFeedback(`Approved "${name}" — now live on public radar!`);
      // If currently in pending queue, remove it from view
      if (activeTab === 'pending') {
        setQueue((prev) => prev.filter((m) => m._id !== id));
      } else {
        // Otherwise reload active tab
        setRefreshTrigger((n) => n + 1);
      }
    } catch (err) {
      setError(`Failed to approve: ${err.message}`);
    } finally {
      setProcessingId(null);
    }
  };

  // Reject action
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
      if (activeTab === 'pending') {
        setQueue((prev) => prev.filter((m) => m._id !== rejectModalMosque._id));
      } else {
        setRefreshTrigger((n) => n + 1);
      }
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
          <h1>Moderation Center</h1>
          <Badge variant="pending" icon="🛡️">
            Admin / Moderator Portal
          </Badge>
        </div>
        <p className="moderation-sub">
          Review community submissions, inspect duplicate warnings, make inline edits, and audit past decisions.
        </p>
      </div>

      {/* Tabs for Moderation Status */}
      <div className="moderation-tabs">
        <button
          type="button"
          className={`tab-btn ${activeTab === 'pending' ? 'active' : ''}`}
          onClick={() => setActiveTab('pending')}
        >
          ⏳ Pending Submissions
          {activeTab === 'pending' && queue.length > 0 && (
            <span className="tab-counter">{queue.length}</span>
          )}
        </button>
        <button
          type="button"
          className={`tab-btn ${activeTab === 'verified' ? 'active' : ''}`}
          onClick={() => setActiveTab('verified')}
        >
          ✅ Verified Mosques
        </button>
        <button
          type="button"
          className={`tab-btn ${activeTab === 'rejected' ? 'active' : ''}`}
          onClick={() => setActiveTab('rejected')}
        >
          ❌ Rejected Submissions
        </button>
      </div>

      {actionFeedback && (
        <Alert
          type="success"
          title="Action Completed"
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
              onClick={() => setRefreshTrigger((n) => n + 1)}
              className="btn btn-secondary btn-sm"
            >
              Retry
            </button>
          }
        />
      )}

      {loading ? (
        <LoadingSpinner text={`Fetching ${activeTab} records...`} />
      ) : queue.length > 0 ? (
        <div className="queue-list">
          {queue.map((mosque) => {
            const lat = mosque.location?.coordinates?.[1];
            const lng = mosque.location?.coordinates?.[0];
            const isProcessing = processingId === mosque._id;
            const duplicates = duplicatesMap[mosque._id] || [];
            const hasDuplicates = activeTab === 'pending' && duplicates.length > 0;
            const isExpanded = expandedDuplicates[mosque._id];

            return (
              <div key={mosque._id} className="queue-item-card glass-card">
                <div className="queue-item-main">
                  <div className="queue-media">
                    {mosque.images && mosque.images.length > 0 ? (
                      <img src={mosque.images[0]} alt={mosque.name} className="queue-img" />
                    ) : (
                      <div className="queue-no-img">🕌</div>
                    )}
                  </div>

                  <div className="queue-info">
                    <div className="queue-top">
                      <Badge
                        variant={
                          mosque.status === 'verified'
                            ? 'verified'
                            : mosque.status === 'rejected'
                            ? 'rejected'
                            : 'pending'
                        }
                      >
                        {mosque.status.toUpperCase()}
                      </Badge>

                      <span className="queue-date">
                        Submitted: {new Date(mosque.createdAt).toLocaleDateString()}
                      </span>

                      {mosque.verifiedAt && (
                        <span className="queue-audit">
                          Reviewed: {new Date(mosque.verifiedAt).toLocaleDateString()} by{' '}
                          <strong>{mosque.verifiedBy || 'Moderator'}</strong>
                        </span>
                      )}
                    </div>

                    <h3 className="queue-title">{mosque.name}</h3>
                    <p className="queue-address">📍 {mosque.address}</p>
                    <p className="queue-coords">
                      Coordinates: <code>{lat !== undefined ? Number(lat).toFixed(5) : 'N/A'}, {lng !== undefined ? Number(lng).toFixed(5) : 'N/A'}</code>
                    </p>
                    <p className="queue-submitter">
                      Submitted by: <strong>{mosque.submittedBy || 'Anonymous'}</strong>
                    </p>

                    {mosque.rejectionReason && (
                      <div className="rejection-reason-box">
                        <strong>Rejection Reason:</strong> {mosque.rejectionReason}
                      </div>
                    )}

                    {/* Duplicate Detection Pill / Warning */}
                    {hasDuplicates && (
                      <div className="duplicate-alert-banner">
                        <div className="dup-summary-row">
                          <span className="dup-warning-text">
                            ⚠️ <strong>Potential Duplicate Detected:</strong> {duplicates.length}{' '}
                            existing {duplicates.length === 1 ? 'mosque' : 'mosques'} found nearby or with similar name.
                          </span>
                          <button
                            type="button"
                            onClick={() => toggleExpandDuplicates(mosque._id)}
                            className="btn btn-secondary btn-xs"
                          >
                            {isExpanded ? 'Hide Potential Duplicates ▲' : 'View Potential Duplicates ▼'}
                          </button>
                        </div>

                        {isExpanded && (
                          <div className="duplicate-drawer">
                            {duplicates.map((dup) => (
                              <div key={dup._id} className="duplicate-card">
                                <div className="dup-card-top">
                                  <strong>{dup.name}</strong>
                                  <Badge variant={dup.status === 'verified' ? 'verified' : 'pending'}>
                                    {dup.status}
                                  </Badge>
                                </div>
                                <div className="dup-card-address">📍 {dup.address}</div>
                                <div className="dup-card-meta">
                                  {dup.distanceMeters !== undefined && (
                                    <span className="dup-badge proximity">
                                      📏 ~{dup.distanceMeters}m away
                                    </span>
                                  )}
                                  {dup.matchType === 'name' && (
                                    <span className="dup-badge name-match">
                                      🔤 Name match
                                    </span>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="queue-actions">
                    {mosque.status !== 'verified' && (
                      <button
                        type="button"
                        disabled={isProcessing}
                        onClick={() => handleApprove(mosque._id, mosque.name)}
                        className="btn btn-primary btn-sm"
                      >
                        ✓ Approve & Publish
                      </button>
                    )}

                    <button
                      type="button"
                      disabled={isProcessing}
                      onClick={() => handleOpenEdit(mosque)}
                      className="btn btn-secondary btn-sm"
                    >
                      ✏️ Edit Details
                    </button>

                    {mosque.status !== 'rejected' && (
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
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="empty-state glass-card">
          <span className="empty-icon" role="img" aria-label="celebrate">
            {activeTab === 'pending' ? '🎉' : '📂'}
          </span>
          <h3>No {activeTab} submissions found</h3>
          <p>
            {activeTab === 'pending'
              ? 'All community submissions have been reviewed and verified.'
              : `There are currently no records marked as ${activeTab}.`}
          </p>
        </div>
      )}

      {/* Reusable Modal for Inline Editing */}
      <Modal
        isOpen={Boolean(editModalMosque)}
        onClose={() => setEditModalMosque(null)}
        title="Edit Mosque Submission"
        footer={
          <>
            <button
              type="button"
              onClick={() => setEditModalMosque(null)}
              className="btn btn-secondary"
              disabled={editSaving}
            >
              Cancel
            </button>
            <button
              type="submit"
              form="edit-mosque-form"
              disabled={editSaving}
              className="btn btn-primary"
            >
              {editSaving ? 'Saving Changes...' : 'Save Changes'}
            </button>
          </>
        }
      >
        {editError && (
          <Alert
            type="error"
            title="Edit Error"
            message={editError}
            onClose={() => setEditError(null)}
          />
        )}

        <form id="edit-mosque-form" onSubmit={handleSaveEdit}>
          <div className="form-group">
            <label className="form-label" htmlFor="edit-name">
              Mosque Name *
            </label>
            <input
              id="edit-name"
              type="text"
              className="form-input"
              value={editForm.name}
              onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="edit-address">
              Address / Locality *
            </label>
            <input
              id="edit-address"
              type="text"
              className="form-input"
              value={editForm.address}
              onChange={(e) => setEditForm({ ...editForm, address: e.target.value })}
              required
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label" htmlFor="edit-lat">
                Latitude *
              </label>
              <input
                id="edit-lat"
                type="number"
                step="any"
                className="form-input"
                value={editForm.latitude}
                onChange={(e) => setEditForm({ ...editForm, latitude: e.target.value })}
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="edit-lng">
                Longitude *
              </label>
              <input
                id="edit-lng"
                type="number"
                step="any"
                className="form-input"
                value={editForm.longitude}
                onChange={(e) => setEditForm({ ...editForm, longitude: e.target.value })}
                required
              />
            </div>
          </div>
        </form>
      </Modal>

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
              placeholder="e.g. Confirmed duplicate of existing mosque, invalid address, or non-functional prayer room."
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              required
            />
          </div>
        </form>
      </Modal>

      <style>{`
        .moderation-header {
          margin-bottom: 24px;
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

        .moderation-tabs {
          display: flex;
          gap: 8px;
          margin-bottom: 24px;
          border-bottom: 1px solid var(--border-color);
          padding-bottom: 12px;
          overflow-x: auto;
        }

        .tab-btn {
          background: rgba(255, 255, 255, 0.03);
          color: var(--text-secondary);
          border: 1px solid var(--border-color);
          padding: 8px 16px;
          border-radius: var(--radius-sm);
          font-size: 0.95rem;
          font-weight: 500;
          cursor: pointer;
          display: inline-flex;
          align-items: center;
          gap: 8px;
          transition: all 0.2s ease;
          white-space: nowrap;
        }

        .tab-btn:hover {
          background: rgba(255, 255, 255, 0.08);
          color: var(--text-primary);
        }

        .tab-btn.active {
          background: var(--primary);
          color: #ffffff;
          border-color: var(--primary);
          box-shadow: 0 4px 14px rgba(16, 185, 129, 0.25);
        }

        .tab-counter {
          background: rgba(0, 0, 0, 0.3);
          color: #ffffff;
          font-size: 0.75rem;
          padding: 2px 7px;
          border-radius: 999px;
          font-weight: 600;
        }

        .queue-list {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .queue-item-card {
          padding: 20px;
          border-radius: var(--radius-md);
        }

        .queue-item-main {
          display: grid;
          grid-template-columns: 140px 1fr auto;
          gap: 20px;
          align-items: flex-start;
        }

        .queue-media {
          width: 140px;
          height: 120px;
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
          flex-wrap: wrap;
        }

        .queue-date, .queue-audit {
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

        .rejection-reason-box {
          margin-top: 8px;
          padding: 8px 12px;
          background: rgba(239, 68, 68, 0.1);
          border: 1px solid rgba(239, 68, 68, 0.3);
          border-radius: var(--radius-sm);
          font-size: 0.88rem;
          color: #fca5a5;
        }

        .duplicate-alert-banner {
          margin-top: 12px;
          padding: 10px 14px;
          background: rgba(245, 158, 11, 0.1);
          border: 1px solid rgba(245, 158, 11, 0.35);
          border-radius: var(--radius-sm);
        }

        .dup-summary-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          flex-wrap: wrap;
        }

        .dup-warning-text {
          font-size: 0.88rem;
          color: #fcd34d;
        }

        .btn-xs {
          padding: 4px 10px;
          font-size: 0.78rem;
        }

        .duplicate-drawer {
          margin-top: 10px;
          display: flex;
          flex-direction: column;
          gap: 8px;
          border-top: 1px dashed rgba(245, 158, 11, 0.25);
          padding-top: 10px;
        }

        .duplicate-card {
          padding: 8px 12px;
          background: rgba(0, 0, 0, 0.25);
          border-radius: 6px;
          border: 1px solid rgba(255, 255, 255, 0.05);
        }

        .dup-card-top {
          display: flex;
          align-items: center;
          justify-content: space-between;
          font-size: 0.9rem;
        }

        .dup-card-address {
          font-size: 0.8rem;
          color: var(--text-secondary);
          margin-top: 2px;
        }

        .dup-card-meta {
          display: flex;
          gap: 6px;
          margin-top: 4px;
        }

        .dup-badge {
          font-size: 0.72rem;
          padding: 2px 6px;
          border-radius: 4px;
          font-weight: 500;
        }

        .dup-badge.proximity {
          background: rgba(59, 130, 246, 0.2);
          color: #93c5fd;
        }

        .dup-badge.name-match {
          background: rgba(168, 85, 247, 0.2);
          color: #d8b4fe;
        }

        .queue-actions {
          display: flex;
          flex-direction: column;
          gap: 8px;
          min-width: 155px;
        }

        .form-row {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 12px;
        }

        @media (max-width: 768px) {
          .queue-item-main {
            grid-template-columns: 1fr;
          }

          .queue-media {
            width: 100%;
            height: 160px;
          }

          .queue-actions {
            flex-direction: row;
            flex-wrap: wrap;
          }
        }
      `}</style>
    </div>
  );
}
