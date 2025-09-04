import React, { useState, useEffect } from 'react';
import {
  Dialog, DialogTitle, DialogContent, Grid, Paper,
  Typography, Box, CircularProgress, Alert
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import apiClient from '../../services/apiService';

interface Template {
  id: string;
  title: string;
  preview_image: string | null;
}

interface TemplateSelectionModalProps {
  open: boolean;
  onClose: () => void;
  onSelect: (templateId: string | null) => void;
}

export const TemplateSelectionModal: React.FC<TemplateSelectionModalProps> = ({ open, onClose, onSelect }) => {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setLoading(true);
      apiClient.get('/templates')
        .then(response => {
          setTemplates(response.data);
          setError(null);
        })
        .catch(() => setError('Не удалось загрузить шаблоны.'))
        .finally(() => setLoading(false));
    }
  }, [open]);

  const TemplateCard: React.FC<{
    title: string;
    image?: string | null;
    onClick: () => void;
  }> = ({ title, image, onClick }) => (
    <Grid  size={{ xs: 6, sm: 4 }}>
      <Paper
        onClick={onClick}
        sx={{
          aspectRatio: '16/10',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          border: '1px solid',
          borderColor: 'divider',
          transition: 'all 0.2s',
          '&:hover': {
            borderColor: 'primary.main',
            boxShadow: 4,
            transform: 'translateY(-4px)',
          }
        }}
      >
        <Box sx={{ flexGrow: 1, width: '100%', background: image ? `url(${image})` : '#f5f5f5', backgroundSize: 'cover', backgroundPosition: 'center', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          {!image && <AddIcon sx={{ fontSize: 40, color: 'primary.main' }} />}
        </Box>
        <Typography sx={{ p: 1, fontWeight: 'medium', width: '100%', textAlign: 'center' }}>{title}</Typography>
      </Paper>
    </Grid>
  );

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="md">
      <DialogTitle>Выберите шаблон для начала</DialogTitle>
      <DialogContent>
        {loading && <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}><CircularProgress /></Box>}
        {error && <Alert severity="error">{error}</Alert>}
        {!loading && !error && (
          <Grid container spacing={3}>
            <TemplateCard title="Пустая презентация" onClick={() => onSelect(null)} />
            {templates.map(template => (
              <TemplateCard
                key={template.id}
                title={template.title}
                image={template.preview_image}
                onClick={() => onSelect(template.id)}
              />
            ))}
          </Grid>
        )}
      </DialogContent>
    </Dialog>
  );
};