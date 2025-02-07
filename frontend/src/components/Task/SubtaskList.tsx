import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  IconButton,
  TextField,
  Checkbox,
  Typography,
  CircularProgress,
  Paper,
  Button,
  useTheme,
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  Save as SaveIcon,
  Cancel as CancelIcon,
} from '@mui/icons-material';
import { api } from '../../services/api';
import { Subtask, Task } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { useSnackbar } from 'notistack';

interface SubtaskListProps {
  task: Task;
  onSubtaskUpdate: () => void;
}

const SubtaskList: React.FC<SubtaskListProps> = ({ task, onSubtaskUpdate }) => {
  const theme = useTheme();
  const { user } = useAuth();
  const { enqueueSnackbar } = useSnackbar();
  const [subtasks, setSubtasks] = useState<Subtask[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [newSubtaskTitle, setNewSubtaskTitle] = useState('');
  const [editingSubtask, setEditingSubtask] = useState<{id: number, title: string} | null>(null);

  const fetchSubtasks = useCallback(async () => {
    try {
      setLoading(true);
      const response = await api.get(`/api/tasks/${task.id}/subtasks`);
      setSubtasks(response.data);
      setError(null);
    } catch (err) {
      console.error('Alt görevleri getirme hatası:', err);
      enqueueSnackbar('Alt görevler yüklenirken bir hata oluştu', { variant: 'error' });
    } finally {
      setLoading(false);
    }
  }, [task.id, enqueueSnackbar]);

  useEffect(() => {
    fetchSubtasks();
  }, [fetchSubtasks]);

  const handleAddSubtask = async () => {
    if (!newSubtaskTitle.trim()) return;

    try {
      const response = await api.post(`/api/tasks/${task.id}/subtasks`, {
        title: newSubtaskTitle.trim()
      });
      
      console.log('Yeni alt görev yanıtı:', response.data);
      
      setSubtasks(prevSubtasks => [{ ...response.data, title: newSubtaskTitle.trim() }, ...prevSubtasks]);
      setNewSubtaskTitle('');
      setError(null);
      enqueueSnackbar('Alt görev başarıyla eklendi', { variant: 'success' });
      
      await fetchSubtasks();
      onSubtaskUpdate();
    } catch (err) {
      console.error('Alt görev ekleme hatası:', err);
      enqueueSnackbar('Alt görev eklenirken bir hata oluştu', { variant: 'error' });
      await fetchSubtasks();
    }
  };

  const handleUpdateSubtask = async (subtaskId: number, data: { title?: string; completed?: boolean }) => {
    try {
      const response = await api.put(`/api/tasks/${task.id}/subtasks/${subtaskId}`, data);
      
      if (response.data) {
        setSubtasks(prevSubtasks => 
          prevSubtasks.map(st => st.id === subtaskId ? response.data : st)
        );
        
        setEditingSubtask(null);
        enqueueSnackbar('Alt görev başarıyla güncellendi', { variant: 'success' });
        
        await fetchSubtasks();
        onSubtaskUpdate();
      }
    } catch (err) {
      console.error('Alt görev güncelleme hatası:', err);
      enqueueSnackbar('Alt görev güncellenirken bir hata oluştu', { variant: 'error' });
      await fetchSubtasks();
    }
  };

  const handleDeleteSubtask = async (subtaskId: number) => {
    if (!window.confirm('Bu alt görevi silmek istediğinizden emin misiniz?')) {
      return;
    }

    try {
      await api.delete(`/api/tasks/${task.id}/subtasks/${subtaskId}`);
      setSubtasks(subtasks.filter(st => st.id !== subtaskId));
      setError(null);
      enqueueSnackbar('Alt görev başarıyla silindi', { variant: 'success' });
      onSubtaskUpdate();
    } catch (err) {
      console.error('Alt görev silme hatası:', err);
      enqueueSnackbar('Alt görev silinirken bir hata oluştu', { variant: 'error' });
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', my: 2 }}>
        <CircularProgress size={24} />
      </Box>
    );
  }

  return (
    <Paper 
      elevation={0} 
      sx={{ 
        p: 2,
        backgroundColor: theme.palette.background.default,
        borderRadius: 2
      }}
    >
      <Box sx={{ mb: 3, display: 'flex', gap: 1 }}>
        <TextField
          fullWidth
          size="small"
          placeholder="Yeni alt görev ekle..."
          value={newSubtaskTitle}
          onChange={(e) => setNewSubtaskTitle(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && handleAddSubtask()}
          sx={{ 
            '& .MuiOutlinedInput-root': {
              borderRadius: 2,
              backgroundColor: theme.palette.background.paper
            }
          }}
        />
        <Button
          variant="contained"
          onClick={handleAddSubtask}
          disabled={!newSubtaskTitle.trim()}
          startIcon={<AddIcon />}
          sx={{ 
            borderRadius: 2,
            whiteSpace: 'nowrap',
            minWidth: 'auto'
          }}
        >
          Ekle
        </Button>
      </Box>

      <List sx={{ width: '100%' }}>
        {subtasks.map((subtask) => (
          <ListItem
            key={subtask.id}
            sx={{
              borderRadius: 1,
              mb: 1,
              backgroundColor: theme.palette.background.paper,
              '&:hover': {
                backgroundColor: theme.palette.action.hover,
              },
            }}
            secondaryAction={
              <Box sx={{ display: 'flex', gap: 1 }}>
                {editingSubtask?.id === subtask.id ? (
                  <>
                    <IconButton
                      edge="end"
                      onClick={() => handleUpdateSubtask(subtask.id, { title: editingSubtask.title })}
                      size="small"
                    >
                      <SaveIcon fontSize="small" />
                    </IconButton>
                    <IconButton
                      edge="end"
                      onClick={() => setEditingSubtask(null)}
                      size="small"
                    >
                      <CancelIcon fontSize="small" />
                    </IconButton>
                  </>
                ) : (
                  <>
                    <IconButton
                      edge="end"
                      onClick={() => setEditingSubtask({ id: subtask.id, title: subtask.title })}
                      size="small"
                    >
                      <EditIcon fontSize="small" />
                    </IconButton>
                    <IconButton
                      edge="end"
                      onClick={() => handleDeleteSubtask(subtask.id)}
                      size="small"
                    >
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </>
                )}
              </Box>
            }
          >
            <ListItemIcon>
              <Checkbox
                edge="start"
                checked={subtask.completed}
                onChange={(e) => handleUpdateSubtask(subtask.id, { completed: e.target.checked })}
              />
            </ListItemIcon>
            {editingSubtask?.id === subtask.id ? (
              <TextField
                fullWidth
                size="small"
                value={editingSubtask.title}
                onChange={(e) => setEditingSubtask({ ...editingSubtask, title: e.target.value })}
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    handleUpdateSubtask(subtask.id, { title: editingSubtask.title });
                  }
                }}
                autoFocus
              />
            ) : (
              <ListItemText
                primary={subtask.title}
                sx={{
                  textDecoration: subtask.completed ? 'line-through' : 'none',
                  color: subtask.completed ? theme.palette.text.secondary : theme.palette.text.primary,
                }}
              />
            )}
          </ListItem>
        ))}
        {subtasks.length === 0 && (
          <Typography color="text.secondary" align="center" sx={{ py: 2 }}>
            Henüz alt görev bulunmuyor
          </Typography>
        )}
      </List>
    </Paper>
  );
};

export default SubtaskList; 