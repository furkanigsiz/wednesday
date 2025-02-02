import app from './app';
import { createServer } from 'http';
import { socketService } from './config/socket';

const httpServer = createServer(app);
const PORT = process.env.PORT || 3000;

// Socket.IO başlatma
const io = socketService.initialize(httpServer);

httpServer.listen(PORT, () => {
  console.log(`Server ${PORT} portunda çalışıyor`);
  console.log('Socket.IO başlatıldı ve hazır');
}); 