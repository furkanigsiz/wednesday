import { Server } from 'socket.io';
import { Server as HttpServer } from 'http';

class SocketService {
  private static instance: SocketService;
  private io: Server | null = null;
  private userSockets: Map<number, string[]> = new Map();

  private constructor() {}

  static getInstance(): SocketService {
    if (!SocketService.instance) {
      SocketService.instance = new SocketService();
    }
    return SocketService.instance;
  }

  initialize(httpServer: HttpServer): Server {
    if (!this.io) {
      console.log('Socket.IO - Başlatılıyor...');
      
      this.io = new Server(httpServer, {
        cors: {
          origin: [process.env.FRONTEND_URL || 'http://localhost:3001', 'https://wednasday.netlify.app'],
          methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
          credentials: true,
          allowedHeaders: ['Content-Type', 'Authorization', 'Accept']
        },
        transports: ['websocket'],
        pingTimeout: 60000,
        pingInterval: 25000,
        path: '/socket.io'
      });

      this.io.use((socket, next) => {
        const userId = socket.handshake.auth.userId;
        const token = socket.handshake.auth.token;
        
        console.log('Socket.IO - Bağlantı doğrulama:', {
          socketId: socket.id,
          userId,
          hasToken: !!token
        });

        if (!userId || !token) {
          return next(new Error('Yetkilendirme gerekli'));
        }

        next();
      });

      this.io.on('connection', (socket) => {
        const userId = socket.handshake.auth.userId;
        console.log('Socket.IO - Yeni bağlantı:', {
          socketId: socket.id,
          userId,
          transport: socket.conn.transport.name
        });

        socket.on('join-user-room', (userId: number) => {
          const userRoom = `user-${userId}`;
          socket.join(userRoom);
          
          // Kullanıcının socket ID'lerini sakla
          if (!this.userSockets.has(userId)) {
            this.userSockets.set(userId, []);
          }
          this.userSockets.get(userId)?.push(socket.id);
          
          console.log(`Socket.IO - Kullanıcı ${userId} odaya katıldı:`, {
            socketId: socket.id,
            room: userRoom,
            activeSockets: this.userSockets.get(userId),
            totalRooms: socket.rooms.size
          });
        });

        socket.on('disconnect', (reason) => {
          console.log('Socket.IO - Bağlantı kesildi:', {
            socketId: socket.id,
            userId,
            reason
          });
          // Kullanıcının socket ID'sini temizle
          this.userSockets.forEach((sockets, userId) => {
            const index = sockets.indexOf(socket.id);
            if (index !== -1) {
              sockets.splice(index, 1);
              console.log(`Socket.IO - Kullanıcı ${userId} socket silindi:`, {
                removedSocket: socket.id,
                remainingSockets: sockets,
                reason
              });
            }
          });
        });
      });

      console.log('Socket.IO - Başarıyla başlatıldı');
    } else {
      console.log('Socket.IO - Zaten başlatılmış durumda');
    }
    return this.io;
  }

  getIO(): Server {
    if (!this.io) {
      console.error('Socket.IO başlatılmamış!');
      throw new Error('Socket.IO henüz başlatılmamış!');
    }
    return this.io;
  }

  testConnection(userId: number): boolean {
    if (!this.io) {
      console.error('Socket.IO başlatılmamış!');
      return false;
    }

    const userRoom = `user-${userId}`;
    const activeSockets = this.userSockets.get(userId) || [];
    const recipients = this.io.sockets.adapter.rooms.get(userRoom);

    console.log('Socket.IO - Bağlantı testi:', {
      userId,
      room: userRoom,
      activeSockets,
      recipients: recipients ? Array.from(recipients) : [],
      activeConnections: activeSockets.length,
      isConnected: activeSockets.length > 0
    });

    return activeSockets.length > 0;
  }

  emitToUser(userId: number, event: string, data: any): void {
    try {
      if (!this.io) {
        console.error('Socket.IO başlatılmamış - Bildirim gönderilemedi');
        return;
      }

      const userRoom = `user-${userId}`;
      const activeSockets = this.userSockets.get(userId) || [];
      
      console.log(`Socket.IO - Bildirim gönderiliyor:`, {
        userId,
        event,
        room: userRoom,
        activeSockets,
        data
      });

      if (activeSockets.length === 0) {
        console.warn(`Socket.IO - Kullanıcı ${userId} için aktif socket bağlantısı yok!`);
        return;
      }

      this.io.to(userRoom).emit(event, data);
      
      console.log(`Socket.IO - Bildirim gönderildi:`, {
        room: userRoom,
        recipients: this.io.sockets.adapter.rooms.get(userRoom)?.size || 0,
        activeConnections: activeSockets.length
      });
    } catch (error) {
      console.error('Socket.IO - Bildirim gönderme hatası:', error);
    }
  }
}

export const socketService = SocketService.getInstance();

export const notificationEvents = {
  TASK_ASSIGNED: 'task-assigned',
  TASK_UPDATED: 'task-updated',
  TASK_COMMENTED: 'task-commented',
  TASK_COMPLETED: 'task-completed',
  TASK_OVERDUE: 'task-overdue',
  SUBTASK_ADDED: 'subtask-added',
  SUBTASK_UPDATED: 'subtask-updated',
  SUBTASK_COMPLETED: 'subtask-completed',
  NOTE_ADDED: 'note-added',
  NOTE_UPDATED: 'note-updated'
} as const; 