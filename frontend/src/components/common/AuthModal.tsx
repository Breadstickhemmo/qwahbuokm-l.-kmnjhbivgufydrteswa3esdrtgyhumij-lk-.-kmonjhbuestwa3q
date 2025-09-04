import React, { useEffect, useState } from 'react';
import { Dialog, DialogTitle, DialogContent, Box, Tabs, Tab, IconButton, Alert } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import { useAuth } from '../../context/AuthContext';
import { useNotification } from '../../context/NotificationContext';
import apiClient from '../../services/apiService';
import { LoginForm } from './LoginForm';
import { RegisterForm } from './RegisterForm';

type FormType = 'login' | 'register';

interface AuthModalProps {
  open: boolean;
  onClose: () => void;
  initialFormType: FormType;
}

export const AuthModal: React.FC<AuthModalProps> = ({ open, onClose, initialFormType }) => {
  const [tabIndex, setTabIndex] = useState(0);
  const { login } = useAuth();
  const { showNotification } = useNotification();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setTabIndex(initialFormType === 'login' ? 0 : 1);
      setError(null);
    }
  }, [initialFormType, open]);

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabIndex(newValue);
    setError(null);
  };

  const handleLoginSuccess = (token: string) => {
    login(token);
    onClose();
  };

  const handleRegisterSuccess = async (values: any) => {
    try {
      showNotification('Вы успешно зарегистрированы!', 'success');
      const response = await apiClient.post('/login', { email: values.email, password: values.password });
      handleLoginSuccess(response.data.token);
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Не удалось войти после регистрации.';
      setError(errorMessage);
      showNotification(errorMessage, 'error');
    }
  };

  return (
    <Dialog open={open} onClose={onClose} PaperProps={{ sx: { borderRadius: 2, width: '100%', maxWidth: '450px' } }}>
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', p: 0 }}>
        <Box sx={{ borderBottom: 1, borderColor: 'divider', flexGrow: 1 }}>
          <Tabs value={tabIndex} onChange={handleTabChange} variant="fullWidth">
            <Tab label="Вход" sx={{ py: 2 }} />
            <Tab label="Регистрация" sx={{ py: 2 }} />
          </Tabs>
        </Box>
        <IconButton aria-label="close" onClick={onClose} sx={{ color: (theme) => theme.palette.grey[500], mx: 1 }}>
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      
      <DialogContent>
        <Box sx={{ pt: 2 }}>
          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
          
          {tabIndex === 0 && (
            <LoginForm 
              onSuccess={handleLoginSuccess}
              onError={setError}
              switchToRegister={() => setTabIndex(1)}
            />
          )}

          {tabIndex === 1 && (
            <RegisterForm 
              onSuccess={handleRegisterSuccess}
              onError={setError}
              switchToLogin={() => setTabIndex(0)}
            />
          )}
        </Box>
      </DialogContent>
    </Dialog>
  );
};