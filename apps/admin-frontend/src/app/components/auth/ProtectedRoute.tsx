import React from 'react';
import { Navigate, useLocation } from 'react-router';
import { useAuth } from '../../context/AuthContext';

export default function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, hasAccess } = useAuth();
  const location = useLocation();

  if (!isAuthenticated) {
    // Redirect unauthenticated users to login page
    return <Navigate to="/" state={{ from: location }} replace />;
  }

  // Assuming all admin users can access the dashboard for now.
  // We can add role checks here later using hasAccess if needed.

  return <>{children}</>;
}
