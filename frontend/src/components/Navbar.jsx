import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';

export default function Navbar() {
  const location = useLocation();
  const [theme, setTheme] = useState(
    localStorage.getItem('theme') || 'dark'
  );

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
  };

  const navLinks = [
    { to: '/', label: 'Nearby Radar' },
    { to: '/explore', label: 'Explore All' },
    { to: '/submit', label: '+ Add Mosque' },
    { to: '/moderation', label: 'Review Queue' }
  ];

  return (
    <header className="navbar-container">
      <div className="navbar-content">
        <Link to="/" className="brand-logo">
          <div className="radar-icon-box">
            <span className="radar-ping"></span>
            <img src="/radar.svg" alt="Mosque Radar Logo" className="brand-img" />
          </div>
          <div className="brand-text">
            <span className="brand-title">Mosque Radar</span>
            <span className="brand-subtitle">Nearby Prayer Discovery</span>
          </div>
        </Link>

        <nav className="nav-links">
          {navLinks.map((link) => {
            const isActive = location.pathname === link.to;
            return (
              <Link
                key={link.to}
                to={link.to}
                className={`nav-link ${isActive ? 'nav-link-active' : ''}`}
              >
                {link.label}
              </Link>
            );
          })}

          <button
            onClick={toggleTheme}
            className="theme-toggle-btn"
            title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
            aria-label="Toggle theme"
          >
            {theme === 'dark' ? '☀️' : '🌙'}
          </button>
        </nav>
      </div>

      <style>{`
        .navbar-container {
          position: sticky;
          top: 0;
          z-index: 100;
          background: var(--bg-glass);
          backdrop-filter: blur(16px);
          -webkit-backdrop-filter: blur(16px);
          border-bottom: 1px solid var(--border-subtle);
          padding: 14px 24px;
          margin-bottom: 30px;
        }

        .navbar-content {
          max-width: 1200px;
          margin: 0 auto;
          display: flex;
          align-items: center;
          justify-content: space-between;
          flex-wrap: wrap;
          gap: 16px;
        }

        .brand-logo {
          display: flex;
          align-items: center;
          gap: 14px;
          color: var(--text-primary);
          text-decoration: none;
        }

        .radar-icon-box {
          position: relative;
          width: 44px;
          height: 44px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .radar-ping {
          position: absolute;
          width: 100%;
          height: 100%;
          border-radius: 50%;
          background: rgba(16, 185, 129, 0.3);
          animation: pulseRadar 2s infinite;
        }

        .brand-img {
          width: 40px;
          height: 40px;
          position: relative;
          z-index: 1;
        }

        .brand-text {
          display: flex;
          flex-direction: column;
        }

        .brand-title {
          font-family: var(--font-heading);
          font-weight: 800;
          font-size: 1.25rem;
          letter-spacing: -0.02em;
          background: linear-gradient(135deg, #10b981 0%, #34d399 50%, #fbbf24 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }

        .brand-subtitle {
          font-size: 0.75rem;
          color: var(--text-muted);
          font-weight: 500;
        }

        .nav-links {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .nav-link {
          padding: 8px 16px;
          border-radius: var(--radius-sm);
          font-size: 0.9rem;
          font-weight: 600;
          color: var(--text-secondary);
          transition: all 0.2s ease;
        }

        .nav-link:hover {
          color: var(--text-primary);
          background: rgba(255, 255, 255, 0.05);
        }

        .nav-link-active {
          color: #34d399 !important;
          background: rgba(16, 185, 129, 0.12);
          border: 1px solid rgba(16, 185, 129, 0.25);
        }

        .theme-toggle-btn {
          background: rgba(255, 255, 255, 0.06);
          border: 1px solid var(--border-subtle);
          padding: 8px 12px;
          border-radius: var(--radius-sm);
          cursor: pointer;
          font-size: 1rem;
          transition: all 0.2s;
        }

        .theme-toggle-btn:hover {
          background: rgba(255, 255, 255, 0.15);
        }

        @media (max-width: 640px) {
          .navbar-content {
            justify-content: center;
          }
          .nav-links {
            flex-wrap: wrap;
            justify-content: center;
          }
        }
      `}</style>
    </header>
  );
}
