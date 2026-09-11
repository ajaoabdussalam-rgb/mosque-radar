import { Outlet, Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import '../App.css';

/**
 * Main application shell layout providing consistent Navbar, container, and Footer.
 */
export default function MainLayout() {
  return (
    <div className="app-layout">
      <Navbar />
      <main className="app-container">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}

function Footer() {
  return (
    <footer className="app-footer">
      <div className="footer-content">
        <div className="footer-brand">
          <span className="footer-logo">📡</span>
          <span className="footer-name">Mosque Radar</span>
        </div>
        <p className="footer-tagline">
          Community-powered mosque discovery — find nearby prayer spaces anywhere.
        </p>
        <div className="footer-links">
          <Link to="/">Nearby Radar</Link>
          <span className="footer-dot">·</span>
          <Link to="/explore">Explore All</Link>
          <span className="footer-dot">·</span>
          <Link to="/submit">Submit a Mosque</Link>
          <span className="footer-dot">·</span>
          <Link to="/moderation">Moderation Queue</Link>
        </div>
        <p className="footer-copy">
          © {new Date().getFullYear()} Mosque Radar. Built with purpose.
        </p>
      </div>

      <style>{`
        .app-layout {
          min-height: 100vh;
          display: flex;
          flex-direction: column;
        }

        .app-container {
          flex: 1;
        }

        .app-footer {
          margin-top: 80px;
          padding: 40px 20px;
          border-top: 1px solid var(--border-subtle);
          text-align: center;
          background: linear-gradient(180deg, transparent 0%, rgba(16, 185, 129, 0.03) 100%);
        }

        .footer-content {
          max-width: 600px;
          margin: 0 auto;
        }

        .footer-brand {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          margin-bottom: 12px;
        }

        .footer-logo {
          font-size: 1.6rem;
        }

        .footer-name {
          font-family: var(--font-heading);
          font-weight: 800;
          font-size: 1.15rem;
          background: linear-gradient(135deg, #10b981 0%, #34d399 50%, #fbbf24 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }

        .footer-tagline {
          color: var(--text-muted);
          font-size: 0.9rem;
          margin-bottom: 16px;
        }

        .footer-links {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          margin-bottom: 20px;
          flex-wrap: wrap;
        }

        .footer-links a {
          font-size: 0.85rem;
          font-weight: 600;
          color: var(--text-secondary);
          transition: color 0.2s;
        }

        .footer-links a:hover {
          color: var(--primary-500);
        }

        .footer-dot {
          color: var(--text-muted);
          font-size: 0.75rem;
        }

        .footer-copy {
          color: var(--text-muted);
          font-size: 0.78rem;
        }
      `}</style>
    </footer>
  );
}
