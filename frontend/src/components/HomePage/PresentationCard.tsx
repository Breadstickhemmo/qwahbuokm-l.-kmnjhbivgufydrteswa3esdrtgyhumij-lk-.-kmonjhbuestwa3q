import React, { useState } from 'react';
import { Card, CardContent, Typography, Box, IconButton, Menu, MenuItem, Dialog, DialogTitle, DialogContent, TextField, DialogActions, Button } from '@mui/material';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import { Link } from 'react-router-dom';
import apiClient from '../../services/apiService';
import { useNotification } from '../../context/NotificationContext';
import { SlidePreview } from '../EditorPage/SlidePreview';
import { Slide } from '../../hooks/usePresentation';

interface Presentation {
  id: string;
  title: string;
  updated_at: string;
  first_slide: Slide | null;
}

interface PresentationCardProps {
  presentation: Presentation;
  onDelete: (id: string) => void;
  onUpdate: (presentation: Presentation) => void;
}

const BASE_SLIDE_WIDTH = 1280; 
const THUMBNAIL_WIDTH = 270; 
const SCALE_FACTOR = THUMBNAIL_WIDTH / BASE_SLIDE_WIDTH;


export const PresentationCard: React.FC<PresentationCardProps> = ({ presentation, onDelete, onUpdate }) => {
  const { showNotification } = useNotification();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [isRenameOpen, setIsRenameOpen] = useState(false);
  const [newTitle, setNewTitle] = useState(presentation.title);

  const handleMenuClick = (event: React.MouseEvent<HTMLElement>) => {
    event.preventDefault();
    event.stopPropagation();
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => { setAnchorEl(null); };

  const handleDelete = async () => {
    handleMenuClose();
    try {
      await apiClient.delete(`/presentations/${presentation.id}`);
      showNotification('Презентация удалена', 'success');
      onDelete(presentation.id);
    } catch (error) { showNotification('Не удалось удалить презентацию', 'error'); }
  };
  
  const handleRenameOpen = () => { setIsRenameOpen(true); handleMenuClose(); };
  const handleRenameClose = () => { setIsRenameOpen(false); setNewTitle(presentation.title); };

  const handleRenameSave = async () => {
    try {
      const response = await apiClient.put(`/presentations/${presentation.id}`, { title: newTitle });
      showNotification('Презентация переименована', 'success');
      onUpdate(response.data);
      handleRenameClose();
    } catch (error) { showNotification('Не удалось переименовать', 'error'); }
  };

  return (
    <>
      <Card
        sx={{
          textDecoration: 'none',
          border: '1px solid',
          borderColor: 'divider',
          transition: 'box-shadow 0.2s, border-color 0.2s',
          '&:hover': {
            boxShadow: 2,
            borderColor: 'primary.main',
          },
          display: 'flex',
          flexDirection: 'column'
        }}
        component={Link}
        to={`/presentations/${presentation.id}`}
      >
        <Box
          sx={{
            aspectRatio: '16 / 9',
            bgcolor: 'background.paper',
            overflow: 'hidden',
            position: 'relative',
          }}
        >
          {presentation.first_slide ? (
             <Box sx={{
                transform: `scale(${SCALE_FACTOR})`,
                transformOrigin: 'top left',
                width: BASE_SLIDE_WIDTH,
                height: BASE_SLIDE_WIDTH * (9 / 16),
              }}>
                <SlidePreview slide={presentation.first_slide} />
              </Box>
          ) : (
            <Box sx={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Typography variant="caption" color="text.secondary">Пустая презентация</Typography>
            </Box>
          )}
        </Box>
        <CardContent sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', p: 1.5, borderTop: '1px solid', borderColor: 'divider' }}>
          <Box>
            <Typography noWrap sx={{ maxWidth: 160, fontWeight: 'medium' }}>{presentation.title}</Typography>
            <Typography variant="body2" color="text.secondary">{new Date(presentation.updated_at).toLocaleDateString()}</Typography>
          </Box>
          <IconButton aria-label="settings" onClick={handleMenuClick} size="small"><MoreVertIcon /></IconButton>
        </CardContent>
      </Card>
      <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={handleMenuClose}>
        <MenuItem onClick={handleRenameOpen}>Переименовать</MenuItem>
        <MenuItem onClick={handleDelete} sx={{ color: 'error.main' }}>Удалить</MenuItem>
      </Menu>
      <Dialog open={isRenameOpen} onClose={handleRenameClose}>
        <DialogTitle>Переименовать презентацию</DialogTitle>
        <DialogContent>
          <TextField autoFocus margin="dense" label="Название презентации" type="text" fullWidth variant="standard" value={newTitle} onChange={(e) => setNewTitle(e.target.value)} />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleRenameClose}>Отмена</Button>
          <Button onClick={handleRenameSave}>Сохранить</Button>
        </DialogActions>
      </Dialog>
    </>
  );
};