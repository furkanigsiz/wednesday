import app from './app';
import { createServer } from 'http';
import { socketService } from './config/socket';

const httpServer = createServer(app);
const PORT = process.env.PORT || 3000;

// Socket.IO başlatma
const io = socketService.initialize(httpServer);

// Uncaught exception handler
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
});

// Unhandled rejection handler
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

httpServer.listen(PORT, () => {
  console.log(`Server ${PORT} portunda çalışıyor - ${new Date().toISOString()}`);
  console.log('Environment:', process.env.NODE_ENV);
  console.log('Socket.IO başlatıldı ve hazır');
}); 