import { useState } from 'react';
import { Paper, Typography, CircularProgress } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import { useNavigate } from 'react-router-dom';
import apiClient from '../../services/apiService';
import { useNotification } from '../../context/NotificationContext';

export const CreatePresentationCard = () => {
  const [isCreating, setIsCreating] = useState(false);
  const navigate = useNavigate();
  const { showNotification } = useNotification();

  const handleCreate = async () => {
    setIsCreating(true);
    try {
      const response = await apiClient.post('/presentations', { title: 'Новая презентация' });
      navigate(`/presentations/${response.data.id}`);
    } catch (error) {
      showNotification('Не удалось создать презентацию', 'error');
      setIsCreating(false);
    }
  };

  return (
    <Paper
      onClick={handleCreate}
      sx={{
        width: 210,
        height: 160,
        border: '1px solid',
        borderColor: 'divider',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: 'pointer',
        transition: 'all 0.2s',
        '&:hover': {
          borderColor: 'primary.main',
          boxShadow: 4,
          transform: 'translateY(-4px)',
        },
      }}
    >
      {isCreating ? (
        <CircularProgress />
      ) : (
        <>
          <AddIcon sx={{ fontSize: 60, color: 'text.secondary' }} />
          <Typography sx={{ mt: 1 }}>Пустая презентация</Typography>
        </>
      )}
    </Paper>
  );
};