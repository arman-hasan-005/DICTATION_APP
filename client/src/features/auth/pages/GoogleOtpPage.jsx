/**
 * GoogleOtpPage — /google/verify-otp?st=<step_token>&email=<email>
 *
 * Step 2 of Google signup: verify the OTP sent to the user's Google email.
 * On success → navigate to /google/complete-profile
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import authService from '../../../services/authService';
import Button from '../../../components/ui/Button/Button';
import { ROUTES } from '../../../constants/routes';
import styles from './OtpPage.module.css';

const OTP_LENGTH   = 6;
const RESEND_DELAY = 60;

export default function GoogleOtpPage() {
  const navigate       = useNavigate();
  const [searchParams] = useSearchParams();

  const stepToken = searchParams.get('st')    || '';
  const email     = searchParams.get('email') || '';   // display only

  const [otp,         setOtp]         = useState(Array(OTP_LENGTH).fill(''));
  const [loading,     setLoading]     = useState(false);
  const [error,       setError]       = useState('');
  const [success,     setSuccess]     = useState('');
  const [resendTimer, setResendTimer] = useState(RESEND_DELAY);
  const [resending,   setResending]   = useState(false);

  const inputRefs     = useRef([]);
  const submittingRef = useRef(false);

  useEffect(() => {
    if (!stepToken) navigate(ROUTES.REGISTER, { replace: true });
  }, [stepToken, navigate]);

  useEffect(() => { inputRefs.current[0]?.focus(); }, []);

  useEffect(() => {
    if (resendTimer <= 0) return;
    const id = setTimeout(() => setResendTimer(t => t - 1), 1000);
    return () => clearTimeout(id);
  }, [resendTimer]);

  const handleChange = (i, value) => {
    const digit = value.replace(/\D/, '').slice(-1);
    setOtp(prev => { const n = [...prev]; n[i] = digit; return n; });
    setError('');
    if (digit && i < OTP_LENGTH - 1) inputRefs.current[i + 1]?.focus();
  };

  const handleKeyDown = (i, e) => {
    if (e.key === 'Backspace' && !otp[i] && i > 0) inputRefs.current[i - 1]?.focus();
    if (e.key === 'ArrowLeft'  && i > 0)            inputRefs.current[i - 1]?.focus();
    if (e.key === 'ArrowRight' && i < OTP_LENGTH-1) inputRefs.current[i + 1]?.focus();
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, OTP_LENGTH);
    if (!pasted) return;
    const next = Array(OTP_LENGTH).fill('');
    pasted.split('').forEach((d, i) => { next[i] = d; });
    setOtp(next);
    inputRefs.current[Math.min(pasted.length, OTP_LENGTH - 1)]?.focus();
  };

  const handleSubmit = useCallback(async (e) => {
    e?.preventDefault();
    const code = otp.join('');
    if (code.length < OTP_LENGTH) { setError('Please enter all 6 digits.'); return; }
    if (submittingRef.current) return;
    submittingRef.current = true;
    setLoading(true);
    setError('');
    try {
      const res = await authService.googleVerifyOtp(stepToken, code);
      // Pass profile token to the next step via sessionStorage
      sessionStorage.setItem('googleProfileToken', res.data.profileToken);
      sessionStorage.setItem('googleSignupName',   res.data.name || '');
      navigate(ROUTES.GOOGLE_COMPLETE_PROFILE, { replace: true });
    } catch (err) {
      submittingRef.current = false;
      setError(err.response?.data?.message || 'Verification failed. Please try again.');
      setOtp(Array(OTP_LENGTH).fill(''));
      inputRefs.current[0]?.focus();
    } finally {
      setLoading(false);
    }
  }, [otp, stepToken, navigate]);

  const handleResend = async () => {
    setResending(true);
    setError('');
    setSuccess('');
    try {
      await authService.googleResendOtp(stepToken);
      setSuccess('A new code has been sent to your email.');
      setResendTimer(RESEND_DELAY);
      setOtp(Array(OTP_LENGTH).fill(''));
      submittingRef.current = false;
      inputRefs.current[0]?.focus();
    } catch (err) {
      setError(err.response?.data?.message || 'Could not resend. Please try again.');
    } finally {
      setResending(false);
    }
  };

  if (!stepToken) return null;

  return (
    <div className={styles.page}>
      <div className={styles.card}>
        <div className={styles.icon}>📬</div>
        <h1 className={styles.title}>Verify your email</h1>
        <p className={styles.subtitle}>
          We sent a 6-digit code to your Google email
          {email && <><br /><strong className={styles.email}>{decodeURIComponent(email)}</strong></>}
        </p>

        <form onSubmit={handleSubmit} noValidate>
          <div className={styles.otpRow} onPaste={handlePaste}>
            {otp.map((digit, i) => (
              <input
                key={i}
                ref={el => { inputRefs.current[i] = el; }}
                type="text"
                inputMode="numeric"
                maxLength={1}
                value={digit}
                onChange={e => handleChange(i, e.target.value)}
                onKeyDown={e => handleKeyDown(i, e)}
                className={[
                  styles.otpInput,
                  digit ? styles.otpInputFilled : '',
                  error ? styles.otpInputError  : '',
                ].filter(Boolean).join(' ')}
                aria-label={`Digit ${i + 1}`}
                autoComplete="off"
                disabled={loading}
              />
            ))}
          </div>

          {error   && <p className={styles.error}   role="alert">{error}</p>}
          {success && <p className={styles.success}>{success}</p>}

          <Button
            type="submit"
            fullWidth
            size="lg"
            loading={loading}
            disabled={otp.join('').length < OTP_LENGTH || loading}
          >
            Verify Email
          </Button>
        </form>

        <div className={styles.resendRow}>
          {resendTimer > 0 ? (
            <p className={styles.resendTimer}>Resend code in {resendTimer}s</p>
          ) : (
            <button type="button" className={styles.resendBtn} onClick={handleResend} disabled={resending}>
              {resending ? 'Sending…' : "Didn't receive it? Resend"}
            </button>
          )}
        </div>

        <button
          type="button"
          className={styles.backBtn}
          onClick={() => navigate(ROUTES.REGISTER)}
        >
          ← Back to sign up
        </button>
      </div>
    </div>
  );
}
