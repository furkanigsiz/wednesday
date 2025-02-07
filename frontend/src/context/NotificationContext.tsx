import React, { createContext, useContext, useEffect, useState } from 'react';
import socketIOClient from 'socket.io-client';
import { useSnackbar } from 'notistack';
import { useAuth } from './AuthContext';
import type { Notification } from '../types';
import { useNavigate } from 'react-router-dom';

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

interface NotificationContextType {
  notifications: Notification[];
  unreadCount: number;
  markAsRead: (id: number) => void;
  markAllAsRead: () => void;
  addNotification: (notification: Notification) => void;
}

const NotificationContext = createContext<NotificationContextType>({
  notifications: [],
  unreadCount: 0,
  markAsRead: () => {},
  markAllAsRead: () => {},
  addNotification: () => {},
});

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [notificationPermission, setNotificationPermission] = useState<NotificationPermission>('default');
  const { user } = useAuth();
  const { enqueueSnackbar } = useSnackbar();
  const navigate = useNavigate();

  // Windows bildirim izni kontrolü
  useEffect(() => {
    if ('Notification' in window) {
      Notification.requestPermission().then(permission => {
        setNotificationPermission(permission);
      });
    }
  }, []);

  // Windows bildirimi gönderme fonksiyonu
  const showWindowsNotification = (title: string, message: string, taskId?: number) => {
    if (notificationPermission === 'granted') {
      const notification = new Notification(title, {
        body: message,
        icon: '/logo192.png', // Projenizde uygun bir logo ekleyin
      });

      if (taskId) {
        notification.onclick = () => {
          window.focus();
          navigate(`/tasks/${taskId}/details`);
        };
      }
    }
  };

  // Socket.io bağlantısı
  useEffect(() => {
    if (user) {
      const socket = socketIOClient(process.env.REACT_APP_API_URL || 'http://localhost:3000', {
        transports: ['websocket'],
        auth: {
          token: localStorage.getItem('token'),
          userId: user.id
        }
      });

      // Odaya katıl
      socket.emit('join-user-room', user.id);

      // Bildirim olaylarını dinle
      socket.on('task-assigned', (data: NotificationData) => {
        const notification: Notification = {
          id: Date.now(),
          type: 'TASK_ASSIGNED',
          title: 'Yeni Görev Atandı',
          message: `${data.assignedBy} size "${data.title}" görevini atadı`,
          read: false,
          createdAt: new Date().toISOString(),
          data: { taskId: data.taskId }
        };
        addNotification(notification);
        showWindowsNotification(notification.title, notification.message, data.taskId);
      });

      socket.on('task-updated', (data: NotificationData) => {
        const notification: Notification = {
          id: Date.now(),
          type: 'TASK_UPDATED',
          title: 'Görev Güncellendi',
          message: `${data.updatedBy} "${data.title}" görevini güncelledi`,
          read: false,
          createdAt: new Date().toISOString(),
          data: { taskId: data.taskId }
        };
        addNotification(notification);
        showWindowsNotification(notification.title, notification.message, data.taskId);
      });

      socket.on('task-completed', (data: NotificationData) => {
        const notification: Notification = {
          id: Date.now(),
          type: 'TASK_COMPLETED',
          title: 'Görev Tamamlandı',
          message: `${data.completedBy} "${data.title}" görevini tamamladı`,
          read: false,
          createdAt: new Date().toISOString(),
          data: { taskId: data.taskId }
        };
        addNotification(notification);
        showWindowsNotification(notification.title, notification.message, data.taskId);
      });

      return () => {
        socket.disconnect();
      };
    }
  }, [user, navigate]);

  const addNotification = (notification: Notification) => {
    setNotifications(prev => [notification, ...prev]);
  };

  const markAsRead = (id: number) => {
    setNotifications(prev =>
      prev.map(notif =>
        notif.id === id ? { ...notif, read: true } : notif
      )
    );
  };

  const markAllAsRead = () => {
    setNotifications(prev =>
      prev.map(notif => ({ ...notif, read: true }))
    );
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        markAsRead,
        markAllAsRead,
        addNotification,
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