import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import ProtectedRoute  from './ProtectedRoute';
import { ROUTES }      from '../constants/routes';
import Loader          from '../components/ui/Loader/Loader';

// ── Eagerly loaded ─────────────────────────────────────────────────────────────
import LoginPage                 from '../features/auth/pages/LoginPage';
import RegisterPage              from '../features/auth/pages/RegisterPage';
import OtpVerificationPage       from '../features/auth/pages/OtpVerificationPage';
import ForgotPasswordPage        from '../features/auth/pages/ForgotPasswordPage';
import ResetPasswordPage         from '../features/auth/pages/ResetPasswordPage';
import GoogleSuccessPage         from '../features/auth/pages/GoogleSuccessPage';
import GoogleOtpPage             from '../features/auth/pages/GoogleOtpPage';
import GoogleCompleteProfilePage from '../features/auth/pages/GoogleCompleteProfilePage';

// ── Lazily loaded ──────────────────────────────────────────────────────────────
const DashboardPage   = lazy(() => import('../features/dashboard/pages/DashboardPage'));
const SetupPage       = lazy(() => import('../features/dictation/pages/SetupPage'));
const DictationPage   = lazy(() => import('../features/dictation/pages/DictationPage'));
const ResultsPage     = lazy(() => import('../features/results/pages/ResultsPage'));
const SessionsPage    = lazy(() => import('../features/sessions/pages/SessionsPage'));
const ProfilePage     = lazy(() => import('../features/profile/pages/ProfilePage'));
const LeaderboardPage = lazy(() => import('../features/leaderboard/pages/LeaderboardPage'));
const UploadPage      = lazy(() => import('../features/upload/pages/UploadPage'));
const SettingsPage    = lazy(() => import('../features/dictation/pages/SettingsPage'));

const fallback = <Loader fullPage text="Loading…" />;
const P = ({ children }) => (
  <ProtectedRoute>
    <Suspense fallback={fallback}>{children}</Suspense>
  </ProtectedRoute>
);

const PROTECTED_ROUTES = [
  { path: ROUTES.DASHBOARD,   element: <DashboardPage /> },
  { path: ROUTES.SETUP,       element: <SetupPage /> },
  { path: ROUTES.DICTATION,   element: <DictationPage /> },
  { path: ROUTES.RESULTS,     element: <ResultsPage /> },
  { path: ROUTES.SESSIONS,    element: <SessionsPage /> },
  { path: ROUTES.PROFILE,     element: <ProfilePage /> },
  { path: ROUTES.LEADERBOARD, element: <LeaderboardPage /> },
  { path: ROUTES.UPLOAD,      element: <UploadPage /> },
  { path: ROUTES.SETTINGS,    element: <SettingsPage /> },
];

export default function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        {/* ── Public auth ── */}
        <Route path={ROUTES.LOGIN}                    element={<LoginPage />} />
        <Route path={ROUTES.REGISTER}                 element={<RegisterPage />} />
        <Route path={ROUTES.VERIFY_OTP}               element={<OtpVerificationPage />} />
        <Route path={ROUTES.FORGOT_PASSWORD}          element={<ForgotPasswordPage />} />
        <Route path={ROUTES.RESET_PASSWORD}           element={<ResetPasswordPage />} />
        <Route path={ROUTES.GOOGLE_SUCCESS}           element={<GoogleSuccessPage />} />
        <Route path={ROUTES.GOOGLE_VERIFY_OTP}        element={<GoogleOtpPage />} />
        <Route path={ROUTES.GOOGLE_COMPLETE_PROFILE}  element={<GoogleCompleteProfilePage />} />

        {/* ── Protected + lazy ── */}
        {PROTECTED_ROUTES.map(({ path, element }) => (
          <Route key={path} path={path} element={<P>{element}</P>} />
        ))}

        <Route path={ROUTES.HOME} element={<Navigate to={ROUTES.DASHBOARD} replace />} />
        <Route path="*"           element={<Navigate to={ROUTES.DASHBOARD} replace />} />
      </Routes>
    </BrowserRouter>
  );
}
