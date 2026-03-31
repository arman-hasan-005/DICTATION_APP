/**
 * ResetPasswordPage — /reset-password?token=<raw_token>
 *
 * FIX: token.trim() is called before sending to server to strip any whitespace
 * that email clients might insert when wrapping long URLs. Also ensures the
 * token from params.get() is used directly without any transformation that
 * could change its value.
 */
import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import authService from '../../../services/authService';
import Button from '../../../components/ui/Button/Button';
import Input  from '../../../components/ui/Input/Input';
import { ROUTES } from '../../../constants/routes';
import styles from './AuthPage.module.css';
import formStyles from './ResetPasswordPage.module.css';

export default function ResetPasswordPage() {
  const navigate    = useNavigate();
  const [params]    = useSearchParams();
  // Trim to remove any whitespace injected by email clients when wrapping URLs
  const token       = params.get('token')?.trim() || '';

  const [fields,  setFields]  = useState({ newPassword: '', confirm: '' });
  const [showPw,  setShowPw]  = useState(false);
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState('');
  const [done,    setDone]    = useState(false);

  // If no token at all, redirect to forgot-password
  useEffect(() => {
    if (!token) navigate(ROUTES.FORGOT_PASSWORD, { replace: true });
  }, [token, navigate]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFields(p => ({ ...p, [name]: value }));
    setError('');
  };

  const validate = () => {
    if (fields.newPassword.length < 6)         return 'Password must be at least 6 characters.';
    if (fields.newPassword !== fields.confirm) return 'Passwords do not match.';
    return null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const err = validate();
    if (err) { setError(err); return; }
    setLoading(true);
    try {
      await authService.resetPassword(token, fields.newPassword);
      setDone(true);
    } catch (err) {
      setError(err.response?.data?.message || 'Reset failed. The link may have expired.');
    } finally {
      setLoading(false);
    }
  };

  if (!token) return null;

  return (
    <div className={styles.page}>
      <div className={styles.card}>
        {done ? (
          <div className={styles.header}>
            <div className={styles.logo}>✅</div>
            <h1 className={styles.title}>Password updated!</h1>
            <p className={styles.subtitle}>Your new password is set. You can now log in.</p>
            <div style={{ marginTop: 24 }}>
              <Button fullWidth size="lg" onClick={() => navigate(ROUTES.LOGIN)}>
                Go to Login
              </Button>
            </div>
          </div>
        ) : (
          <>
            <div className={styles.header}>
              <div className={styles.logo}>🔐</div>
              <h1 className={styles.title}>Set new password</h1>
              <p className={styles.subtitle}>Choose a strong password for your account.</p>
            </div>

            <form onSubmit={handleSubmit} noValidate className={formStyles.form}>
              {error && <div className={formStyles.apiError} role="alert">{error}</div>}

              <Input
                label="New Password"
                type={showPw ? 'text' : 'password'}
                name="newPassword"
                placeholder="Min. 6 characters"
                value={fields.newPassword}
                onChange={handleChange}
                leftIcon="🔒"
                rightIcon={
                  <button type="button" onClick={() => setShowPw(v => !v)}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 16 }}
                    aria-label={showPw ? 'Hide password' : 'Show password'}>
                    {showPw ? '🙈' : '👁️'}
                  </button>
                }
                autoComplete="new-password"
              />

              <Input
                label="Confirm Password"
                type={showPw ? 'text' : 'password'}
                name="confirm"
                placeholder="Repeat your password"
                value={fields.confirm}
                onChange={handleChange}
                leftIcon="🔒"
                autoComplete="new-password"
              />

              <Button type="submit" fullWidth size="lg" loading={loading}>
                Update Password
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
