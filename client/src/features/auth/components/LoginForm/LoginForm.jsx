import { useState } from 'react';
import { Link } from 'react-router-dom';
import Input  from '../../../../components/ui/Input/Input';
import Button from '../../../../components/ui/Button/Button';
import { ROUTES } from '../../../../constants/routes';
import styles from './LoginForm.module.css';

export default function LoginForm({ fields, errors, loading, apiError, onChange, onSubmit }) {
  const [showPw, setShowPw] = useState(false);

  return (
    <form className={styles.form} onSubmit={onSubmit} noValidate>
      {apiError && <div className={styles.apiError}>{apiError}</div>}

      <Input
        label="Email"
        type="email"
        name="email"
        placeholder="you@example.com"
        value={fields.email}
        onChange={onChange}
        error={errors.email}
        autoComplete="email"
        leftIcon="✉️"
      />

      <div className={styles.passwordField}>
        <Input
          label="Password"
          type={showPw ? 'text' : 'password'}
          name="password"
          placeholder="••••••••"
          value={fields.password}
          onChange={onChange}
          error={errors.password}
          autoComplete="current-password"
          leftIcon="🔒"
          rightIcon={
            <button type="button" onClick={() => setShowPw(v => !v)}
              style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 16 }}
              aria-label={showPw ? 'Hide password' : 'Show password'}>
              {showPw ? '🙈' : '👁️'}
            </button>
          }
        />
        <div className={styles.forgotRow}>
          <Link to={ROUTES.FORGOT_PASSWORD} className={styles.forgotLink}>
            Forgot password?
          </Link>
        </div>
      </div>

      <Button type="submit" fullWidth loading={loading} size="lg">Log In</Button>
    </form>
  );
}
