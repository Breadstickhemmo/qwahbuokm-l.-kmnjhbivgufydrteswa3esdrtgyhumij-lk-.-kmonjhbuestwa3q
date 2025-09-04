import { Box, Container, Typography, Link } from '@mui/material';

export const Footer = () => {
  return (
    <Box
      component="footer"
      sx={{
        py: 3,
        mt: 'auto',
        borderTop: 1,
        borderColor: 'divider',
      }}
    >
      <Container maxWidth="lg">
        <Typography variant="body1" align="center">
          Презентатор.ИИ
        </Typography>
        <Typography variant="body2" color="text.secondary" align="center">
          {'© '}
          <Link color="inherit" href="#" sx={{ textDecoration: 'none' }}>
            Ваш Сайт
          </Link>{' '}
          {new Date().getFullYear()}
          {'. Все права защищены.'}
        </Typography>
      </Container>
    </Box>
  );
};