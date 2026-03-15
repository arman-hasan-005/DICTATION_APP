import { Link } from 'react-router-dom';
import LoginForm from '../components/LoginForm/LoginForm';
import { useLoginForm } from '../hooks/useLoginForm';
import { ROUTES } from '../../../constants/routes';
import styles from './AuthPage.module.css';

export default function LoginPage() {
  const { fields, errors, loading, apiError, handleChange, handleSubmit } = useLoginForm();
  return (
    <div className={styles.page}>
      <div className={styles.card}>
        <div className={styles.header}>
          <div className={styles.logo}>🎙️</div>
          <h1 className={styles.title}>Welcome back</h1>
          <p className={styles.subtitle}>Log in to continue your practice</p>
        </div>
        <LoginForm fields={fields} errors={errors} loading={loading} apiError={apiError} onChange={handleChange} onSubmit={handleSubmit} />
        <p className={styles.footer}>Don&apos;t have an account? <Link to={ROUTES.REGISTER} className={styles.link}>Sign up free</Link></p>
      </div>
    </div>
  );
}
