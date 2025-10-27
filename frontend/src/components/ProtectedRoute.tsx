import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { isLoggedIn, routes } from '../utils/navigation';
import { useToast } from './Toast';

interface ProtectedRouteProps {
  children: React.ReactNode;
  redirectTo?: string;
  message?: string;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ 
  children, 
  redirectTo = routes.login,
  message = 'Please log in to access this page'
}) => {
  const navigate = useNavigate();
  const { showToast } = useToast();

  useEffect(() => {
    if (!isLoggedIn()) {
      showToast(message, 'info');
      // Store current path for redirect after login
      localStorage.setItem('redirectAfterLogin', window.location.pathname);
      navigate(redirectTo);
    }
  }, [navigate, showToast, redirectTo, message]);

  // Don't render children if not authenticated
  if (!isLoggedIn()) {
    return null;
  }

  return <>{children}</>;
};

export default ProtectedRoute;