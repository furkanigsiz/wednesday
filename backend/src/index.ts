import express from 'express';
import cors from 'cors';
import { createServer } from 'http';
import { socketService } from './config/socket';
import { authMiddleware } from './middlewares/auth.middleware';
import authRoutes from './routes/auth.routes';
import projectRoutes from './routes/project.routes';
import taskRoutes from './routes/task.routes';
import dashboardRoutes from './routes/dashboard.routes';
import noteRoutes from './routes/note.routes';
import subtaskRoutes from './routes/subtask.routes';
import userRoutes from './routes/user.routes';

const app = express();
const httpServer = createServer(app);

// CORS ayarları
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3001',
  credentials: true
}));

app.use(express.json());

// Public rotalar
app.use('/api/auth', authRoutes);

// Protected rotalar
app.use('/api/projects', authMiddleware, projectRoutes);
app.use('/api/tasks', authMiddleware, taskRoutes);
app.use('/api/dashboard', authMiddleware, dashboardRoutes);
app.use('/api/notes', authMiddleware, noteRoutes);
app.use('/api/subtasks', authMiddleware, subtaskRoutes);
app.use('/api/users', authMiddleware, userRoutes);

const PORT = process.env.PORT || 3000;

// Socket.IO başlatma - En son başlat
const io = socketService.initialize(httpServer);

httpServer.listen(PORT, () => {
  console.log(`Server ${PORT} portunda çalışıyor`);
  console.log('Socket.IO başlatıldı ve hazır');
}); 