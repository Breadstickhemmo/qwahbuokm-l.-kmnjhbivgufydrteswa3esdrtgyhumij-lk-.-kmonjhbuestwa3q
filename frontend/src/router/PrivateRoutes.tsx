import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { PrivateLayout } from './PrivateLayout';

export const PrivateRoutes = () => {
  const { isAuthenticated } = useAuth();
  if (!isAuthenticated) {
    return <Navigate to="/" replace />;
  }
  return <PrivateLayout />;
};