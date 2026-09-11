import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api } from '../services/api';
import LoadingSpinner from '../components/LoadingSpinner';
import Alert from '../components/Alert';
import Badge from '../components/Badge';

export default function MosqueDetailPage() {
  const { id } = useParams();
  const [mosque, setMosque] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedImg, setSelectedImg] = useState(0);
  const [copiedNotification, setCopiedNotification] = useState(false);

  useEffect(() => {
    let ignore = false;

    async function loadDetail() {
      try {
        const res = await api.getMosqueById(id);
        if (!ignore) {
          setMosque(res.data);
          setError(null);
        }
      } catch (err) {
        if (!ignore) {
          setError(err.message || 'Could not find mosque record.');
        }
      } finally {
        if (!ignore) {
          setLoading(false);
        }
      }
    }

    loadDetail();

    return () => {
      ignore = true;
    };
  }, [id]);

  if (loading) return <LoadingSpinner text="Loading mosque details..." />;

  if (error || !mosque) {
    return (
      <div className="glass-card error-card">
        <h2>Mosque Not Found</h2>
        <p>{error || 'The requested mosque profile does not exist.'}</p>
        <Link to="/" className="btn btn-primary" style={{ marginTop: '16px' }}>
          ← Back to Radar
        </Link>
      </div>
    );
  }

  const { name, address, location, images, status, createdAt, verifiedAt, submittedBy, rejectionReason } = mosque;
  const lat = location?.coordinates?.[1];
  const lng = location?.coordinates?.[0];

  const mapUrl = `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`;

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({ title: name, url: window.location.href }).catch(() => {});
    } else {
      navigator.clipboard.writeText(window.location.href);
      setCopiedNotification(true);
      setTimeout(() => setCopiedNotification(false), 3000);
    }
  };

  return (
    <div className="detail-page">
      <nav className="breadcrumb" aria-label="Breadcrumb">
        <Link to="/">← Radar</Link> / <span>{name}</span>
      </nav>

      {copiedNotification && (
        <Alert
          type="success"
          message="Direct link copied to clipboard!"
          onClose={() => setCopiedNotification(false)}
        />
      )}

      <div className="detail-layout">
        {/* Gallery / Visual Column */}
        <div className="gallery-col glass-card">
          {images && images.length > 0 ? (
            <>
              <div className="main-image-box">
                <img
                  src={images[selectedImg] || images[0]}
                  alt={name}
                  className="main-detail-img"
                />
              </div>

              {images.length > 1 && (
                <div className="thumbnails-row">
                  {images.map((img, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setSelectedImg(idx)}
                      className={`thumb-btn ${selectedImg === idx ? 'thumb-active' : ''}`}
                      aria-label={`View photo ${idx + 1}`}
                    >
                      <img src={img} alt="" className="thumb-img" />
                    </button>
                  ))}
                </div>
              )}
            </>
          ) : (
            <div className="detail-placeholder">
              <span className="huge-icon" role="img" aria-label="mosque">🕌</span>
              <p>No community photos submitted yet</p>
            </div>
          )}
        </div>

        {/* Info Column */}
        <div className="info-col glass-card">
          <div className="info-header">
            <Badge variant={status}>
              {status === 'verified' ? 'Verified Location' : `${status} submission`}
            </Badge>
            <span className="submitter-tag">Submitted by: {submittedBy || 'Anonymous'}</span>
          </div>

          <h1 className="detail-title">{name}</h1>

          <div className="info-block">
            <span className="info-label">Address & Landmark</span>
            <p className="info-value">📍 {address}</p>
          </div>

          {lat !== undefined && lng !== undefined && (
            <div className="info-block">
              <span className="info-label">Geographic Coordinates (WGS84)</span>
              <div className="coords-row">
                <span className="coord-chip">Latitude: {lat.toFixed(6)}</span>
                <span className="coord-chip">Longitude: {lng.toFixed(6)}</span>
              </div>
            </div>
          )}

          {rejectionReason && (
            <Alert
              type="error"
              title="Rejection Note"
              message={rejectionReason}
            />
          )}

          <div className="meta-dates">
            <span>Registered: {new Date(createdAt).toLocaleDateString()}</span>
            {verifiedAt && <span>Verified: {new Date(verifiedAt).toLocaleDateString()}</span>}
          </div>

          <div className="action-buttons">
            <a
              href={mapUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-primary"
            >
              Open in Google Maps ↗
            </a>
            <button
              type="button"
              onClick={handleShare}
              className="btn btn-secondary"
            >
              Share Location 🔗
            </button>
          </div>
        </div>
      </div>

      <style>{`
        .breadcrumb {
          margin-bottom: 20px;
          font-size: 0.9rem;
          color: var(--text-muted);
        }

        .breadcrumb a {
          color: var(--text-secondary);
          text-decoration: none;
        }

        .breadcrumb a:hover {
          color: var(--primary-400);
        }

        .detail-layout {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 32px;
        }

        .gallery-col {
          display: flex;
          flex-direction: column;
          gap: 16px;
          overflow: hidden;
        }

        .main-image-box {
          width: 100%;
          height: 380px;
          border-radius: var(--radius-md);
          overflow: hidden;
          background: #090e17;
        }

        .main-detail-img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .thumbnails-row {
          display: flex;
          gap: 10px;
          overflow-x: auto;
          padding-bottom: 6px;
        }

        .thumb-btn {
          width: 76px;
          height: 56px;
          border-radius: var(--radius-sm);
          overflow: hidden;
          padding: 0;
          border: 2px solid transparent;
          background: #0d131f;
          cursor: pointer;
          flex-shrink: 0;
          transition: all 0.2s;
        }

        .thumb-active {
          border-color: var(--primary-500);
          transform: translateY(-2px);
        }

        .thumb-img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .detail-placeholder {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          height: 340px;
          color: var(--text-muted);
        }

        .huge-icon {
          font-size: 4rem;
          margin-bottom: 12px;
        }

        .info-col {
          display: flex;
          flex-direction: column;
          gap: 20px;
        }

        .info-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          flex-wrap: wrap;
          gap: 10px;
        }

        .submitter-tag {
          font-size: 0.85rem;
          color: var(--text-muted);
        }

        .detail-title {
          font-size: 2.2rem;
          line-height: 1.25;
          margin: 0;
        }

        .info-block {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        .info-label {
          font-size: 0.82rem;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          color: var(--text-muted);
          font-weight: 700;
        }

        .info-value {
          font-size: 1.05rem;
          color: var(--text-primary);
          margin: 0;
        }

        .coords-row {
          display: flex;
          gap: 10px;
          flex-wrap: wrap;
        }

        .coord-chip {
          background: rgba(255, 255, 255, 0.04);
          border: 1px solid var(--border-subtle);
          padding: 6px 12px;
          border-radius: var(--radius-sm);
          font-family: monospace;
          font-size: 0.9rem;
          color: var(--primary-400);
        }

        .meta-dates {
          display: flex;
          gap: 20px;
          font-size: 0.82rem;
          color: var(--text-muted);
          border-top: 1px solid var(--border-subtle);
          padding-top: 16px;
        }

        .action-buttons {
          display: flex;
          gap: 12px;
          margin-top: 8px;
          flex-wrap: wrap;
        }

        .error-card {
          text-align: center;
          padding: 60px 20px;
          max-width: 500px;
          margin: 40px auto;
        }

        @media (max-width: 840px) {
          .detail-layout {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
}
