import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import ProtectedRoute  from './ProtectedRoute';
import { ROUTES }      from '../constants/routes';
import LoginPage       from '../features/auth/pages/LoginPage';
import RegisterPage    from '../features/auth/pages/RegisterPage';
import DashboardPage   from '../features/dashboard/pages/DashboardPage';
import SetupPage       from '../features/dictation/pages/SetupPage';
import DictationPage   from '../features/dictation/pages/DictationPage';
import ResultsPage     from '../features/results/pages/ResultsPage';
import ProfilePage     from '../features/profile/pages/ProfilePage';
import LeaderboardPage from '../features/leaderboard/pages/LeaderboardPage';
import UploadPage      from '../features/upload/pages/UploadPage';

const P = ({ children }) => <ProtectedRoute>{children}</ProtectedRoute>;

export default function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path={ROUTES.LOGIN}       element={<LoginPage />} />
        <Route path={ROUTES.REGISTER}    element={<RegisterPage />} />
        <Route path={ROUTES.DASHBOARD}   element={<P><DashboardPage /></P>} />
        <Route path={ROUTES.SETUP}       element={<P><SetupPage /></P>} />
        <Route path={ROUTES.DICTATION}   element={<P><DictationPage /></P>} />
        <Route path={ROUTES.RESULTS}     element={<P><ResultsPage /></P>} />
        <Route path={ROUTES.PROFILE}     element={<P><ProfilePage /></P>} />
        <Route path={ROUTES.LEADERBOARD} element={<P><LeaderboardPage /></P>} />
        <Route path={ROUTES.UPLOAD}      element={<P><UploadPage /></P>} />
        <Route path={ROUTES.HOME}        element={<Navigate to={ROUTES.DASHBOARD} replace />} />
        <Route path="*"                  element={<Navigate to={ROUTES.DASHBOARD} replace />} />
      </Routes>
    </BrowserRouter>
  );
}
