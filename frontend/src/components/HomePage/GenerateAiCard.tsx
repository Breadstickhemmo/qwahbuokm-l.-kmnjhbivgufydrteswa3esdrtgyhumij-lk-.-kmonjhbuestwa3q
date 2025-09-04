import { useState } from 'react';
import { Paper, Typography, CircularProgress, Box, TextField, Button, Grow } from '@mui/material';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import { useNavigate } from 'react-router-dom';
import apiClient from '../../services/apiService';
import { useNotification } from '../../context/NotificationContext';

export const GenerateAiCard = () => {
  const [isCreating, setIsCreating] = useState(false);
  const [prompt, setPrompt] = useState('');
  const navigate = useNavigate();
  const { showNotification } = useNotification();

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      showNotification('Пожалуйста, введите тему презентации', 'warning');
      return;
    }
    setIsCreating(true);
    try {
      const response = await apiClient.post('/presentations/generate-ai', { prompt });
      navigate(`/presentations/${response.data.id}`);
    } catch (error) {
      showNotification('Не удалось сгенерировать презентацию', 'error');
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <Grow in={true}>
      <Paper
        sx={{
          p: 2,
          border: '1px solid',
          borderColor: 'divider',
          display: 'flex',
          flexDirection: 'column',
          gap: 2,
          width: { xs: '100%', sm: 345 },
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <AutoAwesomeIcon color="primary" />
          <Typography sx={{ fontWeight: 'medium' }}>Сгенерировать с ИИ</Typography>
        </Box>
        <TextField
          label="Введите тему презентации..."
          variant="outlined"
          size="small"
          fullWidth
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          disabled={isCreating}
          onKeyPress={(e) => e.key === 'Enter' && handleGenerate()}
        />
        <Button 
          variant="contained" 
          onClick={handleGenerate} 
          disabled={isCreating || !prompt.trim()}
          startIcon={isCreating ? <CircularProgress size={20} color="inherit" /> : null}
        >
          {isCreating ? 'Генерация...' : 'Создать'}
        </Button>
      </Paper>
    </Grow>
  );
};