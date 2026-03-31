/**
 * OtpVerificationPage
 *
 * FIX: The previous auto-submit used a useEffect that watched the `otp` state
 * array. Because handleSubmit was defined with useCallback([otp, ...]), the
 * auto-submit effect called the CORRECT version — but only AFTER React committed
 * the state update. In React 18 Strict Mode this causes a double-commit and
 * the effect can fire TWICE, submitting the same OTP code twice.
 *
 * The second submission happens while the first is in-flight or just resolved,
 * and the server has already cleared the OTP from the DB. The second call then
 * gets "No active OTP" because the field is now null.
 *
 * Fix: use a useRef submission guard (submittingRef) that is set synchronously
 * before the async call and cleared only on error. This prevents any double-
 * submit regardless of React's render cycle.
 *
 * Also: remove the auto-submit entirely. It adds complexity and causes the
 * double-submit bug. Users fill 6 digits then click "Verify Email".
 * Auto-focus advancement is kept so the UX is still smooth.
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../../hooks/useAuth';
import authService from '../../../services/authService';
import Button from '../../../components/ui/Button/Button';
import { ROUTES } from '../../../constants/routes';
import styles from './OtpPage.module.css';

const OTP_LENGTH   = 6;
const RESEND_DELAY = 60;

export default function OtpVerificationPage() {
  const navigate  = useNavigate();
  const location  = useLocation();
  const { pendingEmail, setPendingEmail, verifyOtp } = useAuth();

  const email = location.state?.email || pendingEmail;

  const [otp,         setOtp]         = useState(Array(OTP_LENGTH).fill(''));
  const [loading,     setLoading]     = useState(false);
  const [error,       setError]       = useState('');
  const [success,     setSuccess]     = useState('');
  const [resendTimer, setResendTimer] = useState(RESEND_DELAY);
  const [resending,   setResending]   = useState(false);

  const inputRefs    = useRef([]);
  const submittingRef = useRef(false);  // prevents double-submit

  // Countdown timer
  useEffect(() => {
    if (resendTimer <= 0) return;
    const id = setTimeout(() => setResendTimer(t => t - 1), 1000);
    return () => clearTimeout(id);
  }, [resendTimer]);

  // Redirect if no email
  useEffect(() => {
    if (!email) navigate(ROUTES.REGISTER);
  }, [email, navigate]);

  // Focus first input on mount
  useEffect(() => { inputRefs.current[0]?.focus(); }, []);

  const handleChange = (index, value) => {
    const digit = value.replace(/\D/, '').slice(-1);
    setOtp(prev => {
      const next = [...prev];
      next[index] = digit;
      return next;
    });
    setError('');
    if (digit && index < OTP_LENGTH - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
    if (e.key === 'ArrowLeft'  && index > 0)              inputRefs.current[index - 1]?.focus();
    if (e.key === 'ArrowRight' && index < OTP_LENGTH - 1) inputRefs.current[index + 1]?.focus();
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

    // Synchronous guard — prevents double-submit from any re-render
    if (submittingRef.current) return;
    submittingRef.current = true;

    setLoading(true);
    setError('');
    try {
      await verifyOtp(email, code);
      navigate(ROUTES.DASHBOARD);
    } catch (err) {
      submittingRef.current = false;  // allow retry on error
      setError(err.response?.data?.message || 'Verification failed. Please try again.');
      setOtp(Array(OTP_LENGTH).fill(''));
      inputRefs.current[0]?.focus();
    } finally {
      setLoading(false);
    }
  }, [otp, email, verifyOtp, navigate]);

  const handleResend = async () => {
    setResending(true);
    setError('');
    setSuccess('');
    try {
      await authService.resendOtp(email);
      setSuccess('A new code has been sent to your email.');
      setResendTimer(RESEND_DELAY);
      setOtp(Array(OTP_LENGTH).fill(''));
      submittingRef.current = false;
      inputRefs.current[0]?.focus();
    } catch (err) {
      setError(err.response?.data?.message || 'Could not resend code.');
    } finally {
      setResending(false);
    }
  };

  if (!email) return null;

  const isComplete = otp.every(d => d !== '');

  return (
    <div className={styles.page}>
      <div className={styles.card}>
        <div className={styles.icon}>📬</div>
        <h1 className={styles.title}>Check your email</h1>
        <p className={styles.subtitle}>
          We sent a 6-digit code to<br />
          <strong className={styles.email}>{email}</strong>
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
                  digit          ? styles.otpInputFilled : '',
                  error          ? styles.otpInputError  : '',
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
            disabled={!isComplete || loading}
          >
            Verify Email
          </Button>
        </form>

        <div className={styles.resendRow}>
          {resendTimer > 0 ? (
            <p className={styles.resendTimer}>Resend code in {resendTimer}s</p>
          ) : (
            <button
              type="button"
              className={styles.resendBtn}
              onClick={handleResend}
              disabled={resending}
            >
              {resending ? 'Sending…' : "Didn't receive it? Resend code"}
            </button>
          )}
        </div>

        <button
          type="button"
          className={styles.backBtn}
          onClick={() => { setPendingEmail(null); navigate(ROUTES.LOGIN); }}
        >
          ← Back to login
        </button>
      </div>
    </div>
  );
}
