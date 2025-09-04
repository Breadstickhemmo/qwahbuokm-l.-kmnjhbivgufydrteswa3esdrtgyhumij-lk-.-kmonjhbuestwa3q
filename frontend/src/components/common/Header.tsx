import React from 'react';
import { AppBar, Toolbar, Typography, Button, Stack, Tooltip, Box } from '@mui/material';
import LoginIcon from '@mui/icons-material/Login';
import PersonAddIcon from '@mui/icons-material/PersonAdd';

interface HeaderProps {
  onLoginClick: (event: React.MouseEvent<HTMLButtonElement>) => void;
  onRegisterClick: (event: React.MouseEvent<HTMLButtonElement>) => void;
}

export const Header: React.FC<HeaderProps> = ({ onLoginClick, onRegisterClick }) => {
  return (
    <AppBar position="static" color="transparent" elevation={0} sx={{ borderBottom: 1, borderColor: 'divider' }}>
      <Toolbar>
        <Typography variant="h6" component="div" fontWeight="bold" sx={{ flexGrow: 1 }}>
          Презентатор.ИИ
        </Typography>
        
        <Stack direction="row" spacing={{ xs: 1, sm: 1.5 }}>
          <Tooltip title="Войти">
            <Button
              color="primary"
              variant="outlined"
              onClick={onLoginClick}
              sx={{ 
                minWidth: { xs: 0, sm: 'auto' }, 
                px: { xs: 1, sm: 2 } 
              }}
            >
              <LoginIcon sx={{ display: { xs: 'block', sm: 'none' } }} />
              <Box component="span" sx={{ display: { xs: 'none', sm: 'block' } }}>
                Войти
              </Box>
            </Button>
          </Tooltip>

          <Tooltip title="Регистрация">
            <Button
              variant="contained"
              onClick={onRegisterClick}
              sx={{ 
                minWidth: { xs: 0, sm: 'auto' }, 
                px: { xs: 1, sm: 2 } 
              }}
            >
              <PersonAddIcon sx={{ display: { xs: 'block', sm: 'none' } }} />
              <Box component="span" sx={{ display: { xs: 'none', sm: 'block' } }}>
                Регистрация
              </Box>
            </Button>
          </Tooltip>
        </Stack>
      </Toolbar>
    </AppBar>
  );
};