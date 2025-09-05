import { Outlet, Link as RouterLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { AppBar, Toolbar, Typography, Button, Box } from '@mui/material';

export const PrivateLayout = () => {
  const { user, logout } = useAuth();

  return (
    <Box>
      <AppBar position="static">
        <Toolbar>
          <Typography
            variant="h6"
            component={RouterLink}
            to="/presentations"
            sx={{ flexGrow: 1, color: 'inherit', textDecoration: 'none' }}
          >
            Презентатор.ИИ
          </Typography>
          
          {user?.is_admin && (
            <Button color="inherit" component={RouterLink} to="/admin">
              Админ-панель
            </Button>
          )}

          <Button color="inherit" onClick={logout}>Выйти</Button>
        </Toolbar>
      </AppBar>
      <main>
        <Outlet />
      </main>
    </Box>
  );
};