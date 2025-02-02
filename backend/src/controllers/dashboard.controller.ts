import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { DashboardFilters } from '../types/dashboard.types';

const prisma = new PrismaClient();

// Tip tanımlamaları
interface ProjectGroup {
  isPrivate: boolean;
  _count: number;
}

interface TaskGroup {
  status: string;
  _count: number;
}

interface PriorityGroup {
  priority: string;
  _count: number;
}

export const getDashboardSummary = async (req: Request, res: Response) => {
  try {
    const currentUserId = req.user?.userId;
    const { startDate, endDate }: DashboardFilters = req.query;

    if (!currentUserId) {
      return res.status(401).json({ error: 'Yetkilendirme gerekli' });
    }

    const dateFilter = {
      ...(startDate && { gte: new Date(startDate) }),
      ...(endDate && { lte: new Date(endDate) }),
    };

    // Proje istatistikleri
    const projects = await prisma.project.groupBy({
      by: ['isPrivate'],
      _count: true,
      where: {
        OR: [
          { ownerId: currentUserId },
          { isPrivate: false },
        ],
        ...(Object.keys(dateFilter).length > 0 && {
          createdAt: dateFilter,
        }),
      },
    });

    // Görev istatistikleri
    const tasks = await prisma.task.groupBy({
      by: ['status'],
      _count: true,
      where: {
        OR: [
          { userId: currentUserId },
          {
            project: {
              OR: [
                { ownerId: currentUserId },
                { isPrivate: false },
              ],
            },
          },
        ],
        ...(Object.keys(dateFilter).length > 0 && {
          createdAt: dateFilter,
        }),
      },
    });

    // Öncelik bazlı görev istatistikleri
    const tasksByPriority = await prisma.task.groupBy({
      by: ['priority'],
      _count: true,
      where: {
        OR: [
          { userId: currentUserId },
          {
            project: {
              OR: [
                { ownerId: currentUserId },
                { isPrivate: false },
              ],
            },
          },
        ],
        ...(Object.keys(dateFilter).length > 0 && {
          createdAt: dateFilter,
        }),
      },
    });

    // Gecikmiş görevler
    const overdueTasks = await prisma.task.count({
      where: {
        OR: [
          { userId: currentUserId },
          {
            project: {
              OR: [
                { ownerId: currentUserId },
                { isPrivate: false },
              ],
            },
          },
        ],
        status: { not: 'COMPLETED' },
        dueDate: { lt: new Date() },
      },
    });

    const summary = {
      projects: {
        total: projects.reduce((acc: number, curr: ProjectGroup) => acc + curr._count, 0),
        private: projects.find((p: ProjectGroup) => p.isPrivate)?._count || 0,
        public: projects.find((p: ProjectGroup) => !p.isPrivate)?._count || 0,
      },
      tasks: {
        total: tasks.reduce((acc: number, curr: TaskGroup) => acc + curr._count, 0),
        completed: tasks.find((t: TaskGroup) => t.status === 'COMPLETED')?._count || 0,
        inProgress: tasks.find((t: TaskGroup) => t.status === 'IN_PROGRESS')?._count || 0,
        notStarted: tasks.find((t: TaskGroup) => t.status === 'NOT_STARTED')?._count || 0,
        stuck: tasks.find((t: TaskGroup) => t.status === 'STUCK')?._count || 0,
        overdue: overdueTasks,
      },
      tasksByPriority: {
        critical: tasksByPriority.find((t: PriorityGroup) => t.priority === 'CRITICAL')?._count || 0,
        high: tasksByPriority.find((t: PriorityGroup) => t.priority === 'HIGH')?._count || 0,
        normal: tasksByPriority.find((t: PriorityGroup) => t.priority === 'NORMAL')?._count || 0,
        low: tasksByPriority.find((t: PriorityGroup) => t.priority === 'LOW')?._count || 0,
      },
    };

    res.json(summary);
  } catch (error) {
    console.error('Dashboard summary error:', error);
    res.status(500).json({ error: 'Dashboard özeti alınamadı' });
  }
};

// User interface tanımı
interface UserWithTaskCount {
  id: number;
  name: string;
  email: string;
  _count: {
    tasks: number;
  };
}

export const getUserTasksSummary = async (req: Request, res: Response) => {
  try {
    const currentUserId = req.user?.userId;

    if (!currentUserId) {
      return res.status(401).json({ error: 'Yetkilendirme gerekli' });
    }

    const users = await prisma.user.findMany({
      where: {
        OR: [
          { id: currentUserId },
          {
            tasks: {
              some: {
                project: {
                  ownerId: currentUserId,
                },
              },
            },
          },
        ],
      },
      select: {
        id: true,
        name: true,
        email: true,
        _count: {
          select: {
            tasks: {
              where: {
                OR: [
                  { userId: currentUserId },
                  {
                    project: {
                      ownerId: currentUserId,
                    },
                  },
                ],
              },
            },
          },
        },
      },
    });

    const userSummaries = await Promise.all(
      users.map(async (user: UserWithTaskCount) => {
        const completedTasks = await prisma.task.count({
          where: {
            userId: user.id,
            status: 'COMPLETED',
            OR: [
              { userId: currentUserId },
              {
                project: {
                  ownerId: currentUserId,
                },
              },
            ],
          },
        });

        const overdueTasks = await prisma.task.count({
          where: {
            userId: user.id,
            status: { not: 'COMPLETED' },
            dueDate: { lt: new Date() },
            OR: [
              { userId: currentUserId },
              {
                project: {
                  ownerId: currentUserId,
                },
              },
            ],
          },
        });

        return {
          userId: user.id,
          userName: user.name,
          email: user.email,
          assignedTasks: user._count.tasks,
          completedTasks,
          overdueTasks,
        };
      })
    );

    res.json(userSummaries);
  } catch (error) {
    console.error('User tasks summary error:', error);
    res.status(500).json({ error: 'Kullanıcı görev özeti alınamadı' });
  }
};

// Task interface tanımı
interface TaskWithDetails {
  title: string;
  status: string;
  updatedAt: Date;
}

export const getProjectProgress = async (req: Request, res: Response) => {
  try {
    const currentUserId = req.user?.userId;
    const { projectId } = req.params;

    if (!currentUserId) {
      return res.status(401).json({ error: 'Yetkilendirme gerekli' });
    }

    const project = await prisma.project.findUnique({
      where: { id: Number(projectId) },
      include: {
        tasks: {
          orderBy: {
            updatedAt: 'desc',
          },
          take: 5,
          select: {
            title: true,
            status: true,
            updatedAt: true,
          },
        },
        _count: {
          select: {
            tasks: true,
          },
        },
      },
    });

    if (!project) {
      return res.status(404).json({ error: 'Proje bulunamadı' });
    }

    if (project.isPrivate && project.ownerId !== currentUserId) {
      return res.status(403).json({ error: 'Bu projeye erişim yetkiniz yok' });
    }

    const completedTasks = await prisma.task.count({
      where: {
        projectId: Number(projectId),
        status: 'COMPLETED',
      },
    });

    const progress = {
      id: project.id,
      name: project.name,
      totalTasks: project._count.tasks,
      completedTasks,
      progress: project._count.tasks > 0 
        ? Math.round((completedTasks / project._count.tasks) * 100) 
        : 0,
      recentActivity: project.tasks.map((task: TaskWithDetails) => ({
        date: task.updatedAt,
        action: task.status === 'COMPLETED' ? 'Tamamlandı' : 'Güncellendi',
        taskTitle: task.title,
      })),
    };

    res.json(progress);
  } catch (error) {
    console.error('Project progress error:', error);
    res.status(500).json({ error: 'Proje ilerleme durumu alınamadı' });
  }
};

export const getDashboardStats = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.userId;

    if (!userId) {
      return res.status(401).json({ error: 'Yetkilendirme gerekli' });
    }

    // Toplam proje sayısı (sadece kendi projeleri)
    const totalProjects = await prisma.project.count({
      where: { ownerId: userId }
    });

    // Görev durumlarına göre sayılar
    const tasksByStatus = await prisma.task.groupBy({
      by: ['status'],
      _count: true,
      where: {
        OR: [
          { userId: userId },
          { project: { ownerId: userId } }
        ]
      }
    });

    // Tamamlanan görev sayısı
    const completedTasks = tasksByStatus.find(t => t.status === 'COMPLETED')?._count || 0;
    const inProgressTasks = tasksByStatus.find(t => t.status === 'IN_PROGRESS')?._count || 0;
    const notStartedTasks = tasksByStatus.find(t => t.status === 'NOT_STARTED')?._count || 0;
    const stuckTasks = tasksByStatus.find(t => t.status === 'STUCK')?._count || 0;

    // Toplam görev sayısı
    const totalTasks = completedTasks + inProgressTasks + notStartedTasks + stuckTasks;

    // Kritik görevler
    const criticalTasks = await prisma.task.count({
      where: {
        AND: [
          {
            OR: [
              { userId: userId },
              { project: { ownerId: userId } }
            ]
          },
          { 
            priority: 'CRITICAL',
            status: { not: 'COMPLETED' }
          }
        ]
      }
    });

    // Geciken görevler
    const overdueTasks = await prisma.task.findMany({
      where: {
        AND: [
          {
            OR: [
              { userId: userId },
              { project: { ownerId: userId } }
            ]
          },
          {
            dueDate: {
              lt: new Date()
            },
            status: {
              not: 'COMPLETED'
            }
          }
        ]
      }
    });

    const stats = {
      totalProjects,
      totalTasks,
      completedTasks,
      criticalTasks,
      overdueTasks,
      tasks: {
        completed: completedTasks,
        inProgress: inProgressTasks,
        notStarted: notStartedTasks,
        stuck: stuckTasks
      }
    };

    console.log('Dashboard stats:', stats);
    res.json(stats);
  } catch (error) {
    console.error('Dashboard stats error:', error);
    res.status(500).json({ error: 'Dashboard istatistikleri alınamadı' });
  }
};

export const getTaskDistribution = async (req: Request, res: Response) => {
  try {
    const currentUserId = req.user?.userId;

    if (!currentUserId) {
      return res.status(401).json({ error: 'Yetkilendirme gerekli' });
    }

    const users = await prisma.user.findMany({
      where: {
        tasks: {
          some: {
            OR: [
              { userId: currentUserId },
              {
                project: {
                  ownerId: currentUserId,
                },
              },
            ],
          },
        },
      },
      select: {
        id: true,
        name: true,
        tasks: {
          select: {
            status: true,
            priority: true,
            dueDate: true,
          },
          where: {
            OR: [
              { userId: currentUserId },
              {
                project: {
                  ownerId: currentUserId,
                },
              },
            ],
          },
        },
      },
    });

    const distribution = users.map(user => ({
      userId: user.id,
      userName: user.name,
      taskStats: {
        total: user.tasks.length,
        byStatus: {
          completed: user.tasks.filter(t => t.status === 'COMPLETED').length,
          inProgress: user.tasks.filter(t => t.status === 'IN_PROGRESS').length,
          notStarted: user.tasks.filter(t => t.status === 'NOT_STARTED').length,
          stuck: user.tasks.filter(t => t.status === 'STUCK').length,
        },
        byPriority: {
          critical: user.tasks.filter(t => t.priority === 'CRITICAL').length,
          high: user.tasks.filter(t => t.priority === 'HIGH').length,
          normal: user.tasks.filter(t => t.priority === 'NORMAL').length,
          low: user.tasks.filter(t => t.priority === 'LOW').length,
        },
        overdue: user.tasks.filter(t => 
          t.status !== 'COMPLETED' && 
          t.dueDate && 
          new Date(t.dueDate) < new Date()
        ).length,
      },
    }));

    res.json(distribution);
  } catch (error) {
    console.error('Task distribution error:', error);
    res.status(500).json({ error: 'Görev dağılımı alınamadı' });
  }
};

export const getOverdueTasks = async (req: Request, res: Response) => {
  try {
    const currentUserId = req.user?.userId;

    if (!currentUserId) {
      return res.status(401).json({ error: 'Yetkilendirme gerekli' });
    }

    const overdueTasks = await prisma.task.findMany({
      where: {
        OR: [
          { userId: currentUserId },
          {
            project: {
              ownerId: currentUserId,
            },
          },
        ],
        status: { not: 'COMPLETED' },
        dueDate: { lt: new Date() },
      },
      select: {
        id: true,
        title: true,
        dueDate: true,
        priority: true,
        status: true,
        user: {
          select: {
            name: true,
          },
        },
        project: {
          select: {
            name: true,
          },
        },
      },
      orderBy: [
        { priority: 'desc' },
        { dueDate: 'asc' },
      ],
    });

    const groupedOverdueTasks = {
      critical: overdueTasks.filter(t => t.priority === 'CRITICAL'),
      high: overdueTasks.filter(t => t.priority === 'HIGH'),
      normal: overdueTasks.filter(t => t.priority === 'NORMAL'),
      low: overdueTasks.filter(t => t.priority === 'LOW'),
    };

    res.json(groupedOverdueTasks);
  } catch (error) {
    console.error('Overdue tasks error:', error);
    res.status(500).json({ error: 'Geciken görevler alınamadı' });
  }
}; 