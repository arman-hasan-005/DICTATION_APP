import { createContext, useState, useEffect, useCallback } from 'react';
import authService from '../services/authService';

export const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user,    setUser]    = useState(null);
  const [token,   setToken]   = useState(() => localStorage.getItem('token'));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const init = async () => {
      const stored = localStorage.getItem('token');
      if (!stored) { setLoading(false); return; }
      try {
        const res = await authService.getMe();
        setUser(res.data);
      } catch {
        localStorage.removeItem('token');
        setToken(null);
      } finally {
        setLoading(false);
      }
    };
    init();
  }, []);

  const login = useCallback(async (email, password) => {
    const res = await authService.login({ email, password });
    const { token: tok, ...userData } = res.data;
    localStorage.setItem('token', tok);
    setToken(tok);
    setUser(userData);
    return userData;
  }, []);

  const register = useCallback(async (formData) => {
    const res = await authService.register(formData);
    const { token: tok, ...userData } = res.data;
    localStorage.setItem('token', tok);
    setToken(tok);
    setUser(userData);
    return userData;
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('token');
    setToken(null);
    setUser(null);
  }, []);

  const updateUser = useCallback((updatedFields) => {
    setUser((prev) => ({ ...prev, ...updatedFields }));
  }, []);

  return (
    <AuthContext.Provider value={{
      user, token, loading,
      isAuthenticated: !!token && !!user,
      login, register, logout, updateUser,
    }}>
      {children}
    </AuthContext.Provider>
  );
}
