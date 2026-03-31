/**
 * GoogleCompleteProfilePage — /google/complete-profile
 *
 * Step 3 of Google signup: collect level, name (editable), and optional password.
 * Account is created only when this form is submitted successfully.
 *
 * State is passed via sessionStorage (set by GoogleOtpPage):
 *   googleProfileToken — JWT for this step
 *   googleSignupName   — pre-filled name from Google
 */

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import authService from '../../../services/authService';
import { useAuth }  from '../../../hooks/useAuth';
import Button from '../../../components/ui/Button/Button';
import Input  from '../../../components/ui/Input/Input';
import { ROUTES }      from '../../../constants/routes';
import { LEVEL_LIST, getLevelConfig } from '../../../constants/levels';
import styles from './AuthPage.module.css';
import formStyles from './GoogleCompleteProfilePage.module.css';

export default function GoogleCompleteProfilePage() {
  const navigate          = useNavigate();
  const { loginWithToken } = useAuth();

  const profileToken = sessionStorage.getItem('googleProfileToken') || '';
  const defaultName  = sessionStorage.getItem('googleSignupName')   || '';

  const [fields, setFields] = useState({
    name:           defaultName,
    preferredLevel: 'beginner',
    password:       '',
    confirmPassword:'',
  });
  const [showPw,   setShowPw]   = useState(false);
  const [errors,   setErrors]   = useState({});
  const [loading,  setLoading]  = useState(false);
  const [apiError, setApiError] = useState('');

  useEffect(() => {
    if (!profileToken) navigate(ROUTES.REGISTER, { replace: true });
  }, [profileToken, navigate]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFields(p => ({ ...p, [name]: value }));
    if (errors[name]) setErrors(p => ({ ...p, [name]: '' }));
    setApiError('');
  };

  const validate = () => {
    const errs = {};
    if (!fields.name.trim()) errs.name = 'Name is required';
    if (fields.password && fields.password.length < 6)
      errs.password = 'Password must be at least 6 characters';
    if (fields.password && fields.password !== fields.confirmPassword)
      errs.confirmPassword = 'Passwords do not match';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    try {
      const payload = {
        profileToken,
        name:           fields.name.trim(),
        preferredLevel: fields.preferredLevel,
      };
      if (fields.password) payload.password = fields.password;

      const res = await authService.googleCompleteProfile(payload);
      // Clean up sessionStorage
      sessionStorage.removeItem('googleProfileToken');
      sessionStorage.removeItem('googleSignupName');
      sessionStorage.removeItem('googleSignupEmail');
      // Log in with the returned token
      await loginWithToken(res.data.token);
      navigate(ROUTES.DASHBOARD, { replace: true });
    } catch (err) {
      setApiError(err.response?.data?.message || 'Could not create account. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (!profileToken) return null;

  return (
    <div className={styles.page}>
      <div className={`${styles.card} ${formStyles.wideCard}`}>
        {/* Header */}
        <div className={styles.header}>
          <div className={styles.logo}>🎙️</div>
          <h1 className={styles.title}>Complete your profile</h1>
          <p className={styles.subtitle}>
            Almost done! Tell us a bit more so we can personalise your experience.
          </p>
        </div>

        {/* Steps indicator */}
        <div className={formStyles.steps}>
          <div className={`${formStyles.step} ${formStyles.stepDone}`}>
            <span className={formStyles.stepIcon}>✓</span>
            <span>Google account</span>
          </div>
          <div className={formStyles.stepLine} />
          <div className={`${formStyles.step} ${formStyles.stepDone}`}>
            <span className={formStyles.stepIcon}>✓</span>
            <span>Email verified</span>
          </div>
          <div className={formStyles.stepLine} />
          <div className={`${formStyles.step} ${formStyles.stepActive}`}>
            <span className={formStyles.stepIcon}>3</span>
            <span>Profile</span>
          </div>
        </div>

        {apiError && <div className={`${styles.apiError} ${formStyles.apiError}`} role="alert">{apiError}</div>}

        <form onSubmit={handleSubmit} noValidate className={formStyles.form}>
          {/* Name */}
          <Input
            label="Your name"
            type="text"
            name="name"
            placeholder="How should we call you?"
            value={fields.name}
            onChange={handleChange}
            error={errors.name}
            leftIcon="👤"
            autoComplete="name"
          />

          {/* Level selector */}
          <div className={formStyles.fieldGroup}>
            <label className={formStyles.fieldLabel}>📚 Your level</label>
            <div className={formStyles.levelGrid}>
              {LEVEL_LIST.map(lvl => {
                const cfg = getLevelConfig(lvl);
                return (
                  <label
                    key={lvl}
                    className={[
                      formStyles.levelCard,
                      fields.preferredLevel === lvl ? formStyles.levelSelected : '',
                    ].filter(Boolean).join(' ')}
                    style={fields.preferredLevel === lvl
                      ? { borderColor: cfg.color, background: cfg.bgColor }
                      : {}}
                  >
                    <input
                      type="radio"
                      name="preferredLevel"
                      value={lvl}
                      checked={fields.preferredLevel === lvl}
                      onChange={handleChange}
                      style={{ display: 'none' }}
                    />
                    <span className={formStyles.levelEmoji}>{cfg.emoji}</span>
                    <span className={formStyles.levelName}>{cfg.label}</span>
                  </label>
                );
              })}
            </div>
          </div>

          {/* Optional password */}
          <div className={formStyles.passwordSection}>
            <p className={formStyles.passwordNote}>
              🔐 <strong>Optional:</strong> Add a password to also log in with email &amp; password.
              You can skip this and always use Google to sign in.
            </p>

            <Input
              label="Password (optional)"
              type={showPw ? 'text' : 'password'}
              name="password"
              placeholder="Min. 6 characters"
              value={fields.password}
              onChange={handleChange}
              error={errors.password}
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

            {fields.password && (
              <Input
                label="Confirm password"
                type={showPw ? 'text' : 'password'}
                name="confirmPassword"
                placeholder="Repeat your password"
                value={fields.confirmPassword}
                onChange={handleChange}
                error={errors.confirmPassword}
                leftIcon="🔒"
                autoComplete="new-password"
              />
            )}
          </div>

          <Button type="submit" fullWidth size="lg" loading={loading}>
            🚀 Create My Account
          </Button>
        </form>
      </div>
    </div>
  );
}
