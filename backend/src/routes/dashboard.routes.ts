import { Router } from 'express';
import { authMiddleware } from '../middlewares/auth.middleware';
import {
  getDashboardSummary,
  getUserTasksSummary,
  getProjectProgress,
  getDashboardStats,
  getTaskDistribution,
  getOverdueTasks
} from '../controllers/dashboard.controller';

const router = Router();

// Request logging middleware
router.use((req, res, next) => {
  console.log('Dashboard Route:', {
    method: req.method,
    path: req.path,
    body: req.body,
    userId: req.user?.userId
  });
  next();
});

// Tüm dashboard rotaları için authentication gerekli
router.use(authMiddleware);

// Dashboard rotaları
router.get('/summary', getDashboardSummary);
router.get('/users/tasks', getUserTasksSummary);
router.get('/projects/:id/progress', getProjectProgress);
router.get('/stats', getDashboardStats);
router.get('/task-distribution', getTaskDistribution);
router.get('/overdue-tasks', getOverdueTasks);

export default router; 