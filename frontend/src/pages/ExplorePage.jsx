import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../services/api';
import { useGeolocation } from '../hooks/useGeolocation';
import MosqueCard from '../components/MosqueCard';
import LoadingSpinner from '../components/LoadingSpinner';
import MosqueSkeleton from '../components/MosqueSkeleton';
import Alert from '../components/Alert';
import Badge from '../components/Badge';
import MapView from '../components/MapView';

const RADIUS_OPTIONS = [
  { label: 'All', value: null },
  { label: '2 km', value: 2 },
  { label: '5 km', value: 5 },
  { label: '10 km', value: 10 },
  { label: '25 km', value: 25 }
];

/**
 * Custom hook for debouncing a value.
 * Returns the debounced value after the specified delay.
 */
function useDebounce(value, delay = 300) {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);

  return debounced;
}

export default function ExplorePage() {
  const [mosques, setMosques] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [view, setView] = useState('list'); // 'list' | 'map'
  const [radiusKm, setRadiusKm] = useState(null); // null = "All" (no radius filter)

  const { coords, loading: geoLoading, requestLocation } = useGeolocation();

  const debouncedSearch = useDebounce(search, 300);

  // When the user changes the search, reset to page 1
  const prevSearch = useRef(debouncedSearch);
  useEffect(() => {
    if (prevSearch.current !== debouncedSearch) {
      prevSearch.current = debouncedSearch;
      setPage(1);
    }
  }, [debouncedSearch]);

  // When radius changes, reset to page 1
  const prevRadius = useRef(radiusKm);
  useEffect(() => {
    if (prevRadius.current !== radiusKm) {
      prevRadius.current = radiusKm;
      setPage(1);
    }
  }, [radiusKm]);

  // Main data fetch effect
  useEffect(() => {
    let ignore = false;

    async function loadMosques() {
      setLoading(true);
      setError(null);

      try {
        let res;

        if (radiusKm !== null && coords) {
          // Proximity mode: use getNearbyMosques endpoint
          res = await api.getNearbyMosques({
            lat: coords.lat,
            lng: coords.lng,
            radius: radiusKm * 1000 // km to meters
          });
          if (!ignore) {
            setMosques(res.data || []);
            setTotalPages(1); // Nearby results are not paginated
          }
        } else {
          // Standard mode: use getMosques with optional text search
          res = await api.getMosques({
            page,
            limit: 12,
            search: debouncedSearch || undefined
          });
          if (!ignore) {
            setMosques(res.data || []);
            setTotalPages(res.totalPages || 1);
          }
        }
      } catch (err) {
        if (!ignore) {
          setError(err.message || 'Failed to load mosque directory');
        }
      } finally {
        if (!ignore) {
          setLoading(false);
        }
      }
    }

    loadMosques();

    return () => {
      ignore = true;
    };
  }, [page, debouncedSearch, radiusKm, coords]);

  const handlePageChange = (newPage) => {
    setPage(newPage);
  };

  const handleRadiusChange = async (newRadius) => {
    if (newRadius !== null && !coords) {
      // Need location for radius filtering — request it
      try {
        await requestLocation();
      } catch {
        // Error is set in hook; user can still use the All filter
        return;
      }
    }
    setRadiusKm(newRadius);
  };

  const isProximityMode = radiusKm !== null && coords;

  return (
    <div className="explore-page">
      <div className="explore-header">
        <div className="explore-title-row">
          <h1>Mosque Directory</h1>
          <Badge variant="verified" icon="✓">
            {isProximityMode ? 'Nearby' : 'Directory'}
          </Badge>
        </div>
        <p className="explore-sub">
          {isProximityMode
            ? `Showing verified mosques within ${radiusKm}km of your location`
            : 'Browse and search community-verified mosques and prayer facilities.'}
        </p>
      </div>

      {/* Search & Filters */}
      <div className="filter-bar glass-card">
        <div className="filter-row">
          {/* Search Input */}
          <div className="search-box">
            <span className="search-icon" role="img" aria-label="search">🔍</span>
            <input
              type="text"
              className="search-input"
              placeholder="Search mosque name, area, or city..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              id="explore-search"
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch('')}
                className="search-clear"
                aria-label="Clear search"
              >
                ✕
              </button>
            )}
          </div>

          {/* View Toggle */}
          <div className="view-toggle" role="group" aria-label="View mode">
            <button
              type="button"
              className={`view-btn ${view === 'list' ? 'view-btn-active' : ''}`}
              onClick={() => setView('list')}
              aria-pressed={view === 'list'}
              title="List view"
            >
              <span className="view-icon">☰</span> List
            </button>
            <button
              type="button"
              className={`view-btn ${view === 'map' ? 'view-btn-active' : ''}`}
              onClick={() => setView('map')}
              aria-pressed={view === 'map'}
              title="Map view"
            >
              <span className="view-icon">🗺️</span> Map
            </button>
          </div>
        </div>

        {/* Radius Filter */}
        <div className="radius-filter-row">
          <span className="radius-filter-label">Filter by radius:</span>
          <div className="radius-chips" role="group" aria-label="Radius filter">
            {RADIUS_OPTIONS.map((opt) => (
              <button
                key={opt.label}
                type="button"
                className={`radius-chip ${radiusKm === opt.value ? 'radius-chip-active' : ''}`}
                onClick={() => handleRadiusChange(opt.value)}
                disabled={geoLoading && opt.value !== null}
              >
                {opt.label}
              </button>
            ))}
          </div>
          {isProximityMode && (
            <span className="proximity-indicator">
              🎯 {coords.lat.toFixed(3)}, {coords.lng.toFixed(3)}
            </span>
          )}
        </div>
      </div>

      {/* Error State */}
      {error && (
        <Alert
          type="error"
          title="Directory Error"
          message={error}
          onClose={() => setError(null)}
          action={
            <button
              type="button"
              onClick={() => handlePageChange(page)}
              className="btn btn-secondary btn-sm"
            >
              Retry
            </button>
          }
        />
      )}

      {/* Results */}
      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <LoadingSpinner text={isProximityMode ? `Scanning within ${radiusKm}km...` : 'Loading mosques...'} />
          {view === 'list' && <MosqueSkeleton count={6} />}
        </div>
      ) : mosques.length > 0 ? (
        <>
          {/* Results count header */}
          <div className="results-header">
            <span className="results-count">
              {mosques.length} mosque{mosques.length !== 1 ? 's' : ''} found
              {debouncedSearch && ` for "${debouncedSearch}"`}
              {isProximityMode && ` within ${radiusKm}km`}
            </span>
            {isProximityMode && (
              <span className="results-sort-hint">Sorted by closest distance</span>
            )}
          </div>

          {/* List View */}
          {view === 'list' ? (
            <>
              <div className="mosque-grid">
                {mosques.map((mosque) => (
                  <MosqueCard key={mosque._id} mosque={mosque} />
                ))}
              </div>

              {!isProximityMode && totalPages > 1 && (
                <nav className="pagination" aria-label="Mosque directory pagination">
                  <button
                    type="button"
                    disabled={page <= 1}
                    onClick={() => handlePageChange(Math.max(1, page - 1))}
                    className="btn btn-secondary btn-sm"
                  >
                    ← Previous
                  </button>
                  <span className="page-indicator">
                    Page {page} of {totalPages}
                  </span>
                  <button
                    type="button"
                    disabled={page >= totalPages}
                    onClick={() => handlePageChange(page + 1)}
                    className="btn btn-secondary btn-sm"
                  >
                    Next →
                  </button>
                </nav>
              )}
            </>
          ) : (
            /* Map View */
            <MapView
              mosques={mosques}
              userCoords={coords}
              radiusKm={radiusKm || 10}
            />
          )}
        </>
      ) : (
        <div className="empty-state glass-card">
          <span className="empty-icon" role="img" aria-label="mosque">🕌</span>
          <h3>
            {debouncedSearch
              ? 'No Matching Mosques Found'
              : isProximityMode
                ? `No Mosques Within ${radiusKm}km`
                : 'No Mosques Listed Yet'}
          </h3>
          <p>
            {debouncedSearch
              ? `We couldn't find any mosques matching "${debouncedSearch}". Try searching with a different term.`
              : isProximityMode
                ? 'Try expanding your radius or switch to "All" to browse the full directory.'
                : 'Our verified directory is expanding. You can help by submitting mosques in your area!'}
          </p>
          <div style={{ marginTop: '16px', display: 'flex', gap: '10px', justifyContent: 'center', flexWrap: 'wrap' }}>
            {debouncedSearch && (
              <button
                type="button"
                onClick={() => setSearch('')}
                className="btn btn-secondary"
              >
                Clear Search
              </button>
            )}
            {isProximityMode && (
              <button
                type="button"
                onClick={() => setRadiusKm(null)}
                className="btn btn-secondary"
              >
                Show All
              </button>
            )}
            <Link to="/submit" className="btn btn-primary">
              + Submit a Mosque
            </Link>
          </div>
        </div>
      )}

      <style>{`
        .explore-page {
          padding-top: 10px;
        }

        .explore-header {
          margin-bottom: 28px;
        }

        .explore-title-row {
          display: flex;
          align-items: center;
          gap: 12px;
          flex-wrap: wrap;
        }

        .explore-header h1 {
          font-size: 2.2rem;
          margin: 0;
        }

        .explore-sub {
          color: var(--text-secondary);
          margin-top: 8px;
          font-size: 1.05rem;
        }

        .filter-bar {
          margin-bottom: 32px;
          padding: 18px 20px;
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .filter-row {
          display: flex;
          gap: 12px;
          align-items: stretch;
        }

        .search-box {
          flex: 1;
          display: flex;
          align-items: center;
          gap: 12px;
          background: rgba(0, 0, 0, 0.25);
          border: 1px solid var(--border-subtle);
          border-radius: var(--radius-md);
          padding: 8px 16px;
          transition: border-color 0.2s;
        }

        .search-box:focus-within {
          border-color: var(--primary-500);
        }

        .search-icon {
          font-size: 1.1rem;
          opacity: 0.7;
        }

        .search-input {
          flex: 1;
          background: transparent;
          border: none;
          color: var(--text-primary);
          font-size: 1rem;
          outline: none;
        }

        .search-clear {
          background: none;
          border: none;
          color: var(--text-muted);
          cursor: pointer;
          font-size: 0.9rem;
          padding: 4px;
        }

        .search-clear:hover {
          color: var(--text-primary);
        }

        /* View Toggle */
        .view-toggle {
          display: flex;
          border: 1px solid var(--border-subtle);
          border-radius: var(--radius-md);
          overflow: hidden;
          flex-shrink: 0;
        }

        .view-btn {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 8px 16px;
          background: rgba(0, 0, 0, 0.2);
          border: none;
          color: var(--text-muted);
          font-size: 0.85rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s ease;
          font-family: var(--font-body);
        }

        .view-btn:not(:last-child) {
          border-right: 1px solid var(--border-subtle);
        }

        .view-btn:hover {
          background: rgba(255, 255, 255, 0.06);
          color: var(--text-secondary);
        }

        .view-btn-active {
          background: rgba(16, 185, 129, 0.15);
          color: var(--primary-500);
        }

        .view-icon {
          font-size: 0.95rem;
        }

        /* Radius Filter */
        .radius-filter-row {
          display: flex;
          align-items: center;
          gap: 12px;
          flex-wrap: wrap;
        }

        .radius-filter-label {
          font-size: 0.85rem;
          color: var(--text-secondary);
          font-weight: 600;
          white-space: nowrap;
        }

        .radius-chips {
          display: flex;
          gap: 6px;
        }

        .radius-chip {
          padding: 5px 13px;
          border-radius: var(--radius-full);
          font-size: 0.82rem;
          font-weight: 600;
          background: rgba(255, 255, 255, 0.05);
          color: var(--text-secondary);
          border: 1px solid var(--border-subtle);
          cursor: pointer;
          transition: all 0.2s ease;
          font-family: var(--font-body);
        }

        .radius-chip:hover:not(:disabled) {
          background: rgba(255, 255, 255, 0.1);
          color: var(--text-primary);
        }

        .radius-chip-active {
          background: var(--primary-500);
          color: white;
          border-color: var(--primary-500);
        }

        .radius-chip:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .proximity-indicator {
          margin-left: auto;
          font-size: 0.8rem;
          color: var(--primary-500);
          background: rgba(16, 185, 129, 0.1);
          padding: 3px 10px;
          border-radius: var(--radius-full);
          font-family: monospace;
        }

        /* Results Header */
        .results-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 20px;
          flex-wrap: wrap;
          gap: 8px;
        }

        .results-count {
          font-size: 0.9rem;
          color: var(--text-secondary);
          font-weight: 600;
        }

        .results-sort-hint {
          font-size: 0.82rem;
          color: var(--text-muted);
          font-style: italic;
        }

        /* Pagination */
        .pagination {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 16px;
          margin-top: 40px;
        }

        .page-indicator {
          color: var(--text-secondary);
          font-size: 0.9rem;
          font-weight: 600;
        }

        /* Empty state */
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

        /* Responsive */
        @media (max-width: 640px) {
          .filter-row {
            flex-direction: column;
          }

          .view-toggle {
            align-self: stretch;
          }

          .view-btn {
            flex: 1;
            justify-content: center;
          }

          .radius-filter-row {
            flex-direction: column;
            align-items: flex-start;
          }

          .proximity-indicator {
            margin-left: 0;
          }
        }
      `}</style>
    </div>
  );
}
