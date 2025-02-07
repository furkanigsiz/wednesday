import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { CreateProjectDTO, UpdateProjectDTO, ProjectQueryParams } from '../types/project.types';

const prisma = new PrismaClient();
const DEFAULT_PAGE_SIZE = 10;

export const createProject = async (req: Request, res: Response) => {
  try {
    const { name, description, isPrivate, customerId }: CreateProjectDTO = req.body;
    const userId = req.user?.userId;

    if (!userId) {
      return res.status(401).json({ error: 'Yetkilendirme gerekli' });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!user) {
      return res.status(404).json({ error: 'Kullanıcı bulunamadı' });
    }

    if (customerId) {
      const customer = await prisma.customer.findUnique({
        where: { id: customerId }
      });

      if (!customer) {
        return res.status(404).json({ error: 'Müşteri bulunamadı' });
      }
    }

    const project = await prisma.project.create({
      data: {
        name,
        description,
        isPrivate,
        owner: {
          connect: { id: userId }
        },
        ...(customerId && {
          customer: {
            connect: { id: customerId }
          }
        })
      },
      include: {
        owner: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        customer: {
          select: {
            id: true,
            name: true,
            company: true
          }
        }
      },
    });

    res.status(201).json(project);
  } catch (error) {
    console.error('Create project error:', error);
    res.status(500).json({ error: 'Proje oluşturulamadı' });
  }
};

export const getProjects = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.userId;
    const { 
      page = '1', 
      limit = DEFAULT_PAGE_SIZE.toString(), 
      search, 
      isPrivate 
    }: ProjectQueryParams = req.query;

    if (!userId) {
      return res.status(401).json({ error: 'Yetkilendirme gerekli' });
    }

    const skip = (Number(page) - 1) * Number(limit);
    
    const where = {
      OR: [
        { ownerId: userId },
        { tasks: { some: { userId } } },
        {
          AND: [
            { isPrivate: false },
            {
              OR: [
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
          ]
        }
      ],
      ...(search && {
        name: {
          contains: search,
          mode: 'insensitive' as const,
        },
      }),
      ...(isPrivate !== undefined && {
        isPrivate: isPrivate === 'true',
      }),
    };

    const [projects, total] = await Promise.all([
      prisma.project.findMany({
        where,
        include: {
          owner: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          customer: {
            select: {
              id: true,
              name: true,
              company: true
            }
          },
          tasks: {
            select: {
              id: true,
              title: true,
              user: {
                select: {
                  id: true,
                  name: true,
                  email: true
                }
              }
            }
          },
          _count: {
            select: {
              tasks: true,
            },
          },
        },
        skip,
        take: Number(limit),
        orderBy: {
          createdAt: 'desc',
        },
      }),
      prisma.project.count({ where }),
    ]);

    // Projeleri formatla
    const formattedProjects = projects.map(project => ({
      ...project,
      ownerName: project.owner.name,
      isOwner: project.ownerId === userId,
      assignedUsers: [...new Set(project.tasks
        .filter(task => task.user)
        .map(task => ({
          id: task.user.id,
          name: task.user.name,
          email: task.user.email
        })))],
      tasks: undefined // Detaylı task bilgilerini kaldır
    }));

    res.json({
      projects: formattedProjects,
      total,
      page: Number(page),
      limit: Number(limit),
    });
  } catch (error) {
    console.error('Get projects error:', error);
    res.status(500).json({ error: 'Projeler getirilemedi' });
  }
};

export const getProjectById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user?.userId;

    if (!userId) {
      return res.status(401).json({ error: 'Yetkilendirme gerekli' });
    }

    const project = await prisma.project.findUnique({
      where: { id: Number(id) },
      include: {
        owner: {
          select: {
            id: true,
            name: true,
            email: true,
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

    if (project.isPrivate && project.ownerId !== userId) {
      return res.status(403).json({ error: 'Bu projeye erişim yetkiniz yok' });
    }

    // Kullanıcının proje sahibi olup olmadığını kontrol et
    const isOwner = project.ownerId === userId;

    res.json({
      ...project,
      isOwner // Proje sahibi olup olmadığı bilgisini ekle
    });
  } catch (error) {
    console.error('Get project error:', error);
    res.status(500).json({ error: 'Proje getirilemedi' });
  }
};

export const updateProject = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { name, description, isPrivate }: UpdateProjectDTO = req.body;
    const userId = req.user?.userId;

    if (!userId) {
      return res.status(401).json({ error: 'Yetkilendirme gerekli' });
    }

    const project = await prisma.project.findUnique({
      where: { id: Number(id) },
    });

    if (!project) {
      return res.status(404).json({ error: 'Proje bulunamadı' });
    }

    if (project.ownerId !== userId) {
      return res.status(403).json({ error: 'Bu projeyi düzenleme yetkiniz yok' });
    }

    const updatedProject = await prisma.project.update({
      where: { id: Number(id) },
      data: {
        name,
        description,
        isPrivate,
      },
      include: {
        owner: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    res.json(updatedProject);
  } catch (error) {
    console.error('Update project error:', error);
    res.status(500).json({ error: 'Proje güncellenemedi' });
  }
};

export const deleteProject = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user?.userId;

    if (!userId) {
      return res.status(401).json({ error: 'Yetkilendirme gerekli' });
    }

    const project = await prisma.project.findUnique({
      where: { id: Number(id) },
    });

    if (!project) {
      return res.status(404).json({ error: 'Proje bulunamadı' });
    }

    if (project.ownerId !== userId) {
      return res.status(403).json({ error: 'Bu projeyi silme yetkiniz yok' });
    }

    await prisma.project.delete({
      where: { id: Number(id) },
    });

    res.status(204).send();
  } catch (error) {
    console.error('Delete project error:', error);
    res.status(500).json({ error: 'Proje silinemedi' });
  }
};

export const getProjectTasks = async (req: Request, res: Response) => {
  try {
    const { projectId } = req.params;
    const userId = req.user?.userId;
    
    if (!userId) {
      return res.status(401).json({ error: 'Yetkilendirme gerekli' });
    }

    const tasks = await prisma.task.findMany({
      where: {
        projectId: parseInt(projectId),
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        project: {
          select: {
            id: true,
            name: true,
            customer: {
              select: {
                id: true,
                name: true,
                company: true
              }
            }
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    res.json({ tasks });
  } catch (error) {
    console.error('Görevler getirilemedi:', error);
    res.status(500).json({ error: 'Görevler yüklenirken bir hata oluştu' });
  }
}; 