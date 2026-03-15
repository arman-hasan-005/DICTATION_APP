import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import Loader from '../components/ui/Loader/Loader';
import { ROUTES } from '../constants/routes';

export default function ProtectedRoute({ children }) {
  const { isAuthenticated, loading } = useAuth();
  const location = useLocation();
  if (loading) return <Loader fullPage text="Loading…" />;
  if (!isAuthenticated) return <Navigate to={ROUTES.LOGIN} state={{ from: location }} replace />;
  return children;
}
