import { useState, useEffect } from 'react';
import { api } from '../services/api';
import MosqueCard from '../components/MosqueCard';
import LoadingSpinner from '../components/LoadingSpinner';

export default function ExplorePage() {
  const [mosques, setMosques] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const fetchMosques = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.getMosques({ page, limit: 12 });
      setMosques(res.data || []);
      setTotalPages(res.totalPages || 1);
    } catch (err) {
      setError(err.message || 'Failed to load mosque directory');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMosques();
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
        <h1>All Verified Mosques</h1>
        <p className="explore-sub">Browse community-verified mosques and prayer facilities.</p>
      </div>

      <div className="filter-bar glass-card">
        <div className="search-box">
          <span className="search-icon">🔍</span>
          <input
            type="text"
            className="search-input"
            placeholder="Search by mosque name, area, or city..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          {search && (
            <button onClick={() => setSearch('')} className="search-clear">
              ✕
            </button>
          )}
        </div>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      {loading ? (
        <LoadingSpinner text="Loading verified mosques..." />
      ) : filtered.length > 0 ? (
        <>
          <div className="mosque-grid">
            {filtered.map((mosque) => (
              <MosqueCard key={mosque._id} mosque={mosque} />
            ))}
          </div>

          {totalPages > 1 && (
            <div className="pagination">
              <button
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="btn btn-secondary btn-sm"
              >
                ← Previous
              </button>
              <span className="page-indicator">
                Page {page} of {totalPages}
              </span>
              <button
                disabled={page >= totalPages}
                onClick={() => setPage((p) => p + 1)}
                className="btn btn-secondary btn-sm"
              >
                Next →
              </button>
            </div>
          )}
        </>
      ) : (
        <div className="empty-state glass-card">
          <span className="empty-icon">🕌</span>
          <h3>No Mosques Found</h3>
          <p>We couldn't find any mosques matching "{search}".</p>
        </div>
      )}

      <style>{`
        .explore-header {
          margin-bottom: 24px;
        }

        .explore-sub {
          color: var(--text-secondary);
          font-size: 1.05rem;
          margin-top: 6px;
        }

        .filter-bar {
          margin-bottom: 30px;
          padding: 16px 20px;
        }

        .search-box {
          display: flex;
          align-items: center;
          gap: 12px;
          background: rgba(10, 15, 25, 0.5);
          border: 1px solid var(--border-subtle);
          border-radius: var(--radius-sm);
          padding: 10px 16px;
        }

        .search-icon {
          font-size: 1.1rem;
          color: var(--text-muted);
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
          background: transparent;
          border: none;
          color: var(--text-muted);
          cursor: pointer;
          font-size: 1rem;
        }

        .mosque-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
          gap: 24px;
        }

        .pagination {
          display: flex;
          justify-content: center;
          align-items: center;
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
