import { Router } from 'express';
import { 
  createTask, 
  getTasks,
  getTasksByProject,
  updateTask,
  deleteTask,
  createSubtask,
  updateSubtask,
  deleteSubtask,
  createNote,
  updateNote,
  deleteNote,
  uploadFile,
  downloadFile,
  deleteFile
} from '../controllers/task.controller';
import { authenticateToken } from '../middleware/auth.middleware';
import upload from '../middleware/upload.middleware';

const router = Router();

// Task routes
router.post('/', authenticateToken, createTask);
router.get('/', authenticateToken, getTasks);
router.get('/project/:projectId', authenticateToken, getTasksByProject);
router.put('/:id', authenticateToken, updateTask);
router.delete('/:id', authenticateToken, deleteTask);

// Subtask routes
router.post('/:id/subtasks', authenticateToken, createSubtask);
router.put('/:id/subtasks/:subtaskId', authenticateToken, updateSubtask);
router.delete('/:id/subtasks/:subtaskId', authenticateToken, deleteSubtask);

// Note routes
router.post('/:id/notes', authenticateToken, createNote);
router.put('/:id/notes/:noteId', authenticateToken, updateNote);
router.delete('/:id/notes/:noteId', authenticateToken, deleteNote);

// File routes
router.post('/:id/files', authenticateToken, upload.single('file'), uploadFile);
router.get('/:id/files/:fileId/download', authenticateToken, downloadFile);
router.delete('/:id/files/:fileId', authenticateToken, deleteFile);

export default router; 