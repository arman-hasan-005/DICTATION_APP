import { useState } from 'react';
import Input  from '../../../../components/ui/Input/Input';
import Button from '../../../../components/ui/Button/Button';
import { LEVEL_LIST, getLevelConfig } from '../../../../constants/levels';
import styles from './RegisterForm.module.css';

export default function RegisterForm({ fields, errors, loading, apiError, onChange, onSubmit }) {
  const [showPw, setShowPw] = useState(false);
  return (
    <form className={styles.form} onSubmit={onSubmit} noValidate>
      {apiError && <div className={styles.apiError}>{apiError}</div>}
      <Input label="Full Name" type="text" name="name" placeholder="Your name" value={fields.name} onChange={onChange} error={errors.name} leftIcon="👤" />
      <Input label="Email" type="email" name="email" placeholder="you@example.com" value={fields.email} onChange={onChange} error={errors.email} leftIcon="✉️" />
      <Input label="Password" type={showPw?'text':'password'} name="password" placeholder="Min. 6 characters" value={fields.password} onChange={onChange} error={errors.password} leftIcon="🔒"
        rightIcon={<button type="button" onClick={() => setShowPw(v => !v)} style={{background:'none',border:'none',cursor:'pointer',fontSize:'16px'}}>{showPw?'🙈':'👁️'}</button>} />
      <div className={styles.field}>
        <label className={styles.label}>Starting Level</label>
        <div className={styles.levels}>
          {LEVEL_LIST.map(lvl => { const cfg = getLevelConfig(lvl); return (
            <label key={lvl} className={[styles.levelCard, fields.preferredLevel===lvl?styles.levelSelected:''].filter(Boolean).join(' ')}>
              <input type="radio" name="preferredLevel" value={lvl} checked={fields.preferredLevel===lvl} onChange={onChange} style={{display:'none'}} />
              <span>{cfg.emoji}</span><span className={styles.levelLabel}>{cfg.label}</span>
            </label>
          );})}
        </div>
      </div>
      <Button type="submit" fullWidth loading={loading} size="lg">Create Account</Button>
    </form>
  );
}
