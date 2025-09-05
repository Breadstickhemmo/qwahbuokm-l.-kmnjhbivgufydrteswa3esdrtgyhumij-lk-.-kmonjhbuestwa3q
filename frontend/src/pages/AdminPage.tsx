import React, { useState } from 'react';
import {
  Container, Typography, Box, Paper, Button, Tabs, Tab
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import { useNavigate } from 'react-router-dom';
import apiClient from '../services/apiService';
import { useNotification } from '../context/NotificationContext';
import { TemplateManagement } from '../components/admin/TemplateManagement';
import { UserManagement } from '../components/admin/UserManagement';
import { PromptManagement } from '../components/admin/PromptManagement';

export const AdminPage = () => {
  const [tabIndex, setTabIndex] = useState(0);
  const navigate = useNavigate();
  const { showNotification } = useNotification();

  const handleCreateTemplate = async () => {
    try {
      const response = await apiClient.post('/admin/templates');
      navigate(`/presentations/${response.data.id}`);
    } catch (error) {
      showNotification('Не удалось создать шаблон', 'error');
    }
  };

  return (
    <Container sx={{ mt: 4, mb: 4 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1">Админ-панель</Typography>
        {tabIndex === 0 && (
          <Button variant="contained" startIcon={<AddIcon />} onClick={handleCreateTemplate}>
            Создать шаблон
          </Button>
        )}
      </Box>

      <Paper>
        <Tabs value={tabIndex} onChange={(e, newValue) => setTabIndex(newValue)} sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tab label="Управление шаблонами" />
          <Tab label="Управление пользователями" />
          <Tab label="Управление AI-промптами" />
        </Tabs>

        {tabIndex === 0 && <TemplateManagement />}
        {tabIndex === 1 && <UserManagement />}
        {tabIndex === 2 && <PromptManagement />}
      </Paper>
    </Container>
  );
};