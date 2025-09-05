import React, { useState, useEffect, useCallback } from 'react';
import {
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  CircularProgress, Box, IconButton, Tooltip, Dialog, DialogTitle,
  DialogContent, TextField, DialogActions, Button
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import apiClient from '../../services/apiService';
import { useNotification } from '../../context/NotificationContext';

interface Prompt {
  id: number;
  name: string;
  description: string;
  prompt_text: string;
}

export const PromptManagement = () => {
  const [prompts, setPrompts] = useState<Prompt[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingPrompt, setEditingPrompt] = useState<Prompt | null>(null);
  const { showNotification } = useNotification();

  const fetchPrompts = useCallback(async () => {
    setLoading(true);
    try {
      const response = await apiClient.get('/admin/prompts');
      setPrompts(response.data);
    } catch (error) {
      showNotification('Не удалось загрузить промпты', 'error');
    } finally {
      setLoading(false);
    }
  }, [showNotification]);

  useEffect(() => {
    fetchPrompts();
  }, [fetchPrompts]);

  const handleSave = async () => {
    if (!editingPrompt) return;
    try {
      await apiClient.put(`/admin/prompts/${editingPrompt.id}`, { prompt_text: editingPrompt.prompt_text });
      showNotification('Промпт успешно обновлен', 'success');
      setPrompts(prev => prev.map(p => p.id === editingPrompt.id ? editingPrompt : p));
      setEditingPrompt(null);
    } catch {
      showNotification('Ошибка обновления промпта', 'error');
    }
  };

  if (loading) {
    return <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}><CircularProgress /></Box>;
  }

  return (
    <>
      <TableContainer>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell sx={{width: '20%'}}>Назначение</TableCell>
              <TableCell>Описание</TableCell>
              <TableCell align="right">Действия</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {prompts.map((prompt) => (
              <TableRow key={prompt.id} hover>
                <TableCell>{prompt.name}</TableCell>
                <TableCell>{prompt.description}</TableCell>
                <TableCell align="right">
                  <Tooltip title="Редактировать промпт">
                    <IconButton onClick={() => setEditingPrompt(prompt)}>
                      <EditIcon />
                    </IconButton>
                  </Tooltip>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog open={!!editingPrompt} onClose={() => setEditingPrompt(null)} fullWidth maxWidth="md">
        <DialogTitle>Редактирование промпта: {editingPrompt?.name}</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Текст системного промпта"
            type="text"
            fullWidth
            multiline
            rows={15}
            variant="outlined"
            value={editingPrompt?.prompt_text}
            onChange={(e) => editingPrompt && setEditingPrompt({ ...editingPrompt, prompt_text: e.target.value })}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditingPrompt(null)}>Отмена</Button>
          <Button onClick={handleSave} variant="contained">Сохранить</Button>
        </DialogActions>
      </Dialog>
    </>
  );
};