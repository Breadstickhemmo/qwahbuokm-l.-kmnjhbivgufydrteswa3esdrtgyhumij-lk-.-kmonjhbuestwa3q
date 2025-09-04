import React from 'react';
import { Box, Paper, Typography, TextField, IconButton, CircularProgress } from '@mui/material';
import SendIcon from '@mui/icons-material/Send';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';

export const AiChatPanel = () => {
  const [prompt, setPrompt] = React.useState('');
  const [isLoading, setIsLoading] = React.useState(false);
  const [messages, setMessages] = React.useState([
    { from: 'ai', text: 'Чем я могу помочь с этим слайдом? Попросите меня переписать текст или найти подходящее изображение.' }
  ]);

  const handleSend = () => {
    if (!prompt.trim()) return;
    setIsLoading(true);
    setTimeout(() => {
      setMessages(prev => [...prev, { from: 'user', text: prompt }, { from: 'ai', text: `Это отличная идея! Вот ваш текст на тему "${prompt}": ... ` }]);
      setPrompt('');
      setIsLoading(false);
    }, 1500);
  };

  return (
    <Paper elevation={0} sx={{ width: 320, height: '100%', display: 'flex', flexDirection: 'column', borderLeft: '1px solid', borderColor: 'divider', bgcolor: 'background.default' }}>
      <Box sx={{ p: 2, display: 'flex', alignItems: 'center', gap: 1, borderBottom: '1px solid', borderColor: 'divider' }}>
        <AutoAwesomeIcon color="primary" />
        <Typography variant="h6" sx={{ fontWeight: 'medium' }}>AI-Помощник</Typography>
      </Box>
      <Box sx={{ flexGrow: 1, p: 2, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 2 }}>
        {messages.map((msg, index) => (
          <Box key={index} sx={{
            p: 1.5,
            borderRadius: 2,
            bgcolor: msg.from === 'user' ? 'primary.main' : 'grey.100',
            color: msg.from === 'user' ? 'primary.contrastText' : 'text.primary',
            alignSelf: msg.from === 'user' ? 'flex-end' : 'flex-start',
            maxWidth: '90%',
          }}>
            <Typography variant="body2">{msg.text}</Typography>
          </Box>
        ))}
      </Box>
      <Box sx={{ p: 2, borderTop: '1px solid', borderColor: 'divider' }}>
        <TextField
          placeholder="Спросите что-нибудь..."
          variant="outlined"
          size="small"
          fullWidth
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          disabled={isLoading}
          onKeyPress={(e) => e.key === 'Enter' && handleSend()}
          InputProps={{
            endAdornment: (
              <IconButton onClick={handleSend} disabled={isLoading}>
                {isLoading ? <CircularProgress size={24} /> : <SendIcon />}
              </IconButton>
            )
          }}
        />
      </Box>
    </Paper>
  );
};