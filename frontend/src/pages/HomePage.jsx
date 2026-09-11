import { useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../services/api';
import { useGeolocation } from '../hooks/useGeolocation';
import MosqueCard from '../components/MosqueCard';
import LoadingSpinner from '../components/LoadingSpinner';
import MosqueSkeleton from '../components/MosqueSkeleton';
import Alert from '../components/Alert';
import Badge from '../components/Badge';

const CITY_PRESETS = [
  { name: 'Lagos', lat: 6.5244, lng: 3.3792 },
  { name: 'Cairo', lat: 30.0444, lng: 31.2357 },
  { name: 'London', lat: 51.5074, lng: -0.1278 },
  { name: 'Istanbul', lat: 41.0082, lng: 28.9784 },
  { name: 'Jakarta', lat: -6.2088, lng: 106.8456 }
];

export default function HomePage() {
  const { coords, loading: geoLoading, error: geoError, setError: setGeoError, requestLocation } = useGeolocation();
  const [radiusKm, setRadiusKm] = useState(10);
  const [mosques, setMosques] = useState([]);
  const [loadingMosques, setLoadingMosques] = useState(false);
  const [hasScanned, setHasScanned] = useState(false);
  const [fetchError, setFetchError] = useState(null);

  const fetchNearby = useCallback(async (lat, lng, radius) => {
    setLoadingMosques(true);
    setFetchError(null);
    try {
      const res = await api.getNearbyMosques({
        lat,
        lng,
        radius: radius * 1000 // km to meters
      });
      setMosques(res.data || []);
      setHasScanned(true);
    } catch (err) {
      setFetchError(err.message || 'Failed to fetch nearby mosques.');
    } finally {
      setLoadingMosques(false);
    }
  }, []);

  const handleScan = async (customCoords = null) => {
    try {
      const targetCoords = await requestLocation(customCoords);
      if (targetCoords) {
        await fetchNearby(targetCoords.lat, targetCoords.lng, radiusKm);
      }
    } catch {
      // Error is set in hook
    }
  };

  const handleRadiusChange = (newRadius) => {
    setRadiusKm(newRadius);
    if (coords) {
      fetchNearby(coords.lat, coords.lng, newRadius);
    }
  };

  const isLoading = geoLoading || loadingMosques;

  return (
    <div className="home-page">
      {/* Hero Section */}
      <section className="hero-section glass-card">
        <div className="hero-badge-wrapper">
          <Badge variant="primary" icon="📡">
            Live Proximity Radar
          </Badge>
        </div>
        <h1 className="hero-title">Find Nearby Mosques & Prayer Spaces</h1>
        <p className="hero-desc">
          Accurate, community-verified mosques calculated dynamically from your real-time position.
        </p>

        <div className="radar-actions">
          <button
            type="button"
            onClick={() => handleScan()}
            disabled={isLoading}
            className="btn btn-primary btn-scan"
          >
            <span className="scan-icon" role="img" aria-label="radar">📡</span>
            {isLoading ? 'Scanning Airwaves...' : 'Scan Near My Location'}
          </button>

          <div className="radius-control">
            <span className="radius-label">Radar Radius:</span>
            <div className="radius-buttons" role="group" aria-label="Radar radius selector">
              {[2, 5, 10, 25].map((km) => (
                <button
                  key={km}
                  type="button"
                  onClick={() => handleRadiusChange(km)}
                  className={`radius-chip ${radiusKm === km ? 'radius-chip-active' : ''}`}
                >
                  {km} km
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Quick city presets */}
        <div className="city-presets">
          <span className="presets-label">Or explore demo cities:</span>
          <div className="preset-chips">
            {CITY_PRESETS.map((city) => (
              <button
                key={city.name}
                type="button"
                className="chip-btn"
                onClick={() => handleScan({ lat: city.lat, lng: city.lng })}
              >
                📍 {city.name}
              </button>
            ))}
          </div>
        </div>

        {geoError && (
          <Alert
            type="warning"
            title="Location Notice"
            message={geoError}
            onClose={() => setGeoError(null)}
            action={
              <button
                type="button"
                onClick={() => handleScan({ lat: 6.5244, lng: 3.3792 })}
                className="btn btn-secondary btn-sm"
              >
                Use Lagos Coordinates
              </button>
            }
          />
        )}

        {fetchError && (
          <Alert
            type="error"
            title="Search Error"
            message={fetchError}
            onClose={() => setFetchError(null)}
          />
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

        {isLoading ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <LoadingSpinner text={`Scanning radar within ${radiusKm}km...`} />
            <MosqueSkeleton count={3} />
          </div>
        ) : mosques.length > 0 ? (
          <div className="mosque-grid">
            {mosques.map((mosque) => (
              <MosqueCard key={mosque._id} mosque={mosque} />
            ))}
          </div>
        ) : hasScanned ? (
          <div className="empty-state glass-card">
            <span className="empty-icon" role="img" aria-label="Pin">📍</span>
            <h3>No Mosques Detected Within {radiusKm}km</h3>
            <p>
              Try expanding your radar radius above, or be the first to contribute a mosque in this locality!
            </p>
            <Link to="/submit" className="btn btn-primary" style={{ marginTop: '16px' }}>
              + Add a Discovered Mosque
            </Link>
          </div>
        ) : (
          <div className="empty-state glass-card">
            <span className="empty-icon" role="img" aria-label="Satellite">📡</span>
            <h3>Radar Ready</h3>
            <p>
              Click <strong>"Scan Near My Location"</strong> or select one of the demo cities above to find prayer spaces around you.
            </p>
          </div>
        )}
      </section>

      <style>{`
        .hero-section {
          text-align: center;
          padding: 48px 24px;
          margin-bottom: 40px;
          background: linear-gradient(180deg, rgba(16, 185, 129, 0.08) 0%, rgba(16, 24, 38, 0.8) 100%);
        }

        .hero-badge-wrapper {
          margin-bottom: 20px;
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
          font-size: 0.85rem;
          font-weight: 600;
          background: rgba(255, 255, 255, 0.05);
          color: var(--text-secondary);
          border: 1px solid var(--border-subtle);
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .radius-chip:hover {
          background: rgba(255, 255, 255, 0.1);
          color: var(--text-primary);
        }

        .radius-chip-active {
          background: var(--primary-500);
          color: white;
          border-color: var(--primary-500);
        }

        .city-presets {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          flex-wrap: wrap;
          margin: 16px 0 24px 0;
        }

        .presets-label {
          font-size: 0.85rem;
          color: var(--text-muted);
        }

        .preset-chips {
          display: flex;
          gap: 8px;
          flex-wrap: wrap;
        }

        .chip-btn {
          background: rgba(255, 255, 255, 0.04);
          border: 1px solid var(--border-subtle);
          color: var(--text-secondary);
          padding: 4px 10px;
          border-radius: var(--radius-full);
          font-size: 0.8rem;
          cursor: pointer;
          transition: all 0.15s ease;
        }

        .chip-btn:hover {
          background: rgba(16, 185, 129, 0.15);
          border-color: var(--primary-500);
          color: var(--text-primary);
        }

        .location-bar {
          display: inline-flex;
          align-items: center;
          gap: 10px;
          padding: 8px 18px;
          background: rgba(0, 0, 0, 0.35);
          border-radius: var(--radius-full);
          border: 1px solid var(--border-subtle);
          font-size: 0.88rem;
          color: var(--text-secondary);
          margin-top: 10px;
          flex-wrap: wrap;
          justify-content: center;
        }

        .location-bar code {
          color: var(--primary-400);
          background: rgba(16, 185, 129, 0.1);
          padding: 2px 6px;
          border-radius: 4px;
        }

        .radar-range-info {
          color: var(--text-muted);
          font-size: 0.82rem;
        }

        .results-section {
          margin-top: 20px;
        }

        .section-header {
          display: flex;
          align-items: baseline;
          justify-content: space-between;
          margin-bottom: 24px;
          flex-wrap: wrap;
          gap: 10px;
        }

        .section-sub {
          color: var(--text-muted);
          font-size: 0.9rem;
        }

        .empty-state {
          text-align: center;
          padding: 60px 20px;
          margin-top: 20px;
        }

        .empty-icon {
          font-size: 3rem;
          display: block;
          margin-bottom: 12px;
        }

        .empty-state h3 {
          margin-bottom: 8px;
        }

        .empty-state p {
          color: var(--text-secondary);
          max-width: 440px;
          margin: 0 auto;
        }
      `}</style>
    </div>
  );
}
