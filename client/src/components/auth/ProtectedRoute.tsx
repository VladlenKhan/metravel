import { Navigate } from 'react-router-dom';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: string;
}

export const ProtectedRoute = ({ children, requiredRole }: ProtectedRouteProps) => {
  const token = localStorage.getItem('token'); // Или ваш способ хранения токена

  if (!token) return <Navigate to="/login" replace />;

  if (requiredRole) {
    try {
      // Декодируем payload JWT
      const payload = JSON.parse(atob(token.split('.')[1]));
      
      // В ASP.NET Identity роли обычно хранятся в этом ключе:
      const roleClaim = "http://schemas.microsoft.com/ws/2008/06/identity/claims/role";
      const userRoles = payload[roleClaim] || payload.role || [];
      
      const rolesArray = Array.isArray(userRoles) ? userRoles : [userRoles];
      
      if (!rolesArray.includes(requiredRole)) {
        console.warn("Доступ запрещен: недостаточно прав.");
        return <Navigate to="/" replace />;
      }
    } catch (e) {
      return <Navigate to="/login" replace />;
    }
  }

  return <>{children}</>;
};