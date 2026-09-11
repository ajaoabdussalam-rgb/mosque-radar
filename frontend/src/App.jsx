import { Routes, Route, Link } from 'react-router-dom';
import MainLayout from './layouts/MainLayout';
import HomePage from './pages/HomePage';
import ExplorePage from './pages/ExplorePage';
import SubmitMosquePage from './pages/SubmitMosquePage';
import MosqueDetailPage from './pages/MosqueDetailPage';
import ModerationPage from './pages/ModerationPage';

function App() {
  return (
    <Routes>
      <Route path="/" element={<MainLayout />}>
        <Route index element={<HomePage />} />
        <Route path="explore" element={<ExplorePage />} />
        <Route path="submit" element={<SubmitMosquePage />} />
        <Route path="mosque/:id" element={<MosqueDetailPage />} />
        <Route path="moderation" element={<ModerationPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  );
}

function NotFoundPage() {
  return (
    <div className="glass-card" style={{ textAlign: 'center', padding: '60px 20px', marginTop: '40px' }}>
      <span style={{ fontSize: '4rem', display: 'block', marginBottom: '16px' }} role="img" aria-label="Compass">🧭</span>
      <h1>404 — Off the Radar</h1>
      <p style={{ color: 'var(--text-secondary)', margin: '12px 0 28px 0', fontSize: '1.05rem' }}>
        The page you're looking for doesn't exist or has been moved.
      </p>
      <Link to="/" className="btn btn-primary">
        ← Return to Radar
      </Link>
    </div>
  );
}

export default App;
