import { Routes, Route, Link } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import MainLayout from './layouts/MainLayout';
import HomePage from './pages/HomePage';
import ExplorePage from './pages/ExplorePage';
import SubmitMosquePage from './pages/SubmitMosquePage';
import MosqueDetailPage from './pages/MosqueDetailPage';
import ModerationPage from './pages/ModerationPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import ProfilePage from './pages/ProfilePage';
import ProtectedRoute from './components/ProtectedRoute';

function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/" element={<MainLayout />}>
          <Route index element={<HomePage />} />
          <Route path="explore" element={<ExplorePage />} />
          <Route path="submit" element={<SubmitMosquePage />} />
          <Route path="mosque/:id" element={<MosqueDetailPage />} />
          <Route path="login" element={<LoginPage />} />
          <Route path="register" element={<RegisterPage />} />
          <Route
            path="profile"
            element={
              <ProtectedRoute>
                <ProfilePage />
              </ProtectedRoute>
            }
          />
          <Route
            path="moderation"
            element={
              <ProtectedRoute roles={['moderator', 'admin']}>
                <ModerationPage />
              </ProtectedRoute>
            }
          />
          <Route path="*" element={<NotFoundPage />} />
        </Route>
      </Routes>
    </AuthProvider>
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
