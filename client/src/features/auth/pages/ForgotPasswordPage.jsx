import { useState } from 'react';
import { Link } from 'react-router-dom';
import authService from '../../../services/authService';
import Button from '../../../components/ui/Button/Button';
import Input from '../../../components/ui/Input/Input';
import { ROUTES } from '../../../constants/routes';
import styles from './AuthPage.module.css';

export default function ForgotPasswordPage() {
  const [email,    setEmail]   = useState('');
  const [loading,  setLoading] = useState(false);
  const [sent,     setSent]    = useState(false);
  const [error,    setError]   = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email.trim()) { setError('Email is required.'); return; }
    setLoading(true);
    setError('');
    try {
      await authService.forgotPassword(email.trim());
      setSent(true);
    } catch {
      // Always show success to prevent email enumeration
      setSent(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.page}>
      <div className={styles.card}>
        {sent ? (
          /* ── Success state ── */
          <>
            <div className={styles.header}>
              <div className={styles.logo}>📧</div>
              <h1 className={styles.title}>Check your inbox</h1>
              <p className={styles.subtitle}>
                If <strong>{email}</strong> is registered, we have sent a password reset link.
                Check your spam folder if it doesn&apos;t arrive within a few minutes.
              </p>
            </div>
            <Link to={ROUTES.LOGIN} className={styles.link} style={{ display: 'block', textAlign: 'center', marginTop: 16 }}>
              ← Back to login
            </Link>
          </>
        ) : (
          /* ── Form state ── */
          <>
            <div className={styles.header}>
              <div className={styles.logo}>🔑</div>
              <h1 className={styles.title}>Forgot password?</h1>
              <p className={styles.subtitle}>
                Enter your email and we&apos;ll send you a link to reset your password.
              </p>
            </div>
            <form onSubmit={handleSubmit} noValidate>
              {error && <div className={styles.apiError}>{error}</div>}
              <Input
                label="Email address"
                type="email"
                name="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => { setEmail(e.target.value); setError(''); }}
                leftIcon="✉️"
                autoComplete="email"
              />
              <Button type="submit" fullWidth size="lg" loading={loading} style={{ marginTop: 8 }}>
                Send Reset Link
              </Button>
            </form>
            <p className={styles.footer}>
              <Link to={ROUTES.LOGIN} className={styles.link}>← Back to login</Link>
            </p>
          </>
        )}
      </div>
    </div>
  );
}
