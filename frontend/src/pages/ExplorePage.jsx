import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../services/api';
import MosqueCard from '../components/MosqueCard';
import LoadingSpinner from '../components/LoadingSpinner';
import MosqueSkeleton from '../components/MosqueSkeleton';
import Alert from '../components/Alert';
import Badge from '../components/Badge';

export default function ExplorePage() {
  const [mosques, setMosques] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const handlePageChange = (newPage) => {
    setLoading(true);
    setPage(newPage);
  };

  useEffect(() => {
    let ignore = false;

    async function loadMosques() {
      try {
        const res = await api.getMosques({ page, limit: 12 });
        if (!ignore) {
          setMosques(res.data || []);
          setTotalPages(res.totalPages || 1);
          setError(null);
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
  }, [page]);

  // Client-side search filtering on current loaded batch
  const filtered = mosques.filter(
    (m) =>
      m.name?.toLowerCase().includes(search.toLowerCase()) ||
      m.address?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="explore-page">
      <div className="explore-header">
        <div className="explore-title-row">
          <h1>All Verified Mosques</h1>
          <Badge variant="verified" icon="✓">
            Directory
          </Badge>
        </div>
        <p className="explore-sub">Browse community-verified mosques and prayer facilities.</p>
      </div>

      <div className="filter-bar glass-card">
        <div className="search-box">
          <span className="search-icon" role="img" aria-label="search">🔍</span>
          <input
            type="text"
            className="search-input"
            placeholder="Search by mosque name, area, or city..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
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
      </div>

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

      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <LoadingSpinner text="Loading verified mosques..." />
          <MosqueSkeleton count={6} />
        </div>
      ) : filtered.length > 0 ? (
        <>
          <div className="mosque-grid">
            {filtered.map((mosque) => (
              <MosqueCard key={mosque._id} mosque={mosque} />
            ))}
          </div>

          {totalPages > 1 && (
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
        <div className="empty-state glass-card">
          <span className="empty-icon" role="img" aria-label="mosque">🕌</span>
          <h3>{search ? 'No Matching Mosques Found' : 'No Mosques Listed Yet'}</h3>
          <p>
            {search
              ? `We couldn't find any mosques matching "${search}". Try searching with a different term.`
              : 'Our verified directory is expanding. You can help by submitting mosques in your area!'}
          </p>
          <div style={{ marginTop: '16px', display: 'flex', gap: '10px', justifyContent: 'center' }}>
            {search && (
              <button
                type="button"
                onClick={() => setSearch('')}
                className="btn btn-secondary"
              >
                Clear Search
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
          padding: 16px 20px;
        }

        .search-box {
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
      `}</style>
    </div>
  );
}
