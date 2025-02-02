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
import { subtaskService } from '../../services/api';
import { Subtask, Task } from '../../types';
import { useAuth } from '../../context/AuthContext';

interface SubtaskListProps {
  task: Task;
  onSubtaskUpdate: () => void;
}

const SubtaskList: React.FC<SubtaskListProps> = ({ task, onSubtaskUpdate }) => {
  const theme = useTheme();
  const { user } = useAuth();
  const [subtasks, setSubtasks] = useState<Subtask[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [newSubtaskTitle, setNewSubtaskTitle] = useState('');
  const [editingSubtask, setEditingSubtask] = useState<{id: number, title: string} | null>(null);

  useEffect(() => {
    const loadSubtasks = async () => {
      await fetchSubtasks();
    };
    loadSubtasks();
  }, [task.id]);

  const fetchSubtasks = useCallback(async () => {
    try {
      setLoading(true);
      const data = await subtaskService.getAll(task.id);
      setSubtasks(data);
    } catch (err) {
      console.error('Alt görevleri getirme hatası:', err);
      setError('Alt görevler yüklenirken bir hata oluştu');
    } finally {
      setLoading(false);
    }
  }, [task.id]);

  const handleAddSubtask = async () => {
    if (!newSubtaskTitle.trim()) return;

    try {
      const newSubtask = await subtaskService.create(task.id, newSubtaskTitle);
      setSubtasks([newSubtask, ...subtasks]);
      setNewSubtaskTitle('');
      onSubtaskUpdate();
    } catch (err) {
      console.error('Alt görev ekleme hatası:', err);
      setError('Alt görev eklenirken bir hata oluştu');
    }
  };

  const handleUpdateSubtask = async (subtaskId: number, data: { title?: string; completed?: boolean }) => {
    try {
      const updatedSubtask = await subtaskService.update(task.id, subtaskId, data);
      setSubtasks(subtasks.map(st => st.id === subtaskId ? updatedSubtask : st));
      setEditingSubtask(null);
      onSubtaskUpdate();
    } catch (err) {
      console.error('Alt görev güncelleme hatası:', err);
      setError('Alt görev güncellenirken bir hata oluştu');
    }
  };

  const handleDeleteSubtask = async (subtaskId: number) => {
    try {
      await subtaskService.delete(task.id, subtaskId);
      setSubtasks(subtasks.filter(st => st.id !== subtaskId));
      onSubtaskUpdate();
    } catch (err) {
      console.error('Alt görev silme hatası:', err);
      setError('Alt görev silinirken bir hata oluştu');
    }
  };

  const canEditSubtask = () => true;

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
      <Typography variant="h6" sx={{ mb: 2, color: theme.palette.text.primary }}>
        Alt Görevler ({subtasks.length})
      </Typography>

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

      {error && (
        <Typography color="error" sx={{ mb: 2 }}>
          {error}
        </Typography>
      )}

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
      </List>
    </Paper>
  );
};

export default SubtaskList; 