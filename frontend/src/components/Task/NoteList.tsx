import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  List,
  ListItem,
  IconButton,
  TextField,
  Typography,
  CircularProgress,
  Paper,
  Button,
  useTheme,
  Avatar,
  Tooltip,
  Divider,
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  Save as SaveIcon,
  Cancel as CancelIcon,
} from '@mui/icons-material';
import { noteService } from '../../services/api';
import { Note, Task } from '../../types';
import { formatDistance } from 'date-fns';
import { tr } from 'date-fns/locale';
import { useAuth } from '../../context/AuthContext';

interface NoteListProps {
  task: Task;
  onNoteUpdate: () => void;
}

function NoteList({ task, onNoteUpdate }: NoteListProps) {
  const theme = useTheme();
  const { user } = useAuth();
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [newNoteContent, setNewNoteContent] = useState('');
  const [editingNote, setEditingNote] = useState<Note | null>(null);

  const fetchNotes = useCallback(async () => {
    try {
      setLoading(true);
      const data = await noteService.getAll(task.id);
      setNotes(data);
    } catch (err) {
      console.error('Notları getirme hatası:', err);
      setError('Notlar yüklenirken bir hata oluştu');
    } finally {
      setLoading(false);
    }
  }, [task.id]);

  useEffect(() => {
    fetchNotes();
  }, [fetchNotes]);

  const handleAddNote = async () => {
    if (!newNoteContent.trim()) return;

    try {
      const newNote = await noteService.create(task.id, newNoteContent);
      setNotes([newNote, ...notes]);
      setNewNoteContent('');
      onNoteUpdate();
    } catch (err) {
      console.error('Not ekleme hatası:', err);
      setError('Not eklenirken bir hata oluştu');
    }
  };

  const handleUpdateNote = async (noteId: number, content: string) => {
    try {
      const updatedNote = await noteService.update(task.id, noteId, content);
      setNotes(notes.map(note => note.id === noteId ? updatedNote : note));
      setEditingNote(null);
      onNoteUpdate();
    } catch (err) {
      console.error('Not güncelleme hatası:', err);
      setError('Not güncellenirken bir hata oluştu');
    }
  };

  const handleDeleteNote = async (noteId: number) => {
    try {
      await noteService.delete(task.id, noteId);
      setNotes(notes.filter(note => note.id !== noteId));
      onNoteUpdate();
    } catch (err) {
      console.error('Not silme hatası:', err);
      setError('Not silinirken bir hata oluştu');
    }
  };

  const canEditNote = (note: Note) => {
    return user?.id === note.userId || user?.id === task.project?.ownerId;
  };

  // Tarih formatlaması için helper fonksiyon
  const formatDate = (date: Date) => {
    return formatDistance(new Date(date), new Date(), {
      addSuffix: true,
      locale: tr
    });
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
      <Typography variant="h6" sx={{ mb: 2, color: theme.palette.text.primary }}>
        Notlar ({notes.length})
      </Typography>

      <Box sx={{ mb: 3 }}>
        <TextField
          fullWidth
          multiline
          rows={3}
          placeholder="Yeni not ekle..."
          value={newNoteContent}
          onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setNewNoteContent(e.target.value)}
          sx={{ 
            mb: 1,
            '& .MuiOutlinedInput-root': {
              borderRadius: 2,
              backgroundColor: theme.palette.background.paper
            }
          }}
        />
        <Button
          variant="contained"
          onClick={handleAddNote}
          disabled={!newNoteContent.trim()}
          startIcon={<AddIcon />}
          sx={{ 
            borderRadius: 2,
            float: 'right',
            mb: 3
          }}
        >
          Not Ekle
        </Button>
      </Box>

      <Box sx={{ clear: 'both', pt: 2 }}>
        {error && (
          <Typography color="error" sx={{ mb: 2 }}>
            {error}
          </Typography>
        )}

        <List sx={{ width: '100%' }}>
          {notes.map((note) => (
            <ListItem
              key={note.id}
              sx={{
                display: 'block',
                borderRadius: 1,
                mb: 2,
                backgroundColor: theme.palette.background.paper,
                p: 2,
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <Avatar 
                  sx={{ 
                    width: 32, 
                    height: 32,
                    bgcolor: theme.palette.primary.main,
                    fontSize: '0.875rem'
                  }}
                >
                  {note.user.name.charAt(0)}
                </Avatar>
                <Box sx={{ ml: 1, flexGrow: 1 }}>
                  <Typography variant="subtitle2">
                    {note.user.name}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {formatDate(new Date(note.createdAt))}
                  </Typography>
                </Box>
                <Box>
                  {editingNote?.id === note.id ? (
                    <>
                      <IconButton
                        size="small"
                        onClick={() => handleUpdateNote(note.id, editingNote.content)}
                      >
                        <SaveIcon fontSize="small" />
                      </IconButton>
                      <IconButton
                        size="small"
                        onClick={() => setEditingNote(null)}
                      >
                        <CancelIcon fontSize="small" />
                      </IconButton>
                    </>
                  ) : (
                    canEditNote(note) && (
                      <>
                        <IconButton
                          size="small"
                          onClick={() => setEditingNote(note)}
                        >
                          <EditIcon fontSize="small" />
                        </IconButton>
                        <IconButton
                          size="small"
                          onClick={() => handleDeleteNote(note.id)}
                        >
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </>
                    )
                  )}
                </Box>
              </Box>
              <Divider sx={{ my: 1 }} />
              {editingNote?.id === note.id ? (
                <TextField
                  fullWidth
                  multiline
                  rows={3}
                  value={editingNote.content}
                  onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setEditingNote({ ...editingNote, content: e.target.value })}
                  sx={{ mt: 1 }}
                />
              ) : (
                <Typography 
                  variant="body2" 
                  sx={{ 
                    whiteSpace: 'pre-wrap',
                    wordBreak: 'break-word'
                  }}
                >
                  {note.content}
                </Typography>
              )}
            </ListItem>
          ))}
        </List>
      </Box>
    </Paper>
  );
}

export default NoteList; 