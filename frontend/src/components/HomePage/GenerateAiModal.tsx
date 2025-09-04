import React, { useState } from 'react';
import {
  Button, Dialog, DialogActions, DialogContent,
  DialogContentText, DialogTitle, TextField, CircularProgress
} from '@mui/material';

interface GenerateAiModalProps {
  open: boolean;
  isGenerating: boolean;
  onClose: () => void;
  onGenerate: (prompt: string) => void;
}

export const GenerateAiModal: React.FC<GenerateAiModalProps> = ({ open, isGenerating, onClose, onGenerate }) => {
  const [prompt, setPrompt] = useState('');

  const handleGenerateClick = () => {
    if (prompt.trim()) {
      onGenerate(prompt);
    }
  };

  const handleClose = () => {
    if (!isGenerating) {
      setPrompt('');
      onClose();
    }
  };

  return (
    <Dialog open={open} onClose={handleClose} fullWidth maxWidth="sm">
      <DialogTitle fontWeight="bold">Создание презентации с помощью ИИ</DialogTitle>
      <DialogContent>
        <DialogContentText sx={{ mb: 2 }}>
            Опишите тему презентации, и ИИ создаст для вас черновик.
            Например, «Солнечная система для пятиклассников».
        </DialogContentText>
        <TextField
          autoFocus
          margin="dense"
          id="prompt"
          label="Введите тему презентации..."
          type="text"
          fullWidth
          multiline
          rows={4}
          variant="outlined"
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          disabled={isGenerating}
        />
      </DialogContent>
      <DialogActions sx={{ p: '0 24px 16px' }}>
        <Button onClick={handleClose} disabled={isGenerating}>Отмена</Button>
        <Button 
          onClick={handleGenerateClick} 
          variant="contained" 
          disabled={!prompt.trim() || isGenerating}
          startIcon={isGenerating ? <CircularProgress size={20} color="inherit" /> : null}
        >
          {isGenerating ? 'Генерация...' : 'Сгенерировать'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};