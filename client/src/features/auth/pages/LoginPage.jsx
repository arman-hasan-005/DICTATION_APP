import { Link, useLocation } from 'react-router-dom';
import LoginForm    from '../components/LoginForm/LoginForm';
import GoogleButton from '../components/GoogleButton/GoogleButton';
import { useLoginForm } from '../hooks/useLoginForm';
import { ROUTES } from '../../../constants/routes';
import styles from './AuthPage.module.css';

const GOOGLE_ERRORS = {
  google_no_account:
    'No DictaClass account found for this Google account. Please sign up first.',
  google_failed:
    'Google sign-in failed. Please try again or use email and password.',
};

export default function LoginPage() {
  const { fields, errors, loading, apiError, handleChange, handleSubmit } = useLoginForm();
  const location  = useLocation();
  const errorCode = new URLSearchParams(location.search).get('error');
  const googleError = errorCode ? (GOOGLE_ERRORS[errorCode] ?? GOOGLE_ERRORS.google_failed) : null;

  return (
    <div className={styles.page}>
      <div className={styles.card}>
        <div className={styles.header}>
          <div className={styles.logo}>🎙️</div>
          <h1 className={styles.title}>Welcome back</h1>
          <p className={styles.subtitle}>Log in to continue your practice</p>
        </div>

        {/* Google error banner — shown when redirected back with ?error= */}
        {googleError && (
          <div className={styles.apiError} role="alert">
            {googleError}
          </div>
        )}

        {/* Google Login — existing users only */}
        <GoogleButton mode="login" />

        <div className={styles.divider}>or</div>

        <LoginForm
          fields={fields}
          errors={errors}
          loading={loading}
          apiError={apiError}
          onChange={handleChange}
          onSubmit={handleSubmit}
        />

        <p className={styles.footer}>
          Don&apos;t have an account?{' '}
          <Link to={ROUTES.REGISTER} className={styles.link}>Sign up free</Link>
        </p>
      </div>
    </div>
  );
}
