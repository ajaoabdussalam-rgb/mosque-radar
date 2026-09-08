import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api } from '../services/api';
import LoadingSpinner from '../components/LoadingSpinner';

export default function MosqueDetailPage() {
  const { id } = useParams();
  const [mosque, setMosque] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedImg, setSelectedImg] = useState(0);

  useEffect(() => {
    const fetchDetail = async () => {
      try {
        setLoading(true);
        setError(null);
        const res = await api.getMosqueById(id);
        setMosque(res.data);
      } catch (err) {
        setError(err.message || 'Could not find mosque record.');
      } finally {
        setLoading(false);
      }
    };
    fetchDetail();
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

  return (
    <div className="detail-page">
      <div className="breadcrumb">
        <Link to="/">← Radar</Link> / <span>{name}</span>
      </div>

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
                      onClick={() => setSelectedImg(idx)}
                      className={`thumb-btn ${selectedImg === idx ? 'thumb-active' : ''}`}
                    >
                      <img src={img} alt="" className="thumb-img" />
                    </button>
                  ))}
                </div>
              )}
            </>
          ) : (
            <div className="detail-placeholder">
              <span className="huge-icon">🕌</span>
              <p>No community photos submitted yet</p>
            </div>
          )}
        </div>

        {/* Info Column */}
        <div className="info-col glass-card">
          <div className="info-header">
            <span className={`badge badge-${status}`}>
              {status === 'verified' ? '✓ Verified Location' : `${status} submission`}
            </span>
            <span className="submitter-tag">Submitted by: {submittedBy || 'Anonymous'}</span>
          </div>

          <h1 className="detail-title">{name}</h1>

          <div className="info-block">
            <span className="info-label">Address & Landmark</span>
            <p className="info-value">📍 {address}</p>
          </div>

          {lat && lng && (
            <div className="info-block">
              <span className="info-label">Geographic Coordinates (WGS84)</span>
              <div className="coords-row">
                <span className="coord-chip">Latitude: {lat.toFixed(6)}</span>
                <span className="coord-chip">Longitude: {lng.toFixed(6)}</span>
              </div>
            </div>
          )}

          {rejectionReason && (
            <div className="alert alert-error" style={{ marginTop: '16px' }}>
              <strong>Rejection Note:</strong> {rejectionReason}
            </div>
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
              onClick={() => {
                if (navigator.share) {
                  navigator.share({ title: name, url: window.location.href });
                } else {
                  navigator.clipboard.writeText(window.location.href);
                  alert('Link copied to clipboard!');
                }
              }}
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
        }

        .breadcrumb span {
          color: var(--text-primary);
        }

        .detail-layout {
          display: grid;
          grid-template-columns: 1.1fr 1fr;
          gap: 30px;
        }

        .gallery-col {
          padding: 20px;
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .main-image-box {
          width: 100%;
          height: 380px;
          border-radius: var(--radius-sm);
          overflow: hidden;
          background: #000;
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
          width: 70px;
          height: 70px;
          border-radius: 8px;
          border: 2px solid transparent;
          background: transparent;
          cursor: pointer;
          overflow: hidden;
          padding: 0;
          flex-shrink: 0;
        }

        .thumb-active {
          border-color: var(--primary-500);
        }

        .thumb-img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .detail-placeholder {
          height: 380px;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          background: rgba(16, 185, 129, 0.05);
          border-radius: var(--radius-sm);
          color: var(--text-muted);
        }

        .huge-icon {
          font-size: 4.5rem;
          margin-bottom: 12px;
        }

        .info-col {
          padding: 32px;
          display: flex;
          flex-direction: column;
        }

        .info-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 16px;
        }

        .submitter-tag {
          font-size: 0.8rem;
          color: var(--text-muted);
        }

        .detail-title {
          font-size: 2.1rem;
          margin-bottom: 24px;
          line-height: 1.25;
        }

        .info-block {
          margin-bottom: 20px;
        }

        .info-label {
          display: block;
          font-size: 0.78rem;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          color: var(--text-muted);
          margin-bottom: 6px;
        }

        .info-value {
          font-size: 1.05rem;
          color: var(--text-primary);
        }

        .coords-row {
          display: flex;
          gap: 10px;
        }

        .meta-dates {
          margin-top: auto;
          padding-top: 20px;
          border-top: 1px solid var(--border-subtle);
          display: flex;
          justify-content: space-between;
          font-size: 0.8rem;
          color: var(--text-muted);
          margin-bottom: 24px;
        }

        .action-buttons {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 14px;
        }

        @media (max-width: 860px) {
          .detail-layout {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
}
