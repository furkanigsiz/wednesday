import React, { createContext, useContext, useEffect, useState } from 'react';
import socketIOClient from 'socket.io-client';
import { useSnackbar } from 'notistack';
import { useAuth } from './AuthContext';

interface NotificationData {
  taskId: number;
  title: string;
  assignedBy?: string;
  updatedBy?: string;
  completedBy?: string;
  projectName?: string;
  status?: string;
  priority?: string;
  oldStatus?: string;
  addedBy?: string;
  subtaskTitle?: string;
  content?: string;
}

interface Notification {
  id: string;
  type: string;
  message: string;
  data: NotificationData;
  read: boolean;
  createdAt: Date;
}

interface NotificationContextType {
  notifications: Notification[];
  markAsRead: (id: string) => void;
  clearAll: () => void;
  unreadCount: number;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [socket, setSocket] = useState<any>(null);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [notificationPermission, setNotificationPermission] = useState<NotificationPermission>('default');
  const { user } = useAuth();
  const { enqueueSnackbar } = useSnackbar();

  // Bildirim izni kontrolü
  useEffect(() => {
    const checkNotificationPermission = async () => {
      if ('Notification' in window) {
        const permission = await Notification.requestPermission();
        setNotificationPermission(permission);
        
        if (permission === 'granted') {
          enqueueSnackbar('Bildirimler aktif edildi', { 
            variant: 'success',
            autoHideDuration: 3000
          });
        } else if (permission === 'denied') {
          enqueueSnackbar('Bildirim izni reddedildi. Bildirimleri görebilmek için izin vermeniz gerekiyor.', { 
            variant: 'warning',
            autoHideDuration: 5000
          });
        }
      }
    };

    checkNotificationPermission();
  }, [enqueueSnackbar]);

  // Socket bağlantısı
  useEffect(() => {
    if (user) {
      console.log('Socket.IO - Bağlantı başlatılıyor:', {
        userId: user.id,
        apiUrl: process.env.REACT_APP_API_URL || 'http://localhost:3000'
      });

      // Socket.io bağlantısını kur
      const newSocket = socketIOClient(process.env.REACT_APP_API_URL || 'http://localhost:3000', {
        transports: ['websocket'],
        reconnection: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 5000,
        timeout: 10000,
        auth: {
          token: localStorage.getItem('token'),
          userId: user.id
        }
      });

      // Bağlantı olaylarını dinle
      newSocket.on('connect', () => {
        console.log('Socket.IO - Bağlantı kuruldu:', {
          socketId: newSocket.id,
          userId: user.id,
          readyState: newSocket.connected ? 'CONNECTED' : 'DISCONNECTED'
        });
        
        // Kullanıcı odasına katıl
        newSocket.emit('join-user-room', user.id);
        
        // Bağlantı başarılı bildirimi
        enqueueSnackbar('Bildirim sistemi bağlandı', { 
          variant: 'success',
          autoHideDuration: 2000
        });
      });

      newSocket.on('connect_error', (error: any) => {
        console.error('Socket.IO - Bağlantı hatası:', {
          error,
          userId: user.id,
          message: error.message,
          description: error.description
        });
        enqueueSnackbar('Bildirim sistemi bağlantısında sorun oluştu. Yeniden bağlanılıyor...', {
          variant: 'warning',
          autoHideDuration: 3000
        });
      });

      newSocket.on('disconnect', (reason: string) => {
        console.log('Socket.IO - Bağlantı kesildi:', {
          reason,
          userId: user.id,
          socketId: newSocket.id
        });
        if (reason === 'io server disconnect') {
          newSocket.connect();
        }
      });

      newSocket.on('reconnect', (attemptNumber: number) => {
        console.log('Socket.io yeniden bağlandı, deneme:', attemptNumber);
        newSocket.emit('join-user-room', user.id);
      });

      // Bildirim olaylarını dinle
      newSocket.on('task-assigned', (data: NotificationData) => {
        console.log('Socket.IO - Görev atama bildirimi alındı:', {
          userId: user.id,
          data
        });

        if (data.taskId) {
          // Web bildirimi gönder
          if (notificationPermission === 'granted') {
            new Notification('Yeni Görev Atandı', {
              body: `${data.assignedBy} size "${data.title}" görevini atadı`,
              icon: '/logo192.png'
            });
          }

          const notification = {
            id: Date.now().toString(),
            type: 'task-assigned',
            message: `${data.assignedBy} size "${data.title}" görevini atadı`,
            data,
            read: false,
            createdAt: new Date()
          };
          addNotification(notification);
          enqueueSnackbar(notification.message, { 
            variant: 'info',
            autoHideDuration: 5000
          });
          window.dispatchEvent(new CustomEvent('taskUpdate', { detail: data }));
        }
      });

      newSocket.on('task-updated', (data: NotificationData) => {
        console.log('Socket.IO - Görev güncelleme bildirimi alındı:', {
          userId: user.id,
          data
        });

        if (data.taskId) {
          // Web bildirimi gönder
          if (notificationPermission === 'granted') {
            new Notification('Görev Güncellendi', {
              body: data.oldStatus 
                ? `${data.updatedBy} "${data.title}" görevinin durumunu ${data.oldStatus} -> ${data.status} olarak güncelledi`
                : `${data.updatedBy} "${data.title}" görevini güncelledi`,
              icon: '/logo192.png'
            });
          }

          const notification = {
            id: Date.now().toString(),
            type: 'task-updated',
            message: data.oldStatus 
              ? `${data.updatedBy} "${data.title}" görevinin durumunu ${data.oldStatus} -> ${data.status} olarak güncelledi`
              : `${data.updatedBy} "${data.title}" görevini güncelledi`,
            data,
            read: false,
            createdAt: new Date()
          };
          addNotification(notification);
          enqueueSnackbar(notification.message, { 
            variant: 'info',
            autoHideDuration: 5000
          });
          window.dispatchEvent(new CustomEvent('taskUpdate', { detail: data }));
        }
      });

      newSocket.on('task-completed', (data: NotificationData) => {
        console.log('Socket.IO - Görev tamamlama bildirimi alındı:', {
          userId: user.id,
          data
        });

        if (data.taskId) {
          const notification = {
            id: Date.now().toString(),
            type: 'task-completed',
            message: `${data.completedBy} "${data.title}" görevini tamamladı`,
            data,
            read: false,
            createdAt: new Date()
          };
          addNotification(notification);
          enqueueSnackbar(notification.message, { 
            variant: 'success',
            autoHideDuration: 5000
          });
          // Sayfayı yenilemek yerine state'i güncelle
          window.dispatchEvent(new CustomEvent('taskUpdate', { detail: data }));
        }
      });

      // Alt görev bildirimleri
      newSocket.on('subtask-added', (data: NotificationData) => {
        console.log('Socket.IO - Alt görev ekleme bildirimi alındı:', {
          userId: user.id,
          data
        });

        if (data.taskId) {
          if (notificationPermission === 'granted') {
            new Notification('Yeni Alt Görev Eklendi', {
              body: `${data.addedBy} "${data.title}" görevine "${data.subtaskTitle}" alt görevini ekledi`,
              icon: '/logo192.png'
            });
          }

          const notification = {
            id: Date.now().toString(),
            type: 'subtask-added',
            message: `${data.addedBy} "${data.title}" görevine "${data.subtaskTitle}" alt görevini ekledi`,
            data,
            read: false,
            createdAt: new Date()
          };
          addNotification(notification);
          enqueueSnackbar(notification.message, { 
            variant: 'info',
            autoHideDuration: 5000
          });
          window.dispatchEvent(new CustomEvent('taskUpdate', { detail: data }));
        }
      });

      newSocket.on('subtask-updated', (data: NotificationData) => {
        console.log('Socket.IO - Alt görev güncelleme bildirimi alındı:', {
          userId: user.id,
          data
        });

        if (data.taskId) {
          if (notificationPermission === 'granted') {
            new Notification('Alt Görev Güncellendi', {
              body: `${data.updatedBy} "${data.title}" görevindeki "${data.subtaskTitle}" alt görevini güncelledi`,
              icon: '/logo192.png'
            });
          }

          const notification = {
            id: Date.now().toString(),
            type: 'subtask-updated',
            message: `${data.updatedBy} "${data.title}" görevindeki "${data.subtaskTitle}" alt görevini güncelledi`,
            data,
            read: false,
            createdAt: new Date()
          };
          addNotification(notification);
          enqueueSnackbar(notification.message, { 
            variant: 'info',
            autoHideDuration: 5000
          });
          window.dispatchEvent(new CustomEvent('taskUpdate', { detail: data }));
        }
      });

      newSocket.on('subtask-completed', (data: NotificationData) => {
        console.log('Socket.IO - Alt görev tamamlama bildirimi alındı:', {
          userId: user.id,
          data
        });

        if (data.taskId) {
          if (notificationPermission === 'granted') {
            new Notification('Alt Görev Tamamlandı', {
              body: `${data.updatedBy} "${data.title}" görevindeki "${data.subtaskTitle}" alt görevini tamamladı`,
              icon: '/logo192.png'
            });
          }

          const notification = {
            id: Date.now().toString(),
            type: 'subtask-completed',
            message: `${data.updatedBy} "${data.title}" görevindeki "${data.subtaskTitle}" alt görevini tamamladı`,
            data,
            read: false,
            createdAt: new Date()
          };
          addNotification(notification);
          enqueueSnackbar(notification.message, { 
            variant: 'success',
            autoHideDuration: 5000
          });
          window.dispatchEvent(new CustomEvent('taskUpdate', { detail: data }));
        }
      });

      // Not bildirimleri
      newSocket.on('note-added', (data: NotificationData) => {
        console.log('Socket.IO - Not ekleme bildirimi alındı:', {
          userId: user.id,
          data
        });

        if (data.taskId) {
          if (notificationPermission === 'granted') {
            new Notification('Yeni Not Eklendi', {
              body: `${data.addedBy} "${data.title}" görevine yeni bir not ekledi: ${data.content}`,
              icon: '/logo192.png'
            });
          }

          const notification = {
            id: Date.now().toString(),
            type: 'note-added',
            message: `${data.addedBy} "${data.title}" görevine yeni bir not ekledi: ${data.content}`,
            data,
            read: false,
            createdAt: new Date()
          };
          addNotification(notification);
          enqueueSnackbar(notification.message, { 
            variant: 'info',
            autoHideDuration: 5000
          });
          window.dispatchEvent(new CustomEvent('taskUpdate', { detail: data }));
        }
      });

      newSocket.on('note-updated', (data: NotificationData) => {
        console.log('Socket.IO - Not güncelleme bildirimi alındı:', {
          userId: user.id,
          data
        });

        if (data.taskId) {
          if (notificationPermission === 'granted') {
            new Notification('Not Güncellendi', {
              body: `${data.updatedBy} "${data.title}" görevindeki bir notu güncelledi: ${data.content}`,
              icon: '/logo192.png'
            });
          }

          const notification = {
            id: Date.now().toString(),
            type: 'note-updated',
            message: `${data.updatedBy} "${data.title}" görevindeki bir notu güncelledi: ${data.content}`,
            data,
            read: false,
            createdAt: new Date()
          };
          addNotification(notification);
          enqueueSnackbar(notification.message, { 
            variant: 'info',
            autoHideDuration: 5000
          });
          window.dispatchEvent(new CustomEvent('taskUpdate', { detail: data }));
        }
      });

      setSocket(newSocket);

      // Cleanup
      return () => {
        console.log('Socket.IO - Bağlantı kapatılıyor:', {
          socketId: newSocket.id,
          userId: user.id
        });
        newSocket.disconnect();
      };
    }
  }, [user, enqueueSnackbar, notificationPermission]);

  const addNotification = (notification: Notification) => {
    setNotifications(prev => [notification, ...prev]);
  };

  const markAsRead = (id: string) => {
    setNotifications(prev =>
      prev.map(notif =>
        notif.id === id ? { ...notif, read: true } : notif
      )
    );
  };

  const clearAll = () => {
    setNotifications([]);
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        markAsRead,
        clearAll,
        unreadCount
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
}; 