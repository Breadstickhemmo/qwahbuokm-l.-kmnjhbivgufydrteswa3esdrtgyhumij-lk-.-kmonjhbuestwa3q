import React, { useState, useEffect } from 'react';
import {
  Box, Typography, Paper, IconButton, CircularProgress, Alert
} from '@mui/material';
import ArrowBackIosNewIcon from '@mui/icons-material/ArrowBackIosNew';
import ArrowForwardIosIcon from '@mui/icons-material/ArrowForwardIos';
import apiClient from '../../services/apiService';

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
const VISIBLE_CARDS = 3;

export const TemplateCarousel: React.FC<TemplateCarouselProps> = ({ onSelectTemplate }) => {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    apiClient.get('/templates')
      .then(response => setTemplates(response.data))
      .catch(() => setError('Не удалось загрузить шаблоны.'))
      .finally(() => setLoading(false));
  }, []);

  const handleNext = () => {
    setCurrentIndex(prev => Math.min(prev + 1, templates.length - VISIBLE_CARDS));
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
    return null;
  }

  return (
    <Box sx={{ position: 'relative', width: (CARD_WIDTH * VISIBLE_CARDS) + (GAP * (VISIBLE_CARDS - 1)) }}>
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
              <Box sx={{ height: 120, width: '100%', background: `url(${template.preview_image})`, backgroundSize: 'cover', backgroundPosition: 'center' }} />
              <Typography sx={{ p: 1, fontWeight: 'medium', textAlign: 'center', flexGrow: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {template.title}
              </Typography>
            </Paper>
          ))}
        </Box>
      </Box>
      {currentIndex > 0 && (
        <IconButton onClick={handlePrev} sx={{ position: 'absolute', top: '50%', left: -16, transform: 'translateY(-50%)', zIndex: 2, bgcolor: 'background.paper', '&:hover': { bgcolor: 'grey.200' } }}>
          <ArrowBackIosNewIcon />
        </IconButton>
      )}
      {currentIndex < templates.length - VISIBLE_CARDS && (
        <IconButton onClick={handleNext} sx={{ position: 'absolute', top: '50%', right: -16, transform: 'translateY(-50%)', zIndex: 2, bgcolor: 'background.paper', '&:hover': { bgcolor: 'grey.200' } }}>
          <ArrowForwardIosIcon />
        </IconButton>
      )}
    </Box>
  );
};