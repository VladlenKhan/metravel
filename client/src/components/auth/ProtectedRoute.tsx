import { Navigate } from "react-router-dom";
import type { UserRole } from "../../api/api";
import { useAuthSession } from "../../hooks/useAuthSession";

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: UserRole;
  allowedRoles?: UserRole[];
}

export const ProtectedRoute = ({
  children,
  requiredRole,
  allowedRoles,
}: ProtectedRouteProps) => {
  const session = useAuthSession();

  if (!session?.token) {
    return <Navigate to="/login" replace />;
  }

  if (requiredRole && session.role !== requiredRole) {
    return <Navigate to="/" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(session.role)) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};
