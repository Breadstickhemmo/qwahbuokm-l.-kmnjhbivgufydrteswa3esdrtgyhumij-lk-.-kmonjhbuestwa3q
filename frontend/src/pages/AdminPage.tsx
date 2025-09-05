import React, { useState, useEffect, useCallback } from 'react';
import {
  Container, Typography, Box, Paper, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, IconButton, Button, CircularProgress,
  Dialog, DialogTitle, DialogActions
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import { useNavigate } from 'react-router-dom';
import apiClient from '../services/apiService';
import { useNotification } from '../context/NotificationContext';
import { ImageUpload } from '../components/admin/ImageUpload';
import { EditableTableNameCell } from '../components/admin/EditableTableNameCell';

interface Template {
  id: string;
  title: string;
  created_at: string;
  preview_image: string | null;
}

export const AdminPage = () => {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [templateToDelete, setTemplateToDelete] = useState<Template | null>(null);

  const navigate = useNavigate();
  const { showNotification } = useNotification();

  const fetchTemplates = useCallback(async () => {
    try {
      setLoading(true);
      const response = await apiClient.get('/admin/templates');
      setTemplates(response.data);
    } catch (error) {
      showNotification('Не удалось загрузить шаблоны', 'error');
    } finally {
      setLoading(false);
    }
  }, [showNotification]);

  useEffect(() => {
    fetchTemplates();
  }, [fetchTemplates]);

  const handleCreate = async () => {
    try {
      const response = await apiClient.post('/admin/templates');
      navigate(`/presentations/${response.data.id}`);
    } catch (error) {
      showNotification('Не удалось создать шаблон', 'error');
    }
  };

  const openDeleteDialog = (template: Template) => {
    setTemplateToDelete(template);
    setDeleteDialogOpen(true);
  };
  
  const closeDeleteDialog = () => {
    setTemplateToDelete(null);
    setDeleteDialogOpen(false);
  };
  
  const handleDelete = async () => {
    if (!templateToDelete) return;
    try {
      await apiClient.delete(`/admin/templates/${templateToDelete.id}`);
      showNotification('Шаблон удален', 'success');
      setTemplates(prev => prev.filter(t => t.id !== templateToDelete.id));
    } catch (error) {
      showNotification('Не удалось удалить шаблон', 'error');
    } finally {
      closeDeleteDialog();
    }
  };

  const handleTitleSave = async (templateId: string, newTitle: string) => {
    try {
      await apiClient.put(`/admin/templates/${templateId}`, { title: newTitle });
      setTemplates(prev => prev.map(t => t.id === templateId ? { ...t, title: newTitle } : t));
      showNotification('Название обновлено', 'success');
    } catch {
      showNotification('Ошибка обновления названия', 'error');
      fetchTemplates();
    }
  };

  const handlePreviewUpload = async (templateId: string, file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    try {
      const response = await apiClient.post(
        `/admin/templates/${templateId}/upload-preview`, 
        formData,
        {
          headers: { 'Content-Type': 'multipart/form-data' },
        }
      );
      setTemplates(prev => prev.map(t => t.id === templateId ? { ...t, preview_image: response.data.url } : t));
    } catch {
      showNotification('Не удалось загрузить превью', 'error');
      throw new Error('Upload failed');
    }
  };

  return (
    <Container sx={{ mt: 4, mb: 4 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1">Управление шаблонами</Typography>
        <Button variant="contained" startIcon={<AddIcon />} onClick={handleCreate}>Создать шаблон</Button>
      </Box>

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center' }}><CircularProgress /></Box>
      ) : (
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell sx={{ width: 120 }}>Превью</TableCell>
                <TableCell>Название шаблона</TableCell>
                <TableCell>Дата создания</TableCell>
                <TableCell align="right">Действия</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {templates.map((template) => (
                <TableRow key={template.id} hover>
                  <TableCell>
                    <ImageUpload 
                      initialImageUrl={template.preview_image}
                      onUpload={(file) => handlePreviewUpload(template.id, file)}
                    />
                  </TableCell>
                  <EditableTableNameCell 
                    initialValue={template.title} 
                    onSave={(newTitle) => handleTitleSave(template.id, newTitle)}
                  />
                  <TableCell>{new Date(template.created_at).toLocaleDateString()}</TableCell>
                  <TableCell align="right">
                    <IconButton onClick={() => navigate(`/presentations/${template.id}`)} title="Редактировать содержимое"><EditIcon /></IconButton>
                    <IconButton onClick={() => openDeleteDialog(template)} title="Удалить" color="error"><DeleteIcon /></IconButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}
      
      <Dialog open={deleteDialogOpen} onClose={closeDeleteDialog}>
        <DialogTitle>Подтвердите удаление</DialogTitle>
        <DialogActions>
          <Button onClick={closeDeleteDialog}>Отмена</Button>
          <Button onClick={handleDelete} color="error">Удалить</Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};