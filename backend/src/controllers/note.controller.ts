import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { socketService, notificationEvents } from '../config/socket';

const prisma = new PrismaClient();

export const createNote = async (req: Request, res: Response) => {
  try {
    const { content, taskId } = req.body;
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

    const note = await prisma.note.create({
      data: {
        content,
        task: { connect: { id: taskId } },
        user: { connect: { id: currentUserId } }
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
        },
        user: true
      }
    });

    // Görev sahibine bildirim gönder
    if (task.userId !== currentUserId) {
      socketService.emitToUser(task.userId, notificationEvents.NOTE_ADDED, {
        taskId: task.id,
        noteId: note.id,
        title: task.title,
        content: content.substring(0, 100) + (content.length > 100 ? '...' : ''),
        addedBy: note.user.name
      });
    }

    // Proje sahibine bildirim gönder
    if (task.project?.ownerId !== currentUserId && task.project?.ownerId !== task.userId) {
      socketService.emitToUser(task.project.ownerId, notificationEvents.NOTE_ADDED, {
        taskId: task.id,
        noteId: note.id,
        title: task.title,
        content: content.substring(0, 100) + (content.length > 100 ? '...' : ''),
        addedBy: note.user.name,
        projectName: task.project.name
      });
    }

    res.status(201).json(note);
  } catch (error) {
    console.error('Create note error:', error);
    res.status(500).json({ error: 'Not oluşturulamadı' });
  }
};

export const updateNote = async (req: Request, res: Response) => {
  try {
    const noteId = parseInt(req.params.id);
    const { content } = req.body;
    const currentUserId = req.user?.userId;

    if (!currentUserId) {
      return res.status(401).json({ error: 'Yetkilendirme gerekli' });
    }

    const existingNote = await prisma.note.findUnique({
      where: { id: noteId },
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
        },
        user: true
      }
    });

    if (!existingNote) {
      return res.status(404).json({ error: 'Not bulunamadı' });
    }

    // Sadece not sahibi güncelleyebilir
    if (existingNote.userId !== currentUserId) {
      return res.status(403).json({ error: 'Bu notu güncelleme yetkiniz yok' });
    }

    const note = await prisma.note.update({
      where: { id: noteId },
      data: { content },
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
        },
        user: true
      }
    });

    // Görev sahibine bildirim gönder
    if (note.task.userId !== currentUserId) {
      socketService.emitToUser(note.task.userId, notificationEvents.NOTE_UPDATED, {
        taskId: note.task.id,
        noteId: note.id,
        title: note.task.title,
        content: content.substring(0, 100) + (content.length > 100 ? '...' : ''),
        updatedBy: note.user.name
      });
    }

    // Proje sahibine bildirim gönder
    if (note.task.project?.ownerId !== currentUserId && note.task.project?.ownerId !== note.task.userId) {
      socketService.emitToUser(note.task.project.ownerId, notificationEvents.NOTE_UPDATED, {
        taskId: note.task.id,
        noteId: note.id,
        title: note.task.title,
        content: content.substring(0, 100) + (content.length > 100 ? '...' : ''),
        updatedBy: note.user.name,
        projectName: note.task.project.name
      });
    }

    res.json(note);
  } catch (error) {
    console.error('Update note error:', error);
    res.status(500).json({ error: 'Not güncellenemedi' });
  }
};

export const deleteNote = async (req: Request, res: Response) => {
  try {
    const { taskId, noteId } = req.params;
    const userId = req.user?.userId;

    if (!userId) {
      return res.status(401).json({ error: 'Yetkilendirme gerekli' });
    }

    // Not ve görevin varlığını kontrol et
    const note = await prisma.note.findUnique({
      where: { id: Number(noteId) },
      include: {
        task: {
          include: { project: true }
        },
        user: true
      }
    });

    if (!note) {
      return res.status(404).json({ error: 'Not bulunamadı' });
    }

    // Yetki kontrolü - Sadece notun sahibi veya proje sahibi silebilir
    if (note.userId !== userId && note.task.project.ownerId !== userId) {
      return res.status(403).json({ error: 'Bu notu silme yetkiniz yok' });
    }

    await prisma.note.delete({
      where: { id: Number(noteId) }
    });

    res.status(204).send();
  } catch (error) {
    console.error('Delete note error:', error);
    res.status(500).json({ error: 'Not silinemedi' });
  }
};

export const getTaskNotes = async (req: Request, res: Response) => {
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
        notes: {
          orderBy: { createdAt: 'desc' },
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true
              }
            }
          }
        }
      }
    });

    if (!task) {
      return res.status(404).json({ error: 'Görev bulunamadı' });
    }

    // Yetki kontrolü
    if (task.userId !== userId && task.project.ownerId !== userId) {
      return res.status(403).json({ error: 'Bu görevin notlarını görüntüleme yetkiniz yok' });
    }

    res.json(task.notes);
  } catch (error) {
    console.error('Get notes error:', error);
    res.status(500).json({ error: 'Notlar getirilemedi' });
  }
}; 