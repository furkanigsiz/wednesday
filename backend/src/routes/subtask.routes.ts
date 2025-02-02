import { Router } from 'express';
import { authMiddleware } from '../middlewares/auth.middleware';
import {
  createSubtask,
  updateSubtask,
  deleteSubtask,
  getTaskSubtasks
} from '../controllers/subtask.controller';

const router = Router();

// Request logging middleware
router.use((req, res, next) => {
  console.log('Subtask Route:', {
    method: req.method,
    path: req.path,
    body: req.body,
    userId: req.user?.userId
  });
  next();
});

// Tüm subtask rotaları için authentication gerekli
router.use(authMiddleware);

// Alt görev rotaları
router.post('/tasks/:taskId/subtasks', createSubtask);
router.get('/tasks/:taskId/subtasks', getTaskSubtasks);
router.put('/tasks/:taskId/subtasks/:subtaskId', updateSubtask);
router.delete('/tasks/:taskId/subtasks/:subtaskId', deleteSubtask);

export default router; 