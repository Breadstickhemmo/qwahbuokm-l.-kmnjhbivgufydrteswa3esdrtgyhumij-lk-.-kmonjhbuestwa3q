import React, { useRef } from 'react';
import { AppBar, Toolbar, Typography, Tooltip, IconButton, ButtonGroup, Divider } from '@mui/material';
import DownloadIcon from '@mui/icons-material/Download';
import EditIcon from '@mui/icons-material/Edit';
import TextFieldsIcon from '@mui/icons-material/TextFields';
import ImageIcon from '@mui/icons-material/Image';
import VideoLibraryIcon from '@mui/icons-material/VideoLibrary';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import PaletteIcon from '@mui/icons-material/Palette';
import { useAuth } from '../../context/AuthContext';
import apiClient from '../../services/apiService';
import { useNotification } from '../../context/NotificationContext';
import { SlideElement } from '../../hooks/usePresentation';

type ActivePanel = 'ai' | 'background';

interface EditorToolbarProps {
  title: string;
  presentationId: string;
  onRenameClick: () => void;
  onAddElement: (type: SlideElement['element_type'], content?: string) => void;
  onAddVideoClick: () => void;
  activePanel: ActivePanel;
  onActivePanelChange: (panel: ActivePanel) => void;
}

export const EditorToolbar: React.FC<EditorToolbarProps> = ({ 
  title, presentationId, onRenameClick, onAddElement, onAddVideoClick, 
  activePanel, onActivePanelChange 
}) => {
  const { token } = useAuth();
  const { showNotification } = useNotification();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDownload = (format: 'pptx' | 'pdf') => {
    const url = `http://127.0.0.1:5000/api/presentations/${presentationId}/download/${format}`;
    const filename = `${title}.${format}`;

    fetch(url, {
      headers: { 'Authorization': `Bearer ${token}` }
    })
    .then(res => {
        if (!res.ok) {
            return res.json().then(err => { throw new Error(err.message || `Ошибка ${res.status}`) });
        }
        return res.blob();
    })
    .then(blob => {
      const href = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = href;
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(href);
    })
    .catch(error => {
        showNotification(`Не удалось скачать файл: ${error.message}`, 'error');
    });
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
      onAddElement('IMAGE', response.data.url);
    } catch (error) {
      showNotification('Не удалось загрузить изображение', 'error');
    }

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <AppBar position="static" color="default" elevation={1}>
      <Toolbar variant="dense">
        <Typography variant="h6" noWrap sx={{ flexGrow: 1 }}>{title}</Typography>
        
        <ButtonGroup variant="outlined" sx={{ mr: 2 }}>
          <Tooltip title="Добавить текст">
            <IconButton onClick={() => onAddElement('TEXT')}><TextFieldsIcon /></IconButton>
          </Tooltip>
          <Tooltip title="Добавить изображение">
            <IconButton onClick={() => fileInputRef.current?.click()}><ImageIcon /></IconButton>
          </Tooltip>
          <Tooltip title="Добавить видео">
            <IconButton onClick={onAddVideoClick}><VideoLibraryIcon /></IconButton>
          </Tooltip>
        </ButtonGroup>

        <Divider orientation="vertical" flexItem sx={{ mr: 1, ml: 1 }} />

        <Tooltip title="Переименовать"><IconButton onClick={onRenameClick}><EditIcon /></IconButton></Tooltip>
        <Tooltip title="Скачать .pptx"><IconButton onClick={() => handleDownload('pptx')}><DownloadIcon /></IconButton></Tooltip>
        <Tooltip title="Скачать .pdf"><IconButton onClick={() => handleDownload('pdf')}><PictureAsPdfIcon /></IconButton></Tooltip>
        
        <Divider orientation="vertical" flexItem sx={{ mr: 1, ml: 1 }} />

        <ButtonGroup variant="outlined">
            <Tooltip title="AI-Помощник">
                <IconButton onClick={() => onActivePanelChange('ai')} color={activePanel === 'ai' ? 'primary' : 'default'}><AutoAwesomeIcon /></IconButton>
            </Tooltip>
            <Tooltip title="Настройки фона">
                <IconButton onClick={() => onActivePanelChange('background')} color={activePanel === 'background' ? 'primary' : 'default'}><PaletteIcon /></IconButton>
            </Tooltip>
        </ButtonGroup>

      </Toolbar>
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleImageUpload}
        accept="image/png, image/jpeg, image/gif"
        style={{ display: 'none' }}
      />
    </AppBar>
  );
};