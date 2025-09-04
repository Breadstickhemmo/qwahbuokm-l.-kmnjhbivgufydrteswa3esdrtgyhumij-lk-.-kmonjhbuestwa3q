import React from 'react';
import { TextField, Button, Typography, Link, CircularProgress } from '@mui/material';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import apiClient from '../../services/apiService';

interface RegisterFormProps {
  onSuccess: (values: any) => void;
  onError: (message: string) => void;
  switchToLogin: () => void;
}

export const RegisterForm: React.FC<RegisterFormProps> = ({ onSuccess, onError, switchToLogin }) => {
  const formik = useFormik({
    initialValues: { email: '', password: '', confirmPassword: '' },
    validationSchema: Yup.object({
      email: Yup.string().email('Некорректный email').required('Обязательное поле'),
      password: Yup.string().min(6, 'Пароль должен быть минимум 6 символов').required('Обязательное поле'),
      confirmPassword: Yup.string()
        .oneOf([Yup.ref('password')], 'Пароли должны совпадать')
        .required('Обязательное поле'),
    }),
    onSubmit: async (values, { setSubmitting }) => {
      try {
        onError('');
        await apiClient.post('/register', { email: values.email, password: values.password });
        onSuccess(values);
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
        id="register-email"
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
        id="register-password"
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
      <TextField
        fullWidth
        id="register-confirmPassword"
        name="confirmPassword"
        label="Подтвердите пароль"
        type="password"
        value={formik.values.confirmPassword}
        onChange={formik.handleChange}
        onBlur={formik.handleBlur}
        error={formik.touched.confirmPassword && Boolean(formik.errors.confirmPassword)}
        helperText={formik.touched.confirmPassword && formik.errors.confirmPassword ? formik.errors.confirmPassword : ' '}
        margin="dense"
      />
      <Button
        type="submit"
        fullWidth
        variant="contained"
        sx={{ mt: 2, mb: 2 }}
        disabled={formik.isSubmitting}
      >
        {formik.isSubmitting ? <CircularProgress size={24} /> : 'Зарегистрироваться'}
      </Button>
      <Typography variant="body2" align="center">
        Уже есть аккаунт?{' '}
        <Link component="button" type="button" onClick={switchToLogin} sx={{ cursor: 'pointer' }}>
          Войдите
        </Link>
      </Typography>
    </form>
  );
};