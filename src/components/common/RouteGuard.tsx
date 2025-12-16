import { useAuth } from '../../context/AuthContext';
import { Navigate, Outlet, useLocation } from 'react-router-dom';

const PUBLIC_ROUTES = ['/login', '/register'];

export const RouteGuard = () => {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return <div className="flex h-screen items-center justify-center text-brand-primary">加载中...</div>;
  }

  const isPublic = PUBLIC_ROUTES.includes(location.pathname);

  if (!user && !isPublic) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (user && isPublic) {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
};
