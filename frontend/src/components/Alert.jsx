/**
 * Reusable Alert banner component for notifications, warnings, errors, and empty states.
 */
export default function Alert({
  type = 'info',
  title,
  message,
  children,
  onClose,
  action,
  className = ''
}) {
  const icons = {
    info: 'ℹ️',
    success: '✅',
    warning: '⚠️',
    error: '🚨'
  };

  const icon = icons[type] || 'ℹ️';

  return (
    <div className={`alert-banner alert-${type} ${className}`} role="alert">
      <span className="alert-icon" aria-hidden="true">
        {icon}
      </span>
      <div className="alert-body">
        {title && <h4 className="alert-title">{title}</h4>}
        {message && <p className="alert-message">{message}</p>}
        {children}
      </div>
      {action && <div className="alert-action">{action}</div>}
      {onClose && (
        <button
          type="button"
          className="alert-close"
          onClick={onClose}
          aria-label="Dismiss alert"
        >
          ✕
        </button>
      )}

      <style>{`
        .alert-banner {
          display: flex;
          align-items: flex-start;
          gap: 12px;
          padding: 14px 18px;
          border-radius: var(--radius-md);
          margin: 12px 0;
          font-size: 0.95rem;
          line-height: 1.5;
          backdrop-filter: blur(8px);
          position: relative;
          animation: alertFadeIn 0.25s ease-out;
        }

        @keyframes alertFadeIn {
          from {
            opacity: 0;
            transform: translateY(-4px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .alert-error {
          background: rgba(239, 68, 68, 0.12);
          border: 1px solid rgba(239, 68, 68, 0.35);
          color: #fca5a5;
        }

        .alert-warning {
          background: rgba(245, 158, 11, 0.12);
          border: 1px solid rgba(245, 158, 11, 0.35);
          color: #fcd34d;
        }

        .alert-success {
          background: rgba(16, 185, 129, 0.12);
          border: 1px solid rgba(16, 185, 129, 0.35);
          color: #6ee7b7;
        }

        .alert-info {
          background: rgba(59, 130, 246, 0.12);
          border: 1px solid rgba(59, 130, 246, 0.35);
          color: #93c5fd;
        }

        .alert-icon {
          font-size: 1.25rem;
          line-height: 1;
          flex-shrink: 0;
          margin-top: 2px;
        }

        .alert-body {
          flex: 1;
        }

        .alert-title {
          font-size: 1rem;
          font-weight: 700;
          margin: 0 0 4px 0;
          color: inherit;
        }

        .alert-message {
          margin: 0;
          color: inherit;
          opacity: 0.95;
        }

        .alert-action {
          margin-left: auto;
          flex-shrink: 0;
        }

        .alert-close {
          background: none;
          border: none;
          color: inherit;
          font-size: 1.1rem;
          cursor: pointer;
          opacity: 0.6;
          padding: 0 4px;
          line-height: 1;
          transition: opacity 0.2s;
        }

        .alert-close:hover {
          opacity: 1;
        }
      `}</style>
    </div>
  );
}
