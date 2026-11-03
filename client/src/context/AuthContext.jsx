/**
 * src/context/AuthContext.jsx
 * ---------------------------------------------------------------------------
 * Phase 8 — Global State with the Context API.
 *
 * Owns:  token, user, loading, error
 * Exposes: login(), register(), logout(), clearError()
 *
 * Persistence: the JWT and the user object are written to localStorage so a
 * page refresh (or a new tab) keeps the session. On first mount we read them
 * back and verify the token against GET /api/users/me — if it was revoked or
 * expired, we log out silently.
 * ---------------------------------------------------------------------------
 */
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { api, ApiError, TOKEN_STORAGE_KEY, setAuthToken } from '../api/client.js';

const USER_STORAGE_KEY = 'capstone_user';

const AuthContext = createContext(null);

const readStoredUser = () => {
  try {
    const raw = localStorage.getItem(USER_STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem(TOKEN_STORAGE_KEY) || null);
  const [user, setUser] = useState(readStoredUser);
  // `booting` = true while we verify a stored token on first load; ProtectedRoute
  // waits for it so a refresh on /admin does not flash the login page.
  const [booting, setBooting] = useState(() => Boolean(localStorage.getItem(TOKEN_STORAGE_KEY)));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  /** Persist (or clear) the session in state + localStorage in one place. */
  const persistSession = useCallback((nextToken, nextUser) => {
    setToken(nextToken);
    setUser(nextUser);
    // Register the token in the API layer so every protected request from now
    // on carries "Authorization: Bearer <token>" automatically.
    setAuthToken(nextToken);
    if (nextToken) {
      localStorage.setItem(TOKEN_STORAGE_KEY, nextToken);
      localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(nextUser || {}));
    } else {
      localStorage.removeItem(TOKEN_STORAGE_KEY);
      localStorage.removeItem(USER_STORAGE_KEY);
    }
  }, []);

  // ---- Keep the API layer's token in sync with state (incl. initial load) ----
  useEffect(() => {
    setAuthToken(token);
  }, [token]);

  // ---- Bootstrap: validate a stored token once on mount ----------------
  useEffect(() => {
    if (!token) {
      setBooting(false);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const res = await api.me();
        if (!cancelled) setUser(res.data);
      } catch (err) {
        // 401 => token expired/invalid; network error => keep the cached user
        // so the app still works offline-ish, but do not crash.
        if (!cancelled && err instanceof ApiError && err.status === 401) {
          persistSession(null, null);
        }
      } finally {
        if (!cancelled) setBooting(false);
      }
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // run once

  // ---- login: POST /api/users/login -----------------------------------
  const login = useCallback(
    async (email, password) => {
      setLoading(true);
      setError('');
      try {
        const res = await api.login({ email, password });
        persistSession(res.token, res.user);
        return res.user;
      } catch (err) {
        setError(err.message);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [persistSession]
  );

  // ---- register: POST /api/users/register -----------------------------
  const register = useCallback(
    async (username, email, password) => {
      setLoading(true);
      setError('');
      try {
        const res = await api.register({ username, email, password });
        // The API returns a token on register too, so the user is logged in
        // immediately after signing up.
        persistSession(res.token, res.user);
        return res.user;
      } catch (err) {
        setError(err.message);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [persistSession]
  );

  // ---- logout: clear everything ---------------------------------------
  const logout = useCallback(() => {
    persistSession(null, null);
    setError('');
  }, [persistSession]);

  const clearError = useCallback(() => setError(''), []);

  const value = useMemo(
    () => ({
      token,
      user,
      isAuthenticated: Boolean(token),
      loading,
      booting,
      error,
      login,
      register,
      logout,
      clearError,
    }),
    [token, user, loading, booting, error, login, register, logout, clearError]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

/** Hook with a guard so a missing <AuthProvider> fails fast and clearly. */
export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside an <AuthProvider>');
  return ctx;
}

export default AuthContext;
