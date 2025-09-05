import React, { useState, useEffect, useCallback } from 'react';
import {
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow, 
  CircularProgress, Switch, Box
} from '@mui/material';
import apiClient from '../../services/apiService';
import { useNotification } from '../../context/NotificationContext';

interface User {
  id: number;
  email: string;
  is_admin: boolean;
  can_use_ai: boolean;
}

export const UserManagement = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const { showNotification } = useNotification();

  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true);
      const response = await apiClient.get('/admin/users');
      setUsers(response.data);
    } catch (error) {
      showNotification('Не удалось загрузить пользователей', 'error');
    } finally {
      setLoading(false);
    }
  }, [showNotification]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleAiAccessChange = async (user: User, newAccess: boolean) => {
    try {
      await apiClient.put(`/admin/users/${user.id}`, { can_use_ai: newAccess });
      setUsers(prev => prev.map(u => u.id === user.id ? { ...u, can_use_ai: newAccess } : u));
      showNotification(`Доступ к ИИ для ${user.email} обновлен`, 'success');
    } catch {
      showNotification('Ошибка обновления доступа', 'error');
    }
  };

  if (loading) {
    return <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}><CircularProgress /></Box>;
  }

  return (
    <TableContainer>
      <Table>
        <TableHead>
          <TableRow>
            <TableCell>ID</TableCell>
            <TableCell>Email</TableCell>
            <TableCell>Администратор</TableCell>
            <TableCell>Доступ к ИИ</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {users.map((user) => (
            <TableRow key={user.id} hover>
              <TableCell>{user.id}</TableCell>
              <TableCell>{user.email}</TableCell>
              <TableCell>{user.is_admin ? 'Да' : 'Нет'}</TableCell>
              <TableCell>
                <Switch
                  checked={user.can_use_ai}
                  onChange={(e) => handleAiAccessChange(user, e.target.checked)}
                  disabled={user.is_admin}
                />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
};