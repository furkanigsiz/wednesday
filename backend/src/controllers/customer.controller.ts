import { Request, Response } from 'express';
import { customerService } from '../services/customer.service';
import { invoiceService } from '../services/invoice.service';
import { CustomerFormData } from '../types';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const getAll = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.userId;
    
    if (!userId) {
      return res.status(401).json({ error: 'Yetkilendirme gerekli' });
    }

    const customers = await customerService.getAll(userId);
    res.json(customers);
  } catch (error) {
    console.error('Müşterileri getirme hatası:', error);
    res.status(500).json({ error: 'Müşteriler yüklenirken bir hata oluştu' });
  }
};

export const getById = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.userId;
    
    if (!userId) {
      return res.status(401).json({ error: 'Yetkilendirme gerekli' });
    }

    const customer = await customerService.getById(parseInt(req.params.id), userId);
    if (!customer) {
      return res.status(404).json({ error: 'Müşteri bulunamadı' });
    }
    res.json(customer);
  } catch (error) {
    if (error instanceof Error && error.message === 'Müşteri bulunamadı veya erişim izniniz yok') {
      return res.status(403).json({ error: error.message });
    }
    console.error('Müşteri getirme hatası:', error);
    res.status(500).json({ error: 'Müşteri yüklenirken bir hata oluştu' });
  }
};

export const create = async (req: Request, res: Response) => {
  try {
    const data: CustomerFormData = req.body;
    const userId = req.user?.userId;
    
    if (!userId) {
      return res.status(401).json({ error: 'Yetkilendirme gerekli' });
    }

    const customer = await customerService.create(data, userId);
    res.status(201).json(customer);
  } catch (error) {
    console.error('Müşteri oluşturma hatası:', error);
    res.status(500).json({ error: 'Müşteri oluşturulurken bir hata oluştu' });
  }
};

export const update = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.userId;
    
    if (!userId) {
      return res.status(401).json({ error: 'Yetkilendirme gerekli' });
    }

    const data: Partial<CustomerFormData> = req.body;
    const customer = await customerService.update(parseInt(req.params.id), data, userId);
    res.json(customer);
  } catch (error) {
    if (error instanceof Error && error.message === 'Müşteri bulunamadı veya erişim izniniz yok') {
      return res.status(403).json({ error: error.message });
    }
    console.error('Müşteri güncelleme hatası:', error);
    res.status(500).json({ error: 'Müşteri güncellenirken bir hata oluştu' });
  }
};

export const deleteCustomer = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.userId;
    
    if (!userId) {
      return res.status(401).json({ error: 'Yetkilendirme gerekli' });
    }

    await customerService.delete(parseInt(req.params.id), userId);
    res.status(204).send();
  } catch (error) {
    if (error instanceof Error && error.message === 'Müşteri bulunamadı veya silme yetkiniz yok') {
      return res.status(403).json({ error: error.message });
    }
    console.error('Müşteri silme hatası:', error);
    res.status(500).json({ error: 'Müşteri silinirken bir hata oluştu' });
  }
};

export const shareCustomer = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.userId;
    const { targetUserId } = req.body;
    
    if (!userId) {
      return res.status(401).json({ error: 'Yetkilendirme gerekli' });
    }

    if (!targetUserId) {
      return res.status(400).json({ error: 'Hedef kullanıcı ID\'si gerekli' });
    }

    const customer = await customerService.shareWith(parseInt(req.params.id), userId, targetUserId);
    res.json(customer);
  } catch (error) {
    if (error instanceof Error && error.message === 'Müşteri bulunamadı veya paylaşma yetkiniz yok') {
      return res.status(403).json({ error: error.message });
    }
    console.error('Müşteri paylaşma hatası:', error);
    res.status(500).json({ error: 'Müşteri paylaşılırken bir hata oluştu' });
  }
};

export const removeShare = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.userId;
    const { targetUserId } = req.body;
    
    if (!userId) {
      return res.status(401).json({ error: 'Yetkilendirme gerekli' });
    }

    if (!targetUserId) {
      return res.status(400).json({ error: 'Hedef kullanıcı ID\'si gerekli' });
    }

    const customer = await customerService.removeShare(parseInt(req.params.id), userId, targetUserId);
    res.json(customer);
  } catch (error) {
    if (error instanceof Error && error.message === 'Müşteri bulunamadı veya paylaşım kaldırma yetkiniz yok') {
      return res.status(403).json({ error: error.message });
    }
    console.error('Müşteri paylaşım kaldırma hatası:', error);
    res.status(500).json({ error: 'Müşteri paylaşımı kaldırılırken bir hata oluştu' });
  }
};

// Fatura işlemleri
export const createInvoice = async (req: Request, res: Response) => {
  try {
    const { customerId } = req.params;
    const userId = req.user?.userId;
    
    if (!userId) {
      return res.status(401).json({ error: 'Yetkilendirme gerekli' });
    }

    const invoice = await invoiceService.create(parseInt(customerId), userId, req.body);
    res.status(201).json(invoice);
  } catch (error) {
    console.error('Fatura oluşturma hatası:', error);
    res.status(500).json({ error: 'Fatura oluşturulurken bir hata oluştu' });
  }
};

export const getInvoices = async (req: Request, res: Response) => {
  try {
    const { customerId } = req.params;
    const include = req.query.include as string;
    
    // include parametresine göre ilişkileri dahil et
    const includeRelations = {
      items: include?.split(',').includes('items'),
      payments: include?.split(',').includes('payments')
    };
    
    const invoices = await invoiceService.getAll(parseInt(customerId));
    res.json(invoices);
  } catch (error) {
    console.error('Faturaları getirme hatası:', error);
    res.status(500).json({ error: 'Faturalar yüklenirken bir hata oluştu' });
  }
};

export const createPayment = async (req: Request, res: Response) => {
  try {
    const { invoiceId } = req.params;
    const userId = req.user?.userId;
    
    if (!userId) {
      return res.status(401).json({ error: 'Yetkilendirme gerekli' });
    }

    const payment = await invoiceService.createPayment(parseInt(invoiceId), userId, req.body);
    res.status(201).json(payment);
  } catch (error) {
    console.error('Ödeme oluşturma hatası:', error);
    res.status(500).json({ error: 'Ödeme oluşturulurken bir hata oluştu' });
  }
};

export const getInvoiceById = async (req: Request, res: Response) => {
  try {
    const { invoiceId } = req.params;
    const userId = req.user?.userId;
    
    if (!userId) {
      return res.status(401).json({ error: 'Yetkilendirme gerekli' });
    }

    const invoice = await invoiceService.getById(parseInt(invoiceId));
    if (!invoice) {
      return res.status(404).json({ error: 'Fatura bulunamadı' });
    }
    res.json(invoice);
  } catch (error) {
    console.error('Fatura getirme hatası:', error);
    res.status(500).json({ error: 'Fatura yüklenirken bir hata oluştu' });
  }
};

export const updateInvoiceStatus = async (req: Request, res: Response) => {
  try {
    const { invoiceId } = req.params;
    const { status } = req.body;
    const userId = req.user?.userId;
    
    if (!userId) {
      return res.status(401).json({ error: 'Yetkilendirme gerekli' });
    }

    const invoice = await invoiceService.updateStatus(parseInt(invoiceId), status);
    res.json(invoice);
  } catch (error) {
    console.error('Fatura durumu güncelleme hatası:', error);
    res.status(500).json({ error: 'Fatura durumu güncellenirken bir hata oluştu' });
  }
};

// Proje işlemleri
export const getProjects = async (req: Request, res: Response) => {
  try {
    const { customerId } = req.params;
    const userId = req.user?.userId;
    
    if (!userId) {
      return res.status(401).json({ error: 'Yetkilendirme gerekli' });
    }

    // Sadece müşteriye ait projeleri getir
    const projects = await prisma.project.findMany({
      where: { 
        customerId: parseInt(customerId)
      },
      include: {
        tasks: {
          select: {
            id: true,
            title: true,
            status: true,
            dueDate: true
          }
        },
        owner: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      },
      orderBy: {
        updatedAt: 'desc'
      }
    });

    res.json(projects);
  } catch (error) {
    console.error('Projeler getirilemedi:', error);
    res.status(500).json({ error: 'Projeler yüklenirken bir hata oluştu' });
  }
};

export const createProject = async (req: Request, res: Response) => {
  try {
    const { customerId } = req.params;
    const userId = req.user?.userId;
    const { name, description } = req.body;
    
    if (!userId) {
      return res.status(401).json({ error: 'Yetkilendirme gerekli' });
    }

    const project = await prisma.project.create({
      data: {
        name,
        description,
        customerId: parseInt(customerId),
        ownerId: userId
      },
      include: {
        tasks: true,
        owner: true
      }
    });

    res.status(201).json(project);
  } catch (error) {
    console.error('Proje oluşturulamadı:', error);
    res.status(500).json({ error: 'Proje oluşturulurken bir hata oluştu' });
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
        OR: [
          { userId },
          { project: { customer: { sharedWith: { some: { id: userId } } } } }
        ]
      },
      include: {
        user: true,
        creator: true,
        subtasks: true
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json(tasks);
  } catch (error) {
    console.error('Görevler getirilemedi:', error);
    res.status(500).json({ error: 'Görevler yüklenirken bir hata oluştu' });
  }
}; 