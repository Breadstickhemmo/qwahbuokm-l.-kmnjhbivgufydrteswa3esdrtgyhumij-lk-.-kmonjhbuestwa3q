import { createBrowserRouter, RouterProvider, Outlet } from 'react-router-dom';
import { ThemeProvider } from '@mui/material/styles';
import { theme } from '../styles/theme';
import { AuthProvider } from '../context/AuthContext';
import { NotificationProvider } from '../context/NotificationContext';
import { HomePage } from '../pages/HomePage';
import { WelcomePage } from '../pages/WelcomePage';
import { EditorPage } from '../pages/EditorPage';
import { PrivateRoutes } from './PrivateRoutes';
import { PublicRoutes } from './PublicRoutes';

const RootLayout = () => {
  return (
    // 3. Оборачиваем все в ThemeProvider
    <ThemeProvider theme={theme}>
      <NotificationProvider>
        <AuthProvider>
          <Outlet />
        </AuthProvider>
      </NotificationProvider>
    </ThemeProvider>
  );
};

const router = createBrowserRouter([
  {
    element: <RootLayout />,
    children: [
      {
        element: <PrivateRoutes />,
        children: [
          {
            path: '/presentations',
            element: <HomePage />,
          },
          {
            path: '/presentations/:presentationId',
            element: <EditorPage />,
          },
        ],
      },
      {
        element: <PublicRoutes />,
        children: [
          {
            path: '/',
            element: <WelcomePage />,
          },
        ],
      },
    ],
  },
]);

export const AppRouter = () => {
  return <RouterProvider router={router} />;
};