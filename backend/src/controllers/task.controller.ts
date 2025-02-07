import { Request, Response } from 'express';
import { PrismaClient, Status, Priority, Prisma } from '@prisma/client';
import { CreateTaskDTO, UpdateTaskDTO, TaskQueryParams } from '../types/task.types';
import * as fs from 'fs';
import { supabase } from '../config/supabase';
import { socketService, notificationEvents } from '../config/socket';

const prisma = new PrismaClient();
const DEFAULT_PAGE_SIZE = 10;

const TaskStatusLabels: Record<Status, string> = {
  NOT_STARTED: 'Başlanmadı',
  IN_PROGRESS: 'Devam Ediyor',
  STUCK: 'Takıldı',
  COMPLETED: 'Tamamlandı',
};

const TaskPriorityLabels: Record<Priority, string> = {
  CRITICAL: 'Kritik',
  HIGH: 'Yüksek',
  NORMAL: 'Normal',
  LOW: 'Düşük',
};

const taskInclude = {
  project: {
    select: {
      id: true,
      name: true,
      isPrivate: true,
      ownerId: true,
      owner: {
        select: {
          id: true,
          name: true,
          email: true
        }
      }
    }
  },
  user: {
    select: {
      id: true,
      name: true,
      email: true
    }
  },
  creator: {
    select: {
      id: true,
      name: true,
      email: true
    }
  },
  subtasks: true,
  notes: {
    include: {
      user: {
        select: {
          id: true,
          name: true
        }
      }
    }
  },
  files: {
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
} as const;

// Priority enum değerlerini dönüştüren yardımcı fonksiyon
const mapPriority = (priority: string): 'CRITICAL' | 'HIGH' | 'NORMAL' | 'LOW' => {
  const priorityMap: { [key: string]: 'CRITICAL' | 'HIGH' | 'NORMAL' | 'LOW' } = {
    'URGENT': 'CRITICAL',
    'MEDIUM': 'NORMAL',
    'HIGH': 'HIGH',
    'LOW': 'LOW',
    'NORMAL': 'NORMAL',
    'CRITICAL': 'CRITICAL'
  };
  return priorityMap[priority.toUpperCase()] || 'NORMAL';
};

interface TaskStatusChangeNotification {
  projectOwnerId: number;
  currentUserId: number;
  taskTitle: string;
  oldStatus: string;
  newStatus: string;
}

const notifyTaskStatusChange = async ({
  projectOwnerId,
  currentUserId,
  taskTitle,
  oldStatus,
  newStatus
}: TaskStatusChangeNotification) => {
  console.log('Proje sahibine durum değişikliği bildirimi gönderiliyor:', {
    projectOwnerId,
    currentUserId,
    taskTitle,
    oldStatus,
    newStatus
  });
};

export const createTask = async (req: Request, res: Response) => {
  try {
    const { title, description, status, priority, dueDate, projectId, assignedUserIds } = req.body;
    const creatorId = req.user?.userId;

    if (!creatorId) {
      return res.status(401).json({ error: 'Yetkilendirme gerekli' });
    }

    const task = await prisma.task.create({
      data: {
        title,
        description,
        status,
        priority,
        dueDate: dueDate ? new Date(dueDate) : undefined,
        project: {
          connect: { id: projectId }
        },
        creator: {
          connect: { id: creatorId }
        },
        assignedUsers: {
          connect: assignedUserIds.map((id: number) => ({ id }))
        }
      },
      include: {
        project: true,
        assignedUsers: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        creator: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    });

    // Her atanan kullanıcıya bildirim gönder
    for (const user of task.assignedUsers) {
      socketService.emitToUser(user.id, notificationEvents.TASK_ASSIGNED, {
        taskId: task.id,
        title: task.title,
        assignedBy: task.creator.name,
        projectName: task.project.name
      });
    }

    res.status(201).json(task);
  } catch (error) {
    console.error('Create task error:', error);
    res.status(500).json({ error: 'Görev oluşturulamadı' });
  }
};

export const getTasks = async (req: Request, res: Response) => {
  try {
    const currentUserId = req.user?.userId;
    const {
      page = '1',
      limit = DEFAULT_PAGE_SIZE.toString(),
      status,
      priority,
      projectId,
      search,
      userId,
      dueBefore,
      dueAfter,
    }: TaskQueryParams = req.query;

    if (!currentUserId) {
      return res.status(401).json({ error: 'Yetkilendirme gerekli' });
    }

    const skip = (Number(page) - 1) * Number(limit);

    // Filtreleme koşullarını oluştur
    const where: Prisma.TaskWhereInput = {
      OR: [
        { userId: currentUserId }, // Kendisine atanmış görevler
        { creatorId: currentUserId }, // Kendisinin oluşturduğu görevler
        { project: { ownerId: currentUserId } }, // Kendi projelerindeki görevler
        {
          project: {
            AND: [
              { isPrivate: false }, // Public projelerdeki görevler
              {
                owner: {
                  sharedCustomers: {
                    some: {
                      userId: currentUserId
                    }
                  }
                }
              }
            ]
          }
        }
      ],
      ...(status && { status: status as Status }),
      ...(priority && { priority: priority as Priority }),
      ...(projectId && { projectId: Number(projectId) }),
      ...(userId && { userId: Number(userId) }),
      ...(search && {
        OR: [
          { title: { contains: search, mode: 'insensitive' } },
          { description: { contains: search, mode: 'insensitive' } },
        ],
      }),
      ...(dueBefore && { dueDate: { lte: new Date(dueBefore) } }),
      ...(dueAfter && { dueDate: { gte: new Date(dueAfter) } }),
    };

    const [tasks, total] = await Promise.all([
      prisma.task.findMany({
        where,
        include: taskInclude,
        skip,
        take: Number(limit),
        orderBy: [
          { priority: 'desc' },
          { dueDate: 'asc' },
          { createdAt: 'desc' },
        ],
      }),
      prisma.task.count({ where }),
    ]);

    // Görevleri formatla
    const formattedTasks = tasks.map(task => ({
      ...task,
      projectName: task.project.name,
      projectOwner: {
        id: task.project.owner.id,
        name: task.project.owner.name
      },
      assignedTo: task.user ? {
        id: task.user.id,
        name: task.user.name
      } : null,
      notes: task.notes.map(note => ({
        ...note,
        createdBy: note.user.name
      })),
      createdBy: task.creator.name,
      projectOwnerName: task.project.owner.name
    }));

    res.json({
      tasks: formattedTasks,
      total,
      page: Number(page),
      limit: Number(limit),
    });
  } catch (error) {
    console.error('Get tasks error:', error);
    res.status(500).json({ error: 'Görevler getirilemedi' });
  }
};

export const getTaskById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const currentUserId = req.user?.userId;

    if (!currentUserId) {
      return res.status(401).json({ error: 'Yetkilendirme gerekli' });
    }

    const task = await prisma.task.findUnique({
      where: { id: Number(id) },
      include: taskInclude,
    });

    if (!task) {
      return res.status(404).json({ error: 'Görev bulunamadı' });
    }

    // Erişim kontrolü
    if (task.project.isPrivate && task.project.ownerId !== currentUserId && task.userId !== currentUserId) {
      return res.status(403).json({ error: 'Bu göreve erişim yetkiniz yok' });
    }

    res.json(task);
  } catch (error) {
    console.error('Get task error:', error);
    res.status(500).json({ error: 'Görev getirilemedi' });
  }
};

export const updateTask = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { title, description, status, priority, dueDate, assignedUserIds } = req.body;
    const userId = req.user?.userId;

    if (!userId) {
      return res.status(401).json({ error: 'Yetkilendirme gerekli' });
    }

    const existingTask = await prisma.task.findUnique({
      where: { id: Number(id) },
      include: {
        project: true,
        assignedUsers: true
      }
    });

    if (!existingTask) {
      return res.status(404).json({ error: 'Görev bulunamadı' });
    }

    const task = await prisma.task.update({
      where: { id: Number(id) },
      data: {
        title,
        description,
        status,
        priority,
        dueDate: dueDate ? new Date(dueDate) : undefined,
        assignedUsers: {
          set: assignedUserIds.map((id: number) => ({ id }))
        }
      },
      include: {
        project: true,
        assignedUsers: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        creator: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    });

    // Yeni atanan kullanıcılara bildirim gönder
    const newUserIds = assignedUserIds.filter(
      (id: number) => !existingTask.assignedUsers.some(user => user.id === id)
    );

    for (const userId of newUserIds) {
      const user = task.assignedUsers.find(u => u.id === userId);
      if (user) {
        socketService.emitToUser(userId, notificationEvents.TASK_ASSIGNED, {
          taskId: task.id,
          title: task.title,
          assignedBy: task.creator.name,
          projectName: task.project.name
        });
      }
    }

    res.json(task);
  } catch (error) {
    console.error('Update task error:', error);
    res.status(500).json({ error: 'Görev güncellenemedi' });
  }
};

export const deleteTask = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const currentUserId = req.user?.userId;

    if (!currentUserId) {
      return res.status(401).json({ error: 'Yetkilendirme gerekli' });
    }

    const task = await prisma.task.findUnique({
      where: { id: Number(id) },
      include: {
        project: {
          select: {
            ownerId: true,
          },
        },
      },
    });

    if (!task) {
      return res.status(404).json({ error: 'Görev bulunamadı' });
    }

    // Sadece proje sahibi veya görevi oluşturan kişi silebilir
    if (task.project.ownerId !== currentUserId && task.userId !== currentUserId) {
      return res.status(403).json({ error: 'Bu görevi silme yetkiniz yok' });
    }

    await prisma.task.delete({
      where: { id: Number(id) },
    });

    res.status(204).send();
  } catch (error) {
    console.error('Delete task error:', error);
    res.status(500).json({ error: 'Görev silinemedi' });
  }
};

// Proje bazlı görevleri getir
export const getTasksByProject = async (req: Request, res: Response) => {
  try {
    const projectId = parseInt(req.params.projectId);
    const userId = req.user?.userId;

    if (isNaN(projectId)) {
      return res.status(400).json({ error: 'Geçersiz proje ID' });
    }

    // Önce projeyi kontrol et
    const project = await prisma.project.findUnique({
      where: { id: projectId }
    });

    if (!project) {
      return res.status(404).json({ error: 'Proje bulunamadı' });
    }

    // Kullanıcının yetkisini kontrol et
    if (project.isPrivate && project.ownerId !== userId && !await prisma.task.findFirst({
      where: {
        projectId,
        userId
      }
    })) {
      return res.status(403).json({ error: 'Bu projeye erişim yetkiniz yok' });
    }

    // Projenin görevlerini getir
    const tasks = await prisma.task.findMany({
      where: { 
        projectId,
        OR: [
          { userId: userId }, // Kendisine atanan görevler
          { creatorId: userId }, // Kendisinin oluşturduğu görevler
          { project: { ownerId: userId } }, // Proje sahibinin görevleri
          {
            project: {
              AND: [
                { isPrivate: false }, // Public projelerdeki görevler
                {
                  owner: {
                    sharedCustomers: {
                      some: {
                        userId
                      }
                    }
                  }
                }
              ]
            }
          }
        ]
      },
      include: {
        project: {
          select: {
            name: true,
            owner: {
              select: {
                id: true,
                name: true,
                email: true
              }
            }
          }
        },
        user: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        creator: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        subtasks: true,
        notes: {
          include: {
            user: {
              select: {
                id: true,
                name: true
              }
            }
          }
        },
        files: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    // Görevleri formatla
    const formattedTasks = tasks.map(task => ({
      ...task,
      projectName: task.project.name,
      projectOwner: {
        id: task.project.owner.id,
        name: task.project.owner.name
      },
      assignedTo: task.user ? {
        id: task.user.id,
        name: task.user.name
      } : null,
      createdBy: task.creator.name,
      notes: task.notes.map(note => ({
        ...note,
        createdBy: note.user.name
      }))
    }));

    console.log(`${tasks.length} görev bulundu - Proje ID: ${projectId}`);
    res.json(formattedTasks);
  } catch (error) {
    console.error('Proje görevlerini getirme hatası:', error);
    res.status(500).json({ error: 'Görevler yüklenirken bir hata oluştu' });
  }
};

// Alt görev işlemleri
export const createSubtask = async (req: Request, res: Response) => {
  try {
    const taskId = parseInt(req.params.id);
    const { title } = req.body;
    const userId = req.user?.userId;

    if (!title) {
      return res.status(400).json({ error: 'Alt görev başlığı gereklidir.' });
    }

    const task = await prisma.task.findUnique({
      where: { id: taskId },
      include: { project: true }
    });

    if (!task) {
      return res.status(404).json({ error: 'Görev bulunamadı.' });
    }

    const subtask = await prisma.subtask.create({
      data: {
        title,
        taskId,
        completed: false
      }
    });

    res.status(201).json(subtask);
  } catch (error) {
    console.error('Alt görev oluşturma hatası:', error);
    res.status(500).json({ error: 'Alt görev oluşturulurken bir hata oluştu.' });
  }
};

export const updateSubtask = async (req: Request, res: Response) => {
  try {
    const { id: taskId, subtaskId } = req.params;
    const { title, completed } = req.body;
    const currentUserId = req.user?.userId;

    if (!currentUserId) {
      return res.status(401).json({ error: 'Yetkilendirme gerekli' });
    }

    // Görevin ve alt görevin varlığını kontrol et
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
    if (task.userId !== currentUserId && task.project.ownerId !== currentUserId) {
      return res.status(403).json({ error: 'Bu alt görevi güncelleme yetkiniz yok' });
    }

    // Alt görevi güncelle
    const updatedSubtask = await prisma.subtask.update({
      where: { id: Number(subtaskId) },
      data: {
        ...(title !== undefined && { title }),
        ...(completed !== undefined && { completed })
      }
    });

    res.json(updatedSubtask);
  } catch (error) {
    console.error('Update subtask error:', error);
    res.status(500).json({ error: 'Alt görev güncellenemedi' });
  }
};

export const deleteSubtask = async (req: Request, res: Response) => {
  try {
    const taskId = parseInt(req.params.id);
    const subtaskId = parseInt(req.params.subtaskId);

    await prisma.subtask.delete({
      where: {
        id: subtaskId,
        taskId: taskId
      }
    });

    res.status(204).send();
  } catch (error) {
    console.error('Alt görev silme hatası:', error);
    res.status(500).json({ error: 'Alt görev silinirken bir hata oluştu.' });
  }
};

// Not işlemleri
export const createNote = async (req: Request, res: Response) => {
  try {
    const taskId = parseInt(req.params.id);
    const { content } = req.body;
    const userId = req.user?.userId;

    if (!content) {
      return res.status(400).json({ error: 'Not içeriği gereklidir.' });
    }

    if (!userId) {
      return res.status(401).json({ error: 'Kullanıcı kimliği gereklidir.' });
    }

    const task = await prisma.task.findUnique({
      where: { id: taskId },
      include: { project: true }
    });

    if (!task) {
      return res.status(404).json({ error: 'Görev bulunamadı.' });
    }

    const note = await prisma.note.create({
      data: {
        content,
        taskId,
        userId: userId
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    });

    res.status(201).json(note);
  } catch (error) {
    console.error('Not oluşturma hatası:', error);
    res.status(500).json({ error: 'Not oluşturulurken bir hata oluştu.' });
  }
};

export const updateNote = async (req: Request, res: Response) => {
  try {
    const taskId = parseInt(req.params.id);
    const noteId = parseInt(req.params.noteId);
    const { content } = req.body;
    const userId = req.user?.userId;

    const note = await prisma.note.update({
      where: {
        id: noteId,
        taskId: taskId,
        userId: userId
      },
      data: { content },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    });

    res.json(note);
  } catch (error) {
    console.error('Not güncelleme hatası:', error);
    res.status(500).json({ error: 'Not güncellenirken bir hata oluştu.' });
  }
};

export const deleteNote = async (req: Request, res: Response) => {
  try {
    const taskId = parseInt(req.params.id);
    const noteId = parseInt(req.params.noteId);
    const userId = req.user?.userId;

    await prisma.note.delete({
      where: {
        id: noteId,
        taskId: taskId,
        userId: userId
      }
    });

    res.status(204).send();
  } catch (error) {
    console.error('Not silme hatası:', error);
    res.status(500).json({ error: 'Not silinirken bir hata oluştu.' });
  }
};

// Dosya işlemleri
export const uploadFile = async (req: Request, res: Response) => {
  try {
    const taskId = parseInt(req.params.id);
    const userId = req.user?.userId;
    const file = req.file;

    if (!file) {
      return res.status(400).json({ error: 'Dosya yüklenemedi.' });
    }

    if (!userId) {
      return res.status(401).json({ error: 'Kullanıcı kimliği gereklidir.' });
    }

    // Görevin varlığını ve erişim yetkisini kontrol et
    const task = await prisma.task.findUnique({
      where: { id: taskId },
      include: { project: true }
    });

    if (!task) {
      return res.status(404).json({ error: 'Görev bulunamadı.' });
    }

    // Erişim kontrolü
    if (task.project.isPrivate && task.project.ownerId !== userId && task.userId !== userId) {
      return res.status(403).json({ error: 'Bu göreve dosya yükleme yetkiniz yok.' });
    }

    // Supabase'e dosya yükleme
    const filePath = `${userId}/${taskId}/${file.originalname}`;
    const { data, error } = await supabase.storage
      .from('task-files')
      .upload(filePath, file.buffer, {
        contentType: file.mimetype,
        upsert: true
      });

    if (error) {
      console.error('Supabase yükleme hatası:', error);
      return res.status(500).json({ error: 'Dosya yüklenirken bir hata oluştu.' });
    }

    // Veritabanına dosya bilgilerini kaydetme
    const taskFile = await prisma.taskFile.create({
      data: {
        task: { connect: { id: taskId } },
        user: { connect: { id: userId } },
        filename: file.originalname,
        filePath: filePath,
        size: file.size,
        mimeType: file.mimetype,
        publicUrl: supabase.storage
          .from('task-files')
          .getPublicUrl(filePath).data.publicUrl
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    });

    res.status(201).json(taskFile);
  } catch (error) {
    console.error('Dosya yükleme hatası:', error);
    res.status(500).json({ error: 'Dosya yüklenirken bir hata oluştu.' });
  }
};

export const downloadFile = async (req: Request, res: Response) => {
  try {
    const taskId = parseInt(req.params.id);
    const fileId = parseInt(req.params.fileId);
    const userId = req.user?.userId;

    if (!userId) {
      return res.status(401).json({ error: 'Kullanıcı kimliği gereklidir.' });
    }

    const taskFile = await prisma.taskFile.findUnique({
      where: { id: fileId },
      include: {
        task: {
          include: {
            project: true
          }
        }
      }
    });

    if (!taskFile) {
      return res.status(404).json({ error: 'Dosya bulunamadı.' });
    }

    // Erişim kontrolü
    if (taskFile.task.project.isPrivate && 
        taskFile.task.project.ownerId !== userId && 
        taskFile.task.userId !== userId) {
      return res.status(403).json({ error: 'Bu dosyaya erişim yetkiniz yok.' });
    }

    // Supabase'den dosyayı indirme
    const { data, error } = await supabase.storage
      .from('task-files')
      .download(taskFile.filePath);

    if (error) {
      return res.status(500).json({ error: 'Dosya indirilirken bir hata oluştu.' });
    }

    const isImage = taskFile.mimeType.startsWith('image/');
    const disposition = isImage ? 'inline' : 'attachment';

    res.setHeader('Content-Type', taskFile.mimeType);
    res.setHeader('Content-Disposition', `${disposition}; filename="${taskFile.filename}"`);
    res.send(Buffer.from(await data.arrayBuffer()));
  } catch (error) {
    console.error('Dosya indirme hatası:', error);
    res.status(500).json({ error: 'Dosya indirilirken bir hata oluştu.' });
  }
};

export const deleteFile = async (req: Request, res: Response) => {
  try {
    const fileId = parseInt(req.params.fileId);
    const userId = req.user?.userId;

    if (!userId) {
      return res.status(401).json({ error: 'Kullanıcı kimliği gereklidir.' });
    }

    const taskFile = await prisma.taskFile.findUnique({
      where: { id: fileId },
      include: {
        task: {
          include: {
            project: true
          }
        }
      }
    });

    if (!taskFile) {
      return res.status(404).json({ error: 'Dosya bulunamadı.' });
    }

    // Erişim kontrolü
    if (taskFile.task.project.isPrivate && 
        taskFile.task.project.ownerId !== userId && 
        taskFile.task.userId !== userId) {
      return res.status(403).json({ error: 'Bu dosyayı silme yetkiniz yok.' });
    }

    // Supabase'den dosyayı silme
    const { error } = await supabase.storage
      .from('task-files')
      .remove([taskFile.filePath]);

    if (error) {
      return res.status(500).json({ error: 'Dosya silinirken bir hata oluştu.' });
    }

    // Veritabanından dosya kaydını silme
    await prisma.taskFile.delete({
      where: { id: fileId }
    });

    res.status(200).json({ message: 'Dosya başarıyla silindi.' });
  } catch (error) {
    console.error('Dosya silme hatası:', error);
    res.status(500).json({ error: 'Dosya silinirken bir hata oluştu.' });
  }
}; 