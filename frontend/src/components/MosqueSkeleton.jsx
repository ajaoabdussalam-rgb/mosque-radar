/**
 * Glassmorphic loading skeleton for mosque cards with smooth shimmer animation.
 */
export default function MosqueSkeleton({ count = 3 }) {
  const skeletons = Array.from({ length: count });

  return (
    <div className="skeleton-grid">
      {skeletons.map((_, idx) => (
        <article key={idx} className="glass-card skeleton-card" aria-hidden="true">
          <div className="skeleton-media shimmer" />
          <div className="skeleton-body">
            <div className="skeleton-line skeleton-title shimmer" />
            <div className="skeleton-line skeleton-address shimmer" />
            <div className="skeleton-chips">
              <div className="skeleton-chip shimmer" />
              <div className="skeleton-chip shimmer" />
            </div>
            <div className="skeleton-actions">
              <div className="skeleton-btn shimmer" />
              <div className="skeleton-btn shimmer" />
            </div>
          </div>
        </article>
      ))}

      <style>{`
        .skeleton-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
          gap: 24px;
          width: 100%;
        }

        .skeleton-card {
          padding: 0;
          overflow: hidden;
          display: flex;
          flex-direction: column;
          border: 1px solid var(--border-subtle);
          background: var(--bg-surface);
        }

        .skeleton-media {
          width: 100%;
          height: 190px;
          background: rgba(255, 255, 255, 0.04);
        }

        .skeleton-body {
          padding: 20px;
          display: flex;
          flex-direction: column;
          gap: 14px;
        }

        .skeleton-line {
          height: 16px;
          border-radius: var(--radius-sm);
          background: rgba(255, 255, 255, 0.05);
        }

        .skeleton-title {
          width: 75%;
          height: 22px;
        }

        .skeleton-address {
          width: 90%;
        }

        .skeleton-chips {
          display: flex;
          gap: 8px;
        }

        .skeleton-chip {
          width: 80px;
          height: 24px;
          border-radius: var(--radius-full);
          background: rgba(255, 255, 255, 0.04);
        }

        .skeleton-actions {
          display: flex;
          gap: 10px;
          margin-top: 8px;
        }

        .skeleton-btn {
          flex: 1;
          height: 36px;
          border-radius: var(--radius-md);
          background: rgba(255, 255, 255, 0.06);
        }

        .shimmer {
          background: linear-gradient(
            90deg,
            rgba(255, 255, 255, 0.03) 0%,
            rgba(255, 255, 255, 0.08) 50%,
            rgba(255, 255, 255, 0.03) 100%
          );
          background-size: 200% 100%;
          animation: shimmerAnimation 1.5s infinite;
        }

        @keyframes shimmerAnimation {
          0% {
            background-position: 200% 0;
          }
          100% {
            background-position: -200% 0;
          }
        }
      `}</style>
    </div>
  );
}
