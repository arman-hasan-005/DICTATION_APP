/**
 * AuthContext — extended for Google OAuth + OTP verification
 *
 * NEW:
 *   pendingEmail  — email waiting for OTP verification (set after register)
 *   loginWithToken(token) — used by GoogleSuccessPage after OAuth redirect
 *   register()    — now sets pendingEmail instead of logging user in directly
 */

import { createContext, useState, useEffect, useCallback } from 'react';
import authService from '../services/authService';

export const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user,         setUser]         = useState(null);
  const [token,        setToken]        = useState(() => localStorage.getItem('token'));
  const [loading,      setLoading]      = useState(true);
  const [pendingEmail, setPendingEmail] = useState(() => sessionStorage.getItem('pendingEmail') || null);

  // Rehydrate user on mount
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

  // Keep pendingEmail in sessionStorage so it survives a page refresh
  useEffect(() => {
    if (pendingEmail) sessionStorage.setItem('pendingEmail', pendingEmail);
    else sessionStorage.removeItem('pendingEmail');
  }, [pendingEmail]);

  // ── Login (local) ──────────────────────────────────────────────────────────
  const login = useCallback(async (email, password) => {
    const res = await authService.login({ email, password });
    const { token: tok, ...userData } = res.data;
    localStorage.setItem('token', tok);
    setToken(tok);
    setUser(userData);
    return userData;
  }, []);

  // ── Register — does NOT log in; requires OTP first ─────────────────────────
  const register = useCallback(async (formData) => {
    const res = await authService.register(formData);
    // Server returns requiresVerification: true — no token yet
    if (res.data.requiresVerification) {
      setPendingEmail(formData.email);
      return { requiresVerification: true, email: formData.email };
    }
    // Fallback: account was already verified (e.g. re-register resent OTP)
    setPendingEmail(formData.email);
    return { requiresVerification: true, email: formData.email };
  }, []);

  // ── Verify OTP — logs user in on success ───────────────────────────────────
  const verifyOtp = useCallback(async (email, otp) => {
    const res = await authService.verifyOtp(email, otp);
    const { token: tok, ...userData } = res.data;
    localStorage.setItem('token', tok);
    setToken(tok);
    setUser(userData);
    setPendingEmail(null);
    return userData;
  }, []);

  // ── loginWithToken — used after Google OAuth redirect ─────────────────────
  const loginWithToken = useCallback(async (tok) => {
    localStorage.setItem('token', tok);
    setToken(tok);
    try {
      const res = await authService.getMe();
      setUser(res.data);
      return res.data;
    } catch {
      localStorage.removeItem('token');
      setToken(null);
      throw new Error('Failed to load user after Google login');
    }
  }, []);

  // ── Logout ─────────────────────────────────────────────────────────────────
  const logout = useCallback(() => {
    localStorage.removeItem('token');
    setToken(null);
    setUser(null);
    setPendingEmail(null);
  }, []);

  const updateUser = useCallback((updatedFields) => {
    setUser((prev) => ({ ...prev, ...updatedFields }));
  }, []);

  return (
    <AuthContext.Provider value={{
      user, token, loading,
      isAuthenticated: !!token && !!user,
      pendingEmail, setPendingEmail,
      login, register, verifyOtp, loginWithToken, logout, updateUser,
    }}>
      {children}
    </AuthContext.Provider>
  );
}
