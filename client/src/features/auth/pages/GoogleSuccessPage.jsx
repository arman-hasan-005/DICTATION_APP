/**
 * GoogleSuccessPage
 *
 * The server redirects here after a successful Google OAuth flow:
 *   /auth/google/success?token=<jwt>
 *
 * This page:
 *   1. Reads the token from the URL query string
 *   2. Calls loginWithToken() to store it and fetch the user
 *   3. Redirects to /dashboard
 *   4. Shows an error state if anything goes wrong
 */
import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../../hooks/useAuth';
import Loader from '../../../components/ui/Loader/Loader';
import Button from '../../../components/ui/Button/Button';
import { ROUTES } from '../../../constants/routes';
import styles from './AuthPage.module.css';

export default function GoogleSuccessPage() {
  const navigate          = useNavigate();
  const [params]          = useSearchParams();
  const { loginWithToken } = useAuth();
  const [error, setError]  = useState('');

  useEffect(() => {
    const token = params.get('token');

    if (!token) {
      setError('No token received from Google. Please try again.');
      return;
    }

    loginWithToken(token)
      .then(() => navigate(ROUTES.DASHBOARD, { replace: true }))
      .catch(() => setError('Could not sign you in. Please try again.'));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (error) {
    return (
      <div className={styles.page}>
        <div className={styles.card}>
          <div className={styles.header}>
            <div className={styles.logo}>❌</div>
            <h1 className={styles.title}>Sign-in failed</h1>
            <p className={styles.subtitle}>{error}</p>
          </div>
          <Button fullWidth onClick={() => navigate(ROUTES.LOGIN)}>
            Back to Login
          </Button>
        </div>
      </div>
    );
  }

  return <Loader fullPage text="Signing you in with Google…" />;
}
