import React, { createContext, useState, useContext, ReactNode, useCallback, useMemo } from 'react';
import { Snackbar, Alert, AlertColor, LinearProgress, Box } from '@mui/material';
import { keyframes } from '@emotion/react';

const DURATION = 5000;

const progressAnimation = keyframes`
  from {
    transform: scaleX(1);
  }
  to {
    transform: scaleX(0);
  }
`;

interface NotificationContextType {
  showNotification: (message: string, severity?: AlertColor) => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const NotificationProvider = ({ children }: { children: ReactNode }) => {
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState('');
  const [severity, setSeverity] = useState<AlertColor>('success');
  const [key, setKey] = useState(new Date().getTime());

  const handleClose = (event?: React.SyntheticEvent | Event, reason?: string) => {
    if (reason === 'clickaway') {
      return;
    }
    setOpen(false);
  };

  const showNotification = useCallback((newMessage: string, newSeverity: AlertColor = 'success') => {
    setMessage(newMessage);
    setSeverity(newSeverity);
    setOpen(true);
    setKey(new Date().getTime());
  }, []);

  const value = useMemo(() => ({ showNotification }), [showNotification]);

  return (
    <NotificationContext.Provider value={value}>
      {children}
      <Snackbar
        key={key}
        open={open}
        autoHideDuration={DURATION}
        onClose={handleClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert 
          onClose={handleClose} 
          severity={severity} 
          sx={{ width: '100%', position: 'relative', overflow: 'hidden' }}
        >
          {message}
          <Box sx={{ 
            position: 'absolute', 
            bottom: 0, 
            left: 0, 
            right: 0,
            opacity: open ? 1 : 0,
            transition: 'opacity 0.3s ease-in-out',
          }}>
            <LinearProgress
              variant="determinate"
              value={100}
              sx={{
                '& .MuiLinearProgress-bar': {
                  animation: `${progressAnimation} ${DURATION}ms linear`,
                  transformOrigin: 'left',
                },
              }}
            />
          </Box>
        </Alert>
      </Snackbar>
    </NotificationContext.Provider>
  );
};

export const useNotification = () => {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error('useNotification must be used within a NotificationProvider');
  }
  return context;
};