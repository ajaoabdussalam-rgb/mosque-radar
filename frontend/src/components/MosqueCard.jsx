import { Link } from 'react-router-dom';
import Badge from './Badge';

export default function MosqueCard({ mosque }) {
  const {
    _id,
    name,
    address,
    location,
    images,
    status,
    distanceKm,
    distanceMeters
  } = mosque;

  const lat = location?.coordinates ? location.coordinates[1] : null;
  const lng = location?.coordinates ? location.coordinates[0] : null;

  const mapUrl = lat && lng
    ? `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`
    : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address || name)}`;

  const hasImage = images && images.length > 0 && images[0];

  return (
    <article className="glass-card mosque-card">
      <div className="card-media">
        {hasImage ? (
          <img src={images[0]} alt={name} className="card-img" loading="lazy" />
        ) : (
          <div className="card-img-placeholder">
            <span className="placeholder-icon">🕌</span>
          </div>
        )}

        <div className="media-badges">
          {status && (
            <Badge variant={status}>
              {status}
            </Badge>
          )}

          {distanceKm !== undefined && (
            <Badge variant="distance" icon="📍">
              {distanceKm < 1 ? `${distanceMeters}m` : `${distanceKm}km`}
            </Badge>
          )}
        </div>
      </div>

      <div className="card-body">
        <h3 className="card-title">
          <Link to={`/mosque/${_id}`}>{name}</Link>
        </h3>
        <p className="card-address">
          <span className="address-pin">🗺️</span> {address}
        </p>

        {lat && lng && (
          <div className="card-coords">
            <span className="coord-chip">Lat: {lat.toFixed(4)}</span>
            <span className="coord-chip">Lng: {lng.toFixed(4)}</span>
          </div>
        )}

        <div className="card-actions">
          <Link to={`/mosque/${_id}`} className="btn btn-secondary btn-sm">
            View Details
          </Link>
          <a
            href={mapUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn-primary btn-sm"
          >
            Get Directions ↗
          </a>
        </div>
      </div>

      <style>{`
        .mosque-card {
          display: flex;
          flex-direction: column;
          overflow: hidden;
          padding: 0;
          height: 100%;
        }

        .card-media {
          position: relative;
          width: 100%;
          height: 190px;
          background: #0d131f;
          overflow: hidden;
        }

        .card-img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          transition: transform 0.35s ease;
        }

        .mosque-card:hover .card-img {
          transform: scale(1.05);
        }

        .card-img-placeholder {
          width: 100%;
          height: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          background: linear-gradient(135deg, rgba(16, 185, 129, 0.12) 0%, rgba(15, 23, 42, 0.6) 100%);
        }

        .placeholder-icon {
          font-size: 3.5rem;
          filter: drop-shadow(0 4px 12px rgba(0, 0, 0, 0.4));
        }

        .media-badges {
          position: absolute;
          top: 12px;
          left: 12px;
          right: 12px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          pointer-events: none;
        }

        .card-body {
          padding: 20px;
          display: flex;
          flex-direction: column;
          flex: 1;
        }

        .card-title {
          font-size: 1.15rem;
          margin-bottom: 8px;
          line-height: 1.35;
        }

        .card-title a {
          color: var(--text-primary);
        }

        .card-title a:hover {
          color: var(--primary-500);
        }

        .card-address {
          font-size: 0.88rem;
          color: var(--text-secondary);
          margin-bottom: 14px;
          display: flex;
          align-items: flex-start;
          gap: 6px;
        }

        .address-pin {
          font-size: 0.95rem;
          flex-shrink: 0;
        }

        .card-coords {
          display: flex;
          gap: 8px;
          margin-bottom: 18px;
          margin-top: auto;
        }

        .coord-chip {
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid var(--border-subtle);
          padding: 3px 8px;
          border-radius: 6px;
          font-size: 0.75rem;
          color: var(--text-muted);
          font-family: monospace;
        }

        .card-actions {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 10px;
        }

        .btn-sm {
          padding: 8px 14px;
          font-size: 0.85rem;
        }
      `}</style>
    </article>
  );
}
