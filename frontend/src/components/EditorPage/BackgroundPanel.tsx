import React, { useRef } from 'react';
import { Box, Typography, Button, Divider } from '@mui/material';
import { ChromePicker, ColorResult } from 'react-color';
import { Slide } from '../../hooks/usePresentation';
import apiClient from '../../services/apiService';
import { useNotification } from '../../context/NotificationContext';

interface BackgroundPanelProps {
  activeSlide: Slide | null;
  onUpdateBackgroundLocal: (slideId: number, background: { backgroundColor?: string; backgroundImage?: string | null }) => void;
  onUpdateBackground: (slideId: number, background: { backgroundColor?: string; backgroundImage?: string | null }) => void;
}

export const BackgroundPanel: React.FC<BackgroundPanelProps> = ({ activeSlide, onUpdateBackground, onUpdateBackgroundLocal }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { showNotification } = useNotification();

  if (!activeSlide) return null;

  const handleColorChange = (color: ColorResult) => {
    onUpdateBackgroundLocal(activeSlide.id, { backgroundColor: color.hex });
  };

  const handleColorChangeComplete = (color: ColorResult) => {
    onUpdateBackground(activeSlide.id, { backgroundColor: color.hex });
  };

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await apiClient.post('/upload/image', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      onUpdateBackground(activeSlide.id, { backgroundImage: response.data.url });
      showNotification('Фон обновлен', 'success');
    } catch (error) {
      showNotification('Не удалось загрузить изображение', 'error');
    }
  };
  
  const handleRemoveImage = () => {
    onUpdateBackground(activeSlide.id, { backgroundImage: null });
  };

  return (
    <Box sx={{ width: 320, p: 2, borderLeft: '1px solid', borderColor: 'divider', bgcolor: 'background.default', overflowY: 'auto' }}>
      <Typography variant="h6" sx={{ mb: 2 }}>Настройки фона</Typography>
      
      <Typography gutterBottom variant="subtitle2" color="text.secondary">Цвет заливки</Typography>
      <ChromePicker
        color={activeSlide.background_color}
        onChange={handleColorChange}
        onChangeComplete={handleColorChangeComplete}
        disableAlpha
        styles={{ default: { picker: { width: '100%', boxShadow: 'none' } } }}
      />

      <Divider sx={{ my: 2 }} />

      <Typography gutterBottom variant="subtitle2" color="text.secondary">Изображение</Typography>
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleImageUpload}
        accept="image/png, image/jpeg, image/gif"
        style={{ display: 'none' }}
      />
      <Button variant="outlined" fullWidth onClick={() => fileInputRef.current?.click()}>
        Загрузить изображение
      </Button>
      {activeSlide.background_image && (
        <Button variant="text" color="error" fullWidth sx={{ mt: 1 }} onClick={handleRemoveImage}>
          Удалить изображение
        </Button>
      )}
    </Box>
  );
};