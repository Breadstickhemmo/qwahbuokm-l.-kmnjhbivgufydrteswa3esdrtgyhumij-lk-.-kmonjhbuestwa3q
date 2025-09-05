import React from 'react';
import { TextField, Button, Typography, Link, CircularProgress } from '@mui/material';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import apiClient from '../../services/apiService';
import { User } from '../../context/AuthContext';

interface LoginFormProps {
  onSuccess: (token: string, user: User) => void;
  onError: (message: string) => void;
  switchToRegister: () => void;
}

export const LoginForm: React.FC<LoginFormProps> = ({ onSuccess, onError, switchToRegister }) => {
  const formik = useFormik({
    initialValues: { email: '', password: '' },
    validationSchema: Yup.object({
      email: Yup.string().email('Некорректный email').required('Обязательное поле'),
      password: Yup.string().required('Обязательное поле'),
    }),
    onSubmit: async (values, { setSubmitting }) => {
      try {
        onError('');
        const response = await apiClient.post('/login', values);
        onSuccess(response.data.token, response.data.user); 
      } catch (err: any) {
        onError(err.response?.data?.message || 'Произошла ошибка');
      } finally {
        setSubmitting(false);
      }
    },
  });

  return (
    <form onSubmit={formik.handleSubmit}>
      <TextField
        fullWidth
        id="login-email"
        name="email"
        label="Email"
        value={formik.values.email}
        onChange={formik.handleChange}
        onBlur={formik.handleBlur}
        error={formik.touched.email && Boolean(formik.errors.email)}
        helperText={formik.touched.email && formik.errors.email ? formik.errors.email : ' '}
        margin="dense"
        autoFocus
      />
      <TextField
        fullWidth
        id="login-password"
        name="password"
        label="Пароль"
        type="password"
        value={formik.values.password}
        onChange={formik.handleChange}
        onBlur={formik.handleBlur}
        error={formik.touched.password && Boolean(formik.errors.password)}
        helperText={formik.touched.password && formik.errors.password ? formik.errors.password : ' '}
        margin="dense"
      />
      <Button
        type="submit"
        fullWidth
        variant="contained"
        sx={{ mt: 2, mb: 2 }}
        disabled={formik.isSubmitting}
      >
        {formik.isSubmitting ? <CircularProgress size={24} /> : 'Войти'}
      </Button>
      <Typography variant="body2" align="center">
        Нет аккаунта?{' '}
        <Link component="button" type="button" onClick={switchToRegister} sx={{ cursor: 'pointer' }}>
          Зарегистрируйтесь
        </Link>
      </Typography>
    </form>
  );
};