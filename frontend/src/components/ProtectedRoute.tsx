import { ReactElement } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Role } from '../types';

export default function ProtectedRoute({ children, allow }: { children: ReactElement; allow?: Role[] }) {
  const { user } = useAuth();

  if (!user) return <Navigate to="/login" replace />;
  if (allow && !allow.includes(user.role)) {
    return (
      <div className="error-state">
        You don't have permission to view this page. Your role is {user.role}.
      </div>
    );
  }
  return children;
}
