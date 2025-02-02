import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { socketService, notificationEvents } from '../config/socket';

const prisma = new PrismaClient();

export const createSubtask = async (req: Request, res: Response) => {
  try {
    const { title, taskId } = req.body;
    const currentUserId = req.user?.userId;

    if (!currentUserId) {
      return res.status(401).json({ error: 'Yetkilendirme gerekli' });
    }

    // Ana görevi bul
    const task = await prisma.task.findUnique({
      where: { id: taskId },
      include: {
        user: true,
        project: {
          include: {
            owner: true
          }
        }
      }
    });

    if (!task) {
      return res.status(404).json({ error: 'Görev bulunamadı' });
    }

    const subtask = await prisma.subtask.create({
      data: {
        title,
        task: { connect: { id: taskId } }
      },
      include: {
        task: {
          include: {
            user: true,
            project: {
              include: {
                owner: true
              }
            }
          }
        }
      }
    });

    // Görev sahibine bildirim gönder
    if (task.userId !== currentUserId) {
      socketService.emitToUser(task.userId, notificationEvents.SUBTASK_ADDED, {
        taskId: task.id,
        subtaskId: subtask.id,
        title: task.title,
        subtaskTitle: title,
        addedBy: task.user?.name
      });
    }

    // Proje sahibine bildirim gönder
    if (task.project?.ownerId !== currentUserId && task.project?.ownerId !== task.userId) {
      socketService.emitToUser(task.project.ownerId, notificationEvents.SUBTASK_ADDED, {
        taskId: task.id,
        subtaskId: subtask.id,
        title: task.title,
        subtaskTitle: title,
        addedBy: task.user?.name,
        projectName: task.project.name
      });
    }

    res.status(201).json(subtask);
  } catch (error) {
    console.error('Create subtask error:', error);
    res.status(500).json({ error: 'Alt görev oluşturulamadı' });
  }
};

export const updateSubtask = async (req: Request, res: Response) => {
  try {
    const subtaskId = parseInt(req.params.id);
    const { title, completed } = req.body;
    const currentUserId = req.user?.userId;

    if (!currentUserId) {
      return res.status(401).json({ error: 'Yetkilendirme gerekli' });
    }

    const existingSubtask = await prisma.subtask.findUnique({
      where: { id: subtaskId },
      include: {
        task: {
          include: {
            user: true,
            project: {
              include: {
                owner: true
              }
            }
          }
        }
      }
    });

    if (!existingSubtask) {
      return res.status(404).json({ error: 'Alt görev bulunamadı' });
    }

    const subtask = await prisma.subtask.update({
      where: { id: subtaskId },
      data: { title, completed },
      include: {
        task: {
          include: {
            user: true,
            project: {
              include: {
                owner: true
              }
            }
          }
        }
      }
    });

    const notificationEvent = completed ? notificationEvents.SUBTASK_COMPLETED : notificationEvents.SUBTASK_UPDATED;

    // Görev sahibine bildirim gönder
    if (subtask.task.userId !== currentUserId) {
      socketService.emitToUser(subtask.task.userId, notificationEvent, {
        taskId: subtask.task.id,
        subtaskId: subtask.id,
        title: subtask.task.title,
        subtaskTitle: subtask.title,
        updatedBy: subtask.task.user?.name,
        completed
      });
    }

    // Proje sahibine bildirim gönder
    if (subtask.task.project?.ownerId !== currentUserId && subtask.task.project?.ownerId !== subtask.task.userId) {
      socketService.emitToUser(subtask.task.project.ownerId, notificationEvent, {
        taskId: subtask.task.id,
        subtaskId: subtask.id,
        title: subtask.task.title,
        subtaskTitle: subtask.title,
        updatedBy: subtask.task.user?.name,
        completed,
        projectName: subtask.task.project.name
      });
    }

    res.json(subtask);
  } catch (error) {
    console.error('Update subtask error:', error);
    res.status(500).json({ error: 'Alt görev güncellenemedi' });
  }
};

export const deleteSubtask = async (req: Request, res: Response) => {
  try {
    const { taskId, subtaskId } = req.params;
    const userId = req.user?.userId;

    if (!userId) {
      return res.status(401).json({ error: 'Yetkilendirme gerekli' });
    }

    // Görev ve alt görevin varlığını kontrol et
    const task = await prisma.task.findUnique({
      where: { id: Number(taskId) },
      include: { 
        project: true,
        subtasks: {
          where: { id: Number(subtaskId) }
        }
      }
    });

    if (!task || task.subtasks.length === 0) {
      return res.status(404).json({ error: 'Görev veya alt görev bulunamadı' });
    }

    // Yetki kontrolü
    if (task.userId !== userId && task.project.ownerId !== userId) {
      return res.status(403).json({ error: 'Bu alt görevi silme yetkiniz yok' });
    }

    await prisma.subtask.delete({
      where: { id: Number(subtaskId) }
    });

    res.status(204).send();
  } catch (error) {
    console.error('Delete subtask error:', error);
    res.status(500).json({ error: 'Alt görev silinemedi' });
  }
};

export const getTaskSubtasks = async (req: Request, res: Response) => {
  try {
    const { taskId } = req.params;
    const userId = req.user?.userId;

    if (!userId) {
      return res.status(401).json({ error: 'Yetkilendirme gerekli' });
    }

    // Görevin varlığını ve yetkiyi kontrol et
    const task = await prisma.task.findUnique({
      where: { id: Number(taskId) },
      include: { 
        project: true,
        subtasks: {
          orderBy: { createdAt: 'desc' }
        }
      }
    });

    if (!task) {
      return res.status(404).json({ error: 'Görev bulunamadı' });
    }

    // Yetki kontrolü
    if (task.userId !== userId && task.project.ownerId !== userId) {
      return res.status(403).json({ error: 'Bu görevin alt görevlerini görüntüleme yetkiniz yok' });
    }

    res.json(task.subtasks);
  } catch (error) {
    console.error('Get subtasks error:', error);
    res.status(500).json({ error: 'Alt görevler getirilemedi' });
  }
}; 