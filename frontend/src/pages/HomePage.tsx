import React, { useState, useEffect, useCallback } from 'react';
import { Container, Typography, Grid, Box, Divider, CircularProgress } from '@mui/material';
import apiClient from '../services/apiService';
import { useNavigate } from 'react-router-dom';
import { useNotification } from '../context/NotificationContext';
import { CreatePresentationCard } from '../components/HomePage/CreatePresentationCard';
import { GenerateAiCard } from '../components/HomePage/GenerateAiCard';
import { GenerateAiModal } from '../components/HomePage/GenerateAiModal';
import { TemplateCarousel } from '../components/HomePage/TemplateCarousel';
import { PresentationCard } from '../components/HomePage/PresentationCard';
import { Slide } from '../hooks/usePresentation';

interface Presentation {
  id: string;
  title: string;
  updated_at: string;
  first_slide: Slide | null;
}

export const HomePage = () => {
  const [presentations, setPresentations] = useState<Presentation[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAiModalOpen, setIsAiModalOpen] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  
  const navigate = useNavigate();
  const { showNotification } = useNotification();

  const fetchPresentations = useCallback(async () => {
    try {
      const response = await apiClient.get('/presentations');
      setPresentations(response.data);
    } catch (error) {
      console.error("Failed to fetch presentations:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPresentations();
  }, [fetchPresentations]);

  const handlePresentationDeleted = (deletedId: string) => {
    setPresentations(prev => prev.filter(p => p.id !== deletedId));
  };

  const handlePresentationUpdated = (updatedPresentation: Presentation) => {
    setPresentations(prev => prev.map(p => p.id === updatedPresentation.id ? updatedPresentation : p));
  };

  const handleGenerateAi = async (prompt: string) => {
    setIsGenerating(true);
    try {
      const response = await apiClient.post('/presentations/generate-ai', { prompt });
      showNotification('Презентация успешно сгенерирована!', 'success');
      setIsAiModalOpen(false);
      navigate(`/presentations/${response.data.id}`);
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'Не удалось сгенерировать презентацию';
      showNotification(errorMessage, 'error');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCreateFromTemplate = async (templateId: string) => {
    setLoading(true);
    try {
      const response = await apiClient.post('/presentations/from-template', { template_id: templateId });
      navigate(`/presentations/${response.data.id}`);
    } catch (error) {
      showNotification('Не удалось создать презентацию из шаблона', 'error');
      setLoading(false);
    }
  };

  return (
    <>
      <Container sx={{ mt: 4, mb: 4 }}>
        <Box sx={{ mb: 4 }}>
          <Typography variant="h6" color="text.secondary" sx={{ mb: 2 }}>
            Начать работу
          </Typography>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 3 }}>
            <CreatePresentationCard />
            <GenerateAiCard onClick={() => setIsAiModalOpen(true)} />
          </Box>
        </Box>
        
        <Box sx={{ mb: 4 }}>
          <Typography variant="h6" color="text.secondary" sx={{ mb: 2 }}>
            Шаблоны
          </Typography>
          <TemplateCarousel onSelectTemplate={handleCreateFromTemplate} />
        </Box>

        <Divider />
        
        <Box sx={{ mt: 4 }}>
          <Typography variant="h6" sx={{ mb: 2 }}>
            Недавние презентации
          </Typography>
          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
              <CircularProgress />
            </Box>
          ) : presentations.length === 0 ? (
            <Typography color="text.secondary">
              У вас пока нет презентаций. Начните с создания новой!
            </Typography>
          ) : (
            <Grid container spacing={3}>
              {presentations.map(presentation => (
                <Grid size={{ xs: 12, sm: 6, md: 4, lg: 3 }} key={presentation.id}>
                  <PresentationCard
                    presentation={presentation}
                    onDelete={handlePresentationDeleted}
                    onUpdate={handlePresentationUpdated}
                  />
                </Grid>
              ))}
            </Grid>
          )}
        </Box>
      </Container>
      
      <GenerateAiModal
        open={isAiModalOpen}
        isGenerating={isGenerating}
        onClose={() => setIsAiModalOpen(false)}
        onGenerate={handleGenerateAi}
      />
    </>
  );
};