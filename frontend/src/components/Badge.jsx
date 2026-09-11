/**
 * Reusable Badge component for mosque verification status, distances, and chips.
 */
export default function Badge({
  variant = 'neutral',
  children,
  icon,
  className = ''
}) {
  const defaultIcons = {
    verified: '✓',
    pending: '⏳',
    rejected: '✕',
    distance: '📍'
  };

  const badgeIcon = icon !== undefined ? icon : defaultIcons[variant];

  return (
    <span className={`badge badge-${variant} ${className}`}>
      {badgeIcon && <span className="badge-icon-prefix">{badgeIcon}</span>}
      <span className="badge-text">{children}</span>

      <style>{`
        .badge {
          display: inline-flex;
          align-items: center;
          gap: 5px;
          padding: 4px 10px;
          border-radius: var(--radius-full);
          font-size: 0.78rem;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.04em;
          line-height: 1;
          backdrop-filter: blur(8px);
          white-space: nowrap;
          transition: transform 0.15s ease;
        }

        .badge-icon-prefix {
          font-size: 0.85em;
          line-height: 1;
        }

        .badge-verified {
          background: rgba(16, 185, 129, 0.2);
          border: 1px solid rgba(16, 185, 129, 0.5);
          color: #34d399;
        }

        .badge-pending {
          background: rgba(245, 158, 11, 0.2);
          border: 1px solid rgba(245, 158, 11, 0.5);
          color: #fbbf24;
        }

        .badge-rejected {
          background: rgba(239, 68, 68, 0.2);
          border: 1px solid rgba(239, 68, 68, 0.5);
          color: #f87171;
        }

        .badge-distance {
          background: rgba(99, 102, 241, 0.2);
          border: 1px solid rgba(99, 102, 241, 0.5);
          color: #a5b4fc;
        }

        .badge-neutral {
          background: rgba(255, 255, 255, 0.08);
          border: 1px solid rgba(255, 255, 255, 0.15);
          color: var(--text-secondary);
        }

        .badge-primary {
          background: rgba(16, 185, 129, 0.2);
          border: 1px solid rgba(16, 185, 129, 0.4);
          color: var(--primary-400);
        }
      `}</style>
    </span>
  );
}
