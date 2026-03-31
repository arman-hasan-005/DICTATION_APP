/**
 * GoogleRegisterPage — /register/google?pt=<pending_token>
 *
 * Shown to NEW Google users (those without an existing account).
 * Displays their Google profile info and asks them to confirm
 * before the account is created.
 *
 * The `pt` query param is a short-lived JWT (15 min) from the server
 * containing { googleId, email, name }. It is NOT a full auth token.
 *
 * On confirm → POST /api/auth/google/complete → real JWT → dashboard.
 */
import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../../hooks/useAuth';
import authService from '../../../services/authService';
import Button from '../../../components/ui/Button/Button';
import Input  from '../../../components/ui/Input/Input';
import Loader from '../../../components/ui/Loader/Loader';
import { ROUTES } from '../../../constants/routes';
import styles from './AuthPage.module.css';
import formStyles from './GoogleRegisterPage.module.css';

// Decode the JWT payload without verifying (verification happens server-side)
function decodePendingToken(token) {
  try {
    const payload = token.split('.')[1];
    return JSON.parse(atob(payload.replace(/-/g, '+').replace(/_/g, '/')));
  } catch {
    return null;
  }
}

export default function GoogleRegisterPage() {
  const navigate          = useNavigate();
  const [params]          = useSearchParams();
  const { loginWithToken } = useAuth();

  const pendingToken = params.get('pt');
  const profile      = pendingToken ? decodePendingToken(pendingToken) : null;

  const [name,     setName]     = useState(profile?.name || '');
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState('');

  // Redirect if no valid pending token
  useEffect(() => {
    if (!pendingToken || !profile || profile.purpose !== 'google_pending') {
      navigate(ROUTES.LOGIN, { replace: true });
    }
  }, [pendingToken, profile, navigate]);

  if (!pendingToken || !profile) return <Loader fullPage text="Redirecting…" />;

  const handleConfirm = async (e) => {
    e.preventDefault();
    if (!name.trim()) { setError('Please enter your name.'); return; }
    setLoading(true);
    setError('');
    try {
      const res = await authService.googleComplete(pendingToken, name.trim());
      await loginWithToken(res.data.token);
      navigate(ROUTES.DASHBOARD, { replace: true });
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.page}>
      <div className={styles.card}>
        <div className={styles.header}>
          <div className={styles.logo}>🎙️</div>
          <h1 className={styles.title}>Almost there!</h1>
          <p className={styles.subtitle}>
            Confirm your details to create your DictaClass account.
          </p>
        </div>

        {/* Google account preview */}
        <div className={formStyles.profilePreview}>
          <div className={formStyles.previewIcon}>
            <svg viewBox="0 0 24 24" width="28" height="28" aria-hidden="true">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
          </div>
          <div className={formStyles.previewInfo}>
            <p className={formStyles.previewLabel}>Signing up with Google</p>
            <p className={formStyles.previewEmail}>{profile.email}</p>
          </div>
        </div>

        <form onSubmit={handleConfirm} noValidate className={formStyles.form}>
          {error && <div className={formStyles.error}>{error}</div>}

          <Input
            label="Your name"
            type="text"
            name="name"
            placeholder="How should we call you?"
            value={name}
            onChange={(e) => { setName(e.target.value); setError(''); }}
            leftIcon="👤"
            autoComplete="name"
            autoFocus
          />

          <Button type="submit" fullWidth size="lg" loading={loading}>
            Create My Account
          </Button>
        </form>

        <p className={styles.footer}>
          Not you?{' '}
          <Link to={ROUTES.LOGIN} className={styles.link}>Use a different account</Link>
        </p>
      </div>
    </div>
  );
}
