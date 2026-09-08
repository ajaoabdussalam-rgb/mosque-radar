import { useState, useEffect } from 'react';
import { api } from '../services/api';
import MosqueCard from '../components/MosqueCard';
import LoadingSpinner from '../components/LoadingSpinner';

export default function HomePage() {
  const [coords, setCoords] = useState(null);
  const [geoError, setGeoError] = useState(null);
  const [radiusKm, setRadiusKm] = useState(10);
  const [mosques, setMosques] = useState([]);
  const [loading, setLoading] = useState(false);
  const [hasScanned, setHasScanned] = useState(false);

  // Request browser geolocation
  const triggerScan = (customCoords = null) => {
    setLoading(true);
    setGeoError(null);

    if (customCoords) {
      setCoords(customCoords);
      fetchNearby(customCoords.lat, customCoords.lng, radiusKm);
      return;
    }

    if (!navigator.geolocation) {
      setGeoError('Geolocation is not supported by your browser.');
      setLoading(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const userCoords = {
          lat: position.coords.latitude,
          lng: position.coords.longitude
        };
        setCoords(userCoords);
        fetchNearby(userCoords.lat, userCoords.lng, radiusKm);
      },
      (err) => {
        setGeoError(
          err.code === 1
            ? 'Location access was denied. You can manually enter coordinates or explore our city presets.'
            : 'Unable to acquire your GPS position.'
        );
        setLoading(false);
      },
      { timeout: 10000, enableHighAccuracy: true }
    );
  };

  const fetchNearby = async (lat, lng, radius) => {
    try {
      setLoading(true);
      const res = await api.getNearbyMosques({
        lat,
        lng,
        radius: radius * 1000 // convert km to meters
      });
      setMosques(res.data || []);
      setHasScanned(true);
    } catch (err) {
      setGeoError(err.message || 'Failed to fetch nearby mosques');
    } finally {
      setLoading(false);
    }
  };

  // Re-fetch if radius changes when coordinates already present
  useEffect(() => {
    if (coords) {
      fetchNearby(coords.lat, coords.lng, radiusKm);
    }
  }, [radiusKm]);

  // Try auto-locating on first load
  useEffect(() => {
    triggerScan();
  }, []);

  return (
    <div className="home-page">
      {/* Hero Section */}
      <section className="hero-section glass-card">
        <div className="hero-badge">
          <span className="live-dot"></span> LIVE PROXIMITY RADAR
        </div>
        <h1 className="hero-title">Find Nearby Mosques & Prayer Spaces</h1>
        <p className="hero-desc">
          Accurate, community-verified mosques calculated dynamically from your real-time position.
        </p>

        <div className="radar-actions">
          <button
            onClick={() => triggerScan()}
            disabled={loading}
            className="btn btn-primary btn-scan"
          >
            <span className="scan-icon">📡</span>
            {loading ? 'Scanning Airwaves...' : 'Scan Near My Location'}
          </button>

          <div className="radius-control">
            <span className="radius-label">Radar Radius:</span>
            <div className="radius-buttons">
              {[2, 5, 10, 25].map((km) => (
                <button
                  key={km}
                  onClick={() => setRadiusKm(km)}
                  className={`radius-chip ${radiusKm === km ? 'radius-chip-active' : ''}`}
                >
                  {km} km
                </button>
              ))}
            </div>
          </div>
        </div>

        {geoError && (
          <div className="alert alert-error">
            <span>⚠️ {geoError}</span>
            <button
              onClick={() => triggerScan({ lat: 6.5244, lng: 3.3792 })}
              className="btn btn-secondary btn-sm"
              style={{ marginLeft: 'auto' }}
            >
              Use Lagos Demo Coordinates
            </button>
          </div>
        )}

        {coords && (
          <div className="location-bar">
            <span>🎯 Current Origin:</span>
            <code>Lat {coords.lat.toFixed(4)}, Lng {coords.lng.toFixed(4)}</code>
            <span className="radar-range-info">• Scanning up to {radiusKm}km</span>
          </div>
        )}
      </section>

      {/* Results Section */}
      <section className="results-section">
        <div className="section-header">
          <h2>
            {hasScanned
              ? `Nearby Mosques (${mosques.length})`
              : 'Discover Nearby'}
          </h2>
          {coords && (
            <span className="section-sub">
              Sorted by closest distance to your radar
            </span>
          )}
        </div>

        {loading ? (
          <LoadingSpinner text={`Scanning radar within ${radiusKm}km...`} />
        ) : mosques.length > 0 ? (
          <div className="mosque-grid">
            {mosques.map((mosque) => (
              <MosqueCard key={mosque._id} mosque={mosque} />
            ))}
          </div>
        ) : hasScanned ? (
          <div className="empty-state glass-card">
            <span className="empty-icon">📍</span>
            <h3>No Mosques Detected Within {radiusKm}km</h3>
            <p>
              Try expanding your radar radius above, or be the first to contribute a mosque in this locality!
            </p>
            <a href="/submit" className="btn btn-primary" style={{ marginTop: '16px' }}>
              + Add a Discovered Mosque
            </a>
          </div>
        ) : null}
      </section>

      <style>{`
        .hero-section {
          text-align: center;
          padding: 48px 24px;
          margin-bottom: 40px;
          background: linear-gradient(180deg, rgba(16, 185, 129, 0.08) 0%, rgba(16, 24, 38, 0.8) 100%);
        }

        .hero-badge {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          background: rgba(16, 185, 129, 0.15);
          color: #34d399;
          border: 1px solid rgba(16, 185, 129, 0.3);
          padding: 5px 14px;
          border-radius: var(--radius-full);
          font-size: 0.8rem;
          font-weight: 700;
          letter-spacing: 0.06em;
          margin-bottom: 20px;
        }

        .live-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: #34d399;
          box-shadow: 0 0 10px #34d399;
        }

        .hero-title {
          font-size: 2.6rem;
          margin-bottom: 16px;
          line-height: 1.2;
        }

        .hero-desc {
          max-width: 600px;
          margin: 0 auto 32px auto;
          color: var(--text-secondary);
          font-size: 1.08rem;
        }

        .radar-actions {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 20px;
          margin-bottom: 24px;
        }

        .btn-scan {
          font-size: 1.1rem;
          padding: 15px 34px;
          border-radius: var(--radius-full);
        }

        .scan-icon {
          font-size: 1.2rem;
        }

        .radius-control {
          display: flex;
          align-items: center;
          gap: 12px;
          flex-wrap: wrap;
          justify-content: center;
        }

        .radius-label {
          font-size: 0.9rem;
          color: var(--text-secondary);
          font-weight: 600;
        }

        .radius-buttons {
          display: flex;
          gap: 8px;
        }

        .radius-chip {
          padding: 6px 14px;
          border-radius: var(--radius-full);
          border: 1px solid var(--border-subtle);
          background: rgba(255, 255, 255, 0.05);
          color: var(--text-secondary);
          font-weight: 600;
          font-size: 0.85rem;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .radius-chip:hover {
          background: rgba(255, 255, 255, 0.12);
        }

        .radius-chip-active {
          background: #10b981;
          color: #ffffff;
          border-color: #10b981;
        }

        .location-bar {
          display: inline-flex;
          align-items: center;
          gap: 10px;
          padding: 8px 16px;
          background: rgba(255, 255, 255, 0.04);
          border-radius: var(--radius-full);
          font-size: 0.85rem;
          color: var(--text-secondary);
          margin-top: 10px;
          flex-wrap: wrap;
          justify-content: center;
        }

        .location-bar code {
          color: #34d399;
          font-family: monospace;
          background: rgba(16, 185, 129, 0.1);
          padding: 2px 6px;
          border-radius: 4px;
        }

        .results-section {
          margin-top: 20px;
        }

        .section-header {
          display: flex;
          justify-content: space-between;
          align-items: baseline;
          margin-bottom: 24px;
          flex-wrap: wrap;
          gap: 10px;
        }

        .section-sub {
          color: var(--text-muted);
          font-size: 0.9rem;
        }

        .mosque-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
          gap: 24px;
        }

        .empty-state {
          text-align: center;
          padding: 60px 20px;
        }

        .empty-icon {
          font-size: 3rem;
          display: block;
          margin-bottom: 12px;
        }

        @media (max-width: 640px) {
          .hero-title {
            font-size: 2rem;
          }
        }
      `}</style>
    </div>
  );
}
