import { useState } from 'react';
import Input  from '../../../../components/ui/Input/Input';
import Button from '../../../../components/ui/Button/Button';
import styles from './LoginForm.module.css';

export default function LoginForm({ fields, errors, loading, apiError, onChange, onSubmit }) {
  const [showPw, setShowPw] = useState(false);
  return (
    <form className={styles.form} onSubmit={onSubmit} noValidate>
      {apiError && <div className={styles.apiError}>{apiError}</div>}
      <Input label="Email" type="email" name="email" placeholder="you@example.com" value={fields.email} onChange={onChange} error={errors.email} autoComplete="email" leftIcon="✉️" />
      <Input label="Password" type={showPw?'text':'password'} name="password" placeholder="••••••••" value={fields.password} onChange={onChange} error={errors.password} autoComplete="current-password" leftIcon="🔒"
        rightIcon={<button type="button" onClick={() => setShowPw(v => !v)} style={{background:'none',border:'none',cursor:'pointer',fontSize:'16px'}}>{showPw?'🙈':'👁️'}</button>} />
      <Button type="submit" fullWidth loading={loading} size="lg">Log In</Button>
    </form>
  );
}
