import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Container from '@mui/material/Container';
import Grid from '@mui/material/Grid';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import VideoCameraBackIcon from '@mui/icons-material/VideoCameraBack';
import EditNoteIcon from '@mui/icons-material/EditNote';

const features = [
  {
    icon: <AutoAwesomeIcon sx={{ fontSize: 40 }} color="primary" />,
    title: 'ИИ-генерация слайдов',
    description: 'Просто введите тему, и наш ИИ создаст структуру и наполнит слайды контентом за секунды.',
  },
  {
    icon: <VideoCameraBackIcon sx={{ fontSize: 40 }} color="primary" />,
    title: 'Поддержка видео',
    description: 'Легко вставляйте видео с вашего компьютера или по ссылке, чтобы сделать уроки более наглядными.',
  },
  {
    icon: <EditNoteIcon sx={{ fontSize: 40 }} color="primary" />,
    title: 'Простой редактор',
    description: 'Интуитивно понятный интерфейс, который не требует времени на освоение. Сосредоточьтесь на содержании.',
  },
];

export const FeaturesSection = () => {
  return (
    <Box sx={{ bgcolor: 'background.paper', py: 10 }}>
      <Container maxWidth="lg">
        <Typography variant="h4" component="h2" fontWeight="bold" textAlign="center" gutterBottom>
          Все, что нужно для современного урока
        </Typography>
        <Grid container spacing={5} sx={{ mt: 5 }}>
          {features.map((feature) => (
            <Grid size={{ xs: 12, md: 4 }} key={feature.title}>
              <Box textAlign="center">
                {feature.icon}
                <Typography variant="h6" component="h3" fontWeight="bold" sx={{ mt: 2 }}>
                  {feature.title}
                </Typography>
                <Typography color="text.secondary" sx={{ mt: 1 }}>
                  {feature.description}
                </Typography>
              </Box>
            </Grid>
          ))}
        </Grid>
      </Container>
    </Box>
  );
};
