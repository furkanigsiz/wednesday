import { Router } from 'express';
import { authMiddleware } from '../middlewares/auth.middleware';
import {
  createProject,
  getProjects,
  getProjectById,
  updateProject,
  deleteProject,
  getProjectTasks
} from '../controllers/project.controller';

const router = Router();

// Request logging middleware
router.use((req, res, next) => {
  console.log('Project Route:', {
    method: req.method,
    path: req.path,
    body: req.body,
    userId: req.user?.userId
  });
  next();
});

// Tüm proje rotaları için authentication gerekli
router.use(authMiddleware);

// Proje rotaları
router.post('/', createProject);
router.get('/', getProjects);
router.get('/:id', getProjectById);
router.put('/:id', updateProject);
router.delete('/:id', deleteProject);
router.get('/:projectId/tasks', getProjectTasks);

export default router; 