import { Router } from 'express';
import { authMiddleware } from '../middlewares/auth.middleware';
import {
  createNote,
  updateNote,
  deleteNote,
  getTaskNotes
} from '../controllers/note.controller';

const router = Router();

// Request logging middleware
router.use((req, res, next) => {
  console.log('Note Route:', {
    method: req.method,
    path: req.path,
    body: req.body,
    userId: req.user?.userId
  });
  next();
});

// Tüm not rotaları için authentication gerekli
router.use(authMiddleware);

// Not rotaları
router.post('/tasks/:taskId/notes', createNote);
router.get('/tasks/:taskId/notes', getTaskNotes);
router.put('/tasks/:taskId/notes/:noteId', updateNote);
router.delete('/tasks/:taskId/notes/:noteId', deleteNote);

export default router; 