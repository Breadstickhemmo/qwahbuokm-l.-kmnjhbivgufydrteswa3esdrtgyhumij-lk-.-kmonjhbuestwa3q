import { createContext, useState, useContext, useEffect, ReactNode, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { setupInterceptors } from '../services/apiService';
import { useNotification } from './NotificationContext';

interface AuthContextType {
  token: string | null;
  isAuthenticated: boolean;
  login: (token: string) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [token, setToken] = useState<string | null>(localStorage.getItem('token'));
  const navigate = useNavigate();
  const { showNotification } = useNotification();

  const logout = useCallback(() => {
    setToken(null);
    localStorage.removeItem('token');
    showNotification('Ваша сессия истекла. Пожалуйста, войдите снова.', 'info');
    navigate('/');
  }, [navigate, showNotification]);

  useEffect(() => {
    if (token) {
      localStorage.setItem('token', token);
    } else {
      localStorage.removeItem('token');
    }
  }, [token]);

  useEffect(() => {
    setupInterceptors(logout);
  }, [logout]);

  const login = (newToken: string) => {
    setToken(newToken);
    showNotification('Добро пожаловать!', 'success');
    navigate('/presentations');
  };

  const value = {
    token,
    isAuthenticated: !!token,
    login,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};