import express, { Application, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes from './routes/auth.routes';
import projectRoutes from './routes/project.routes';
import taskRoutes from './routes/task.routes';
import dashboardRoutes from './routes/dashboard.routes';
import userRoutes from './routes/user.routes';
import subtaskRoutes from './routes/subtask.routes';
import noteRoutes from './routes/note.routes';
import crmRoutes from './routes/crm.routes';

dotenv.config();

const app: Application = express();

// CORS yapılandırması
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3001',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept'],
  exposedHeaders: ['Authorization'],
  preflightContinue: true,
  optionsSuccessStatus: 204
}));

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logging middleware
app.use((req: Request, res: Response, next: NextFunction) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`, {
    body: req.body,
    query: req.query,
    headers: req.headers
  });
  next();
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/users', userRoutes);
app.use('/api', subtaskRoutes);
app.use('/api', noteRoutes);
app.use('/api/crm', crmRoutes);

// Health check endpoint
app.get('/health', (req: Request, res: Response) => {
  res.status(200).json({ status: 'OK', message: 'Server is running' });
});

// API root endpoint
app.get('/api', (req: Request, res: Response) => {
  res.status(200).json({ 
    message: 'API is running',
    version: '1.0.0',
    endpoints: [
      '/api/auth',
      '/api/projects',
      '/api/tasks',
      '/api/dashboard'
    ]
  });
});

// 404 handler
app.use((req: Request, res: Response) => {
  console.log('404 Error:', {
    path: req.path,
    method: req.method,
    body: req.body,
    headers: req.headers
  });
  
  res.status(404).json({ 
    error: 'Route bulunamadı',
    path: req.path,
    method: req.method,
    availableEndpoints: [
      '/api/auth',
      '/api/projects',
      '/api/tasks',
      '/api/dashboard'
    ]
  });
});

// Error handling middleware
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error('Hata detayı:', {
    message: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method,
    body: req.body,
    headers: req.headers
  });
  
  res.status(500).json({ 
    error: 'Sunucu hatası',
    message: err.message,
    path: req.path
  });
});

export default app; 