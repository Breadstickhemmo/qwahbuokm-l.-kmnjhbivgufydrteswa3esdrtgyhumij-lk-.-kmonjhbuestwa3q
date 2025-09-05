import React, { useState } from 'react';
import { Box, Paper, Typography, Button, CircularProgress, Alert, Divider } from '@mui/material';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import TextFieldsIcon from '@mui/icons-material/TextFields';
import ImageIcon from '@mui/icons-material/Image';
import { Slide, SlideElement } from '../../hooks/usePresentation';
import apiClient from '../../services/apiService';
import { useNotification } from '../../context/NotificationContext';

interface AiChatPanelProps {
  activeSlide: Slide | null;
  selectedElementIds: string[];
  onUpdateElement: (id: string, data: Partial<SlideElement>) => void;
  onAddElement: (type: SlideElement['element_type'], content?: string) => void;
}

type LoadingState = 'idle' | 'rewriting' | 'generating_image';

export const AiChatPanel: React.FC<AiChatPanelProps> = ({ 
    activeSlide, 
    selectedElementIds, 
    onUpdateElement,
    onAddElement,
}) => {
  const [loading, setLoading] = useState<LoadingState>('idle');
  const { showNotification } = useNotification();

  const getSelectedTextElement = (): SlideElement | null => {
    if (!activeSlide || selectedElementIds.length !== 1) return null;
    const element = activeSlide.elements.find(e => e.id === selectedElementIds[0]);
    return element && element.element_type === 'TEXT' ? element : null;
  };

  const selectedTextElement = getSelectedTextElement();

  const handleRewriteText = async (command: string) => {
    if (!selectedTextElement?.content) return;
    
    setLoading('rewriting');
    try {
      const response = await apiClient.post('/ai/process-text', {
        text: selectedTextElement.content,
        command: command,
      });
      onUpdateElement(selectedTextElement.id, { content: response.data.result });
      showNotification('Текст успешно обновлен', 'success');
    } catch (error: any) {
      const message = error.response?.data?.message || 'Не удалось обновить текст';
      showNotification(message, 'error');
    } finally {
      setLoading('idle');
    }
  };

  const handleSuggestImage = async () => {
    if (!activeSlide) return;

    const slideText = activeSlide.elements
      .filter(e => e.element_type === 'TEXT' && e.content)
      .map(e => e.content)
      .join('\n');

    if (!slideText.trim()) {
      showNotification('На слайде нет текста для анализа', 'warning');
      return;
    }

    setLoading('generating_image');
    try {
      const response = await apiClient.post('/ai/suggest-image', { slide_text: slideText });
      onAddElement('IMAGE', response.data.image_url);
      showNotification('Изображение добавлено на слайд', 'success');
    } catch (error: any) {
      const message = error.response?.data?.message || 'Не удалось сгенерировать изображение';
      showNotification(message, 'error');
    } finally {
      setLoading('idle');
    }
  };


  return (
    <Paper elevation={0} sx={{ width: 320, height: '100%', display: 'flex', flexDirection: 'column', borderLeft: '1px solid', borderColor: 'divider', bgcolor: 'background.default' }}>
      <Box sx={{ p: 2, display: 'flex', alignItems: 'center', gap: 1, borderBottom: '1px solid', borderColor: 'divider' }}>
        <AutoAwesomeIcon color="primary" />
        <Typography variant="h6" sx={{ fontWeight: 'medium' }}>AI-Помощник</Typography>
      </Box>
      <Box sx={{ p: 2, overflowY: 'auto', flexGrow: 1 }}>
        {!activeSlide ? (
            <Alert severity="info">Выберите слайд, чтобы начать работу с AI-помощником.</Alert>
        ) : (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                
                <Typography variant="subtitle2" color="text.secondary">Работа с текстом</Typography>
                <Alert severity="info" sx={{ fontSize: '0.8rem' }}>
                    Выберите один текстовый блок на слайде, чтобы активировать эти функции.
                </Alert>
                <Button 
                    variant="outlined" 
                    startIcon={loading === 'rewriting' ? <CircularProgress size={20} /> : <TextFieldsIcon />}
                    disabled={!selectedTextElement || loading !== 'idle'}
                    onClick={() => handleRewriteText('Сделай текст короче и проще')}
                >
                    Сократить текст
                </Button>
                <Button 
                    variant="outlined" 
                    startIcon={loading === 'rewriting' ? <CircularProgress size={20} /> : <TextFieldsIcon />}
                    disabled={!selectedTextElement || loading !== 'idle'}
                    onClick={() => handleRewriteText('Улучши стиль и исправь ошибки')}
                >
                    Улучшить текст
                </Button>

                <Divider sx={{ my: 1 }} />
                
                <Typography variant="subtitle2" color="text.secondary">Работа с изображениями</Typography>
                 <Alert severity="info" sx={{ fontSize: '0.8rem' }}>
                    AI проанализирует весь текст на текущем слайде и создаст подходящее изображение.
                </Alert>
                <Button 
                    variant="contained" 
                    startIcon={loading === 'generating_image' ? <CircularProgress size={20} /> : <ImageIcon />}
                    disabled={loading !== 'idle'}
                    onClick={handleSuggestImage}
                >
                    Подобрать картинку
                </Button>
            </Box>
        )}
      </Box>
    </Paper>
  );
};