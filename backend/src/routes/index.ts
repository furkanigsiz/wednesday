import { Router } from 'express';
import authRoutes from './auth.routes';
import projectRoutes from './project.routes';
import taskRoutes from './task.routes';
import dashboardRoutes from './dashboard.routes';
import noteRoutes from './note.routes';
import subtaskRoutes from './subtask.routes';
import userRoutes from './user.routes';
import crmRoutes from './crm.routes';

const router = Router();

// Ana rotalar
router.use('/auth', authRoutes);
router.use('/projects', projectRoutes);
router.use('/tasks', taskRoutes);
router.use('/dashboard', dashboardRoutes);
router.use('/notes', noteRoutes);
router.use('/subtasks', subtaskRoutes);
router.use('/users', userRoutes);
router.use('/crm', crmRoutes);

export default router; 