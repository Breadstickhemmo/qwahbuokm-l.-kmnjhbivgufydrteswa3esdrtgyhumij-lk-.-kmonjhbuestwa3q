import React, { useState, useEffect, useRef } from 'react';
import {
  Box, Typography, Paper, IconButton, CircularProgress, Alert
} from '@mui/material';
import ArrowBackIosNewIcon from '@mui/icons-material/ArrowBackIosNew';
import ArrowForwardIosIcon from '@mui/icons-material/ArrowForwardIos';
import apiClient from '../../services/apiService';
import { useContainerWidth } from '../../hooks/useContainerWidth';

interface Template {
  id: string;
  title: string;
  preview_image: string | null;
}

interface TemplateCarouselProps {
  onSelectTemplate: (templateId: string) => void;
}

const CARD_WIDTH = 210;
const GAP = 16;

export const TemplateCarousel: React.FC<TemplateCarouselProps> = ({ onSelectTemplate }) => {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);

  const carouselContainerRef = useRef<HTMLDivElement>(null);
  const containerWidth = useContainerWidth(carouselContainerRef);

  const visibleCards = Math.floor((containerWidth + GAP) / (CARD_WIDTH + GAP));
  
  const showArrows = templates.length > visibleCards;

  useEffect(() => {
    apiClient.get('/templates')
      .then(response => setTemplates(response.data))
      .catch(() => setError('Не удалось загрузить шаблоны.'))
      .finally(() => setLoading(false));
  }, []);

  const handleNext = () => {
    setCurrentIndex(prev => Math.min(prev + 1, templates.length - visibleCards));
  };

  const handlePrev = () => {
    setCurrentIndex(prev => Math.max(prev - 1, 0));
  };
  
  if (loading) {
    return <CircularProgress />;
  }
  
  if (error) {
    return <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert>;
  }
  
  if (templates.length === 0) {
    return <Typography color="text.secondary">Пока нет доступных шаблонов.</Typography>;
  }

  return (
    <Box 
      ref={carouselContainerRef} 
      sx={{ 
        position: 'relative', 
        width: '100%', 
        maxWidth: (CARD_WIDTH * 5) + (GAP * 4),
        mx: 'auto' 
      }}
    >
      <Box sx={{ width: '100%', overflow: 'hidden' }}>
        <Box sx={{
          display: 'flex',
          gap: `${GAP}px`,
          transition: 'transform 0.5s ease-in-out',
          transform: `translateX(-${currentIndex * (CARD_WIDTH + GAP)}px)`,
        }}>
          {templates.map(template => (
            <Paper
              key={template.id}
              onClick={() => onSelectTemplate(template.id)}
              sx={{
                width: CARD_WIDTH,
                minWidth: CARD_WIDTH,
                height: 160,
                cursor: 'pointer',
                border: '1px solid',
                borderColor: 'divider',
                transition: 'all 0.2s',
                display: 'flex',
                flexDirection: 'column',
                '&:hover': {
                  borderColor: 'primary.main',
                  boxShadow: 4,
                }
              }}
            >
              <Box sx={{ 
                  height: 120, 
                  width: '100%', 
                  bgcolor: 'grey.200',
                  backgroundImage: template.preview_image 
                    ? `url(http://127.0.0.1:5000${template.preview_image})` 
                    : 'none', 
                  backgroundSize: 'cover', 
                  backgroundPosition: 'center' 
                }} 
              />
              <Typography sx={{ p: 1, fontWeight: 'medium', textAlign: 'center', flexGrow: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {template.title}
              </Typography>
            </Paper>
          ))}
        </Box>
      </Box>
      {showArrows && currentIndex > 0 && (
        <IconButton onClick={handlePrev} sx={{ position: 'absolute', top: '40%', left: -16, transform: 'translateY(-50%)', zIndex: 2, bgcolor: 'background.paper', boxShadow: 3, '&:hover': { bgcolor: 'grey.200' } }}>
          <ArrowBackIosNewIcon />
        </IconButton>
      )}
      {showArrows && currentIndex < templates.length - visibleCards && (
        <IconButton onClick={handleNext} sx={{ position: 'absolute', top: '40%', right: -16, transform: 'translateY(-50%)', zIndex: 2, bgcolor: 'background.paper', boxShadow: 3, '&:hover': { bgcolor: 'grey.200' } }}>
          <ArrowForwardIosIcon />
        </IconButton>
      )}
    </Box>
  );
};