import { useState, useEffect, useCallback } from 'react';
import { api } from '../services/api';
import { AuthContext } from './authContextDef';

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem('token') || null);
  const [user, setUser] = useState(() => {
    try {
      const savedUser = localStorage.getItem('user');
      return savedUser ? JSON.parse(savedUser) : null;
    } catch {
      return null;
    }
  });
  const [loading, setLoading] = useState(true);

  // Validate and refresh user session on mount if token exists
  useEffect(() => {
    let ignore = false;

    async function verifySession() {
      const storedToken = localStorage.getItem('token');
      if (!storedToken) {
        setLoading(false);
        return;
      }

      try {
        const res = await api.getMe();
        if (!ignore && res.success && res.user) {
          setUser(res.user);
          localStorage.setItem('user', JSON.stringify(res.user));
        }
      } catch {
        // Token invalid or expired — clear stale session
        if (!ignore) {
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          setToken(null);
          setUser(null);
        }
      } finally {
        if (!ignore) {
          setLoading(false);
        }
      }
    }

    verifySession();

    return () => {
      ignore = true;
    };
  }, []);

  const login = useCallback(async (email, password) => {
    const res = await api.login({ email, password });
    if (res.token && res.user) {
      localStorage.setItem('token', res.token);
      localStorage.setItem('user', JSON.stringify(res.user));
      setToken(res.token);
      setUser(res.user);
    }
    return res;
  }, []);

  const register = useCallback(async (name, email, password) => {
    const res = await api.register({ name, email, password });
    if (res.token && res.user) {
      localStorage.setItem('token', res.token);
      localStorage.setItem('user', JSON.stringify(res.user));
      setToken(res.token);
      setUser(res.user);
    }
    return res;
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setToken(null);
    setUser(null);
  }, []);

  const refreshUser = useCallback(async () => {
    try {
      const res = await api.getMe();
      if (res.success && res.user) {
        setUser(res.user);
        localStorage.setItem('user', JSON.stringify(res.user));
      }
    } catch {
      logout();
    }
  }, [logout]);

  const value = {
    user,
    token,
    loading,
    isAuthenticated: !!user && !!token,
    isModerator: user?.role === 'moderator' || user?.role === 'admin',
    isAdmin: user?.role === 'admin',
    login,
    register,
    logout,
    refreshUser
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}
