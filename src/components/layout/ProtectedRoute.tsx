import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { homePath } from '../../constants/permissions';
import type { Permission } from '../../types';

export function ProtectedRoute({
  adminOnly = false,
  permission,
}: {
  adminOnly?: boolean;
  permission?: Permission;
}) {
  const { user, isAdmin, hasPermission, loading } = useAuth();
  if (loading) return null;
  if (!user) return <Navigate to="/login" replace />;
  if (adminOnly && !isAdmin) return <Navigate to={homePath(user)} replace />;
  if (permission && !hasPermission(permission)) return <Navigate to={homePath(user)} replace />;
  return <Outlet />;
}

export function PublicRoute() {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (user) return <Navigate to={homePath(user)} replace />;
  return <Outlet />;
}
