import { PrismaClient, Customer as PrismaCustomer } from '@prisma/client';
import { Customer, CustomerFormData } from '../types';

const prisma = new PrismaClient();

const mapPrismaCustomerToCustomer = (prismaCustomer: PrismaCustomer & {
  projects?: any[];
  interactions?: any[];
  createdBy?: any;
  sharedWith?: any[];
}): Customer => ({
  id: prismaCustomer.id,
  name: prismaCustomer.name,
  company: prismaCustomer.company || undefined,
  email: prismaCustomer.email,
  phone: prismaCustomer.phone || undefined,
  role: prismaCustomer.role || undefined,
  status: prismaCustomer.status,
  projects: prismaCustomer.projects,
  interactions: prismaCustomer.interactions,
  createdAt: prismaCustomer.createdAt,
  updatedAt: prismaCustomer.updatedAt,
  createdBy: prismaCustomer.createdBy,
  userId: prismaCustomer.userId,
});

export const customerService = {
  async getAll(userId: number): Promise<Customer[]> {
    const customers = await prisma.customer.findMany({
      where: {
        OR: [
          { userId },
          { sharedWith: { some: { id: userId } } }
        ]
      },
      include: {
        projects: true,
        interactions: true,
        createdBy: true,
        sharedWith: true,
      },
    });

    return customers.map(mapPrismaCustomerToCustomer);
  },

  async getById(id: number, userId: number): Promise<Customer | null> {
    const customer = await prisma.customer.findFirst({
      where: {
        id,
        OR: [
          { userId },
          { sharedWith: { some: { id: userId } } }
        ]
      },
      include: {
        projects: true,
        interactions: true,
        createdBy: true,
        sharedWith: true,
      },
    });

    if (!customer) {
      throw new Error('Müşteri bulunamadı veya erişim izniniz yok');
    }

    return mapPrismaCustomerToCustomer(customer);
  },

  async create(data: CustomerFormData, userId: number): Promise<Customer> {
    const customer = await prisma.customer.create({
      data: {
        ...data,
        userId,
      },
      include: {
        projects: true,
        interactions: true,
        createdBy: true,
        sharedWith: true,
      },
    });

    return mapPrismaCustomerToCustomer(customer);
  },

  async update(id: number, data: Partial<CustomerFormData>, userId: number): Promise<Customer> {
    // Önce müşterinin var olduğunu ve kullanıcının erişim izninin olduğunu kontrol et
    const existingCustomer = await this.getById(id, userId);
    
    if (!existingCustomer) {
      throw new Error('Müşteri bulunamadı veya erişim izniniz yok');
    }

    const customer = await prisma.customer.update({
      where: { id },
      data,
      include: {
        projects: true,
        interactions: true,
        createdBy: true,
        sharedWith: true,
      },
    });

    return mapPrismaCustomerToCustomer(customer);
  },

  async delete(id: number, userId: number): Promise<void> {
    // Önce müşterinin var olduğunu ve kullanıcının sahibi olduğunu kontrol et
    const customer = await prisma.customer.findFirst({
      where: {
        id,
        userId, // Sadece sahibi silebilir
      },
    });

    if (!customer) {
      throw new Error('Müşteri bulunamadı veya silme yetkiniz yok');
    }

    await prisma.customer.delete({
      where: { id },
    });
  },

  async shareWith(customerId: number, userId: number, targetUserId: number): Promise<Customer> {
    // Önce müşterinin var olduğunu ve kullanıcının sahibi olduğunu kontrol et
    const existingCustomer = await prisma.customer.findFirst({
      where: {
        id: customerId,
        userId, // Sadece sahibi paylaşabilir
      },
    });

    if (!existingCustomer) {
      throw new Error('Müşteri bulunamadı veya paylaşma yetkiniz yok');
    }

    const customer = await prisma.customer.update({
      where: { id: customerId },
      data: {
        sharedWith: {
          connect: { id: targetUserId },
        },
      },
      include: {
        projects: true,
        interactions: true,
        createdBy: true,
        sharedWith: true,
      },
    });

    return mapPrismaCustomerToCustomer(customer);
  },

  async removeShare(customerId: number, userId: number, targetUserId: number): Promise<Customer> {
    // Önce müşterinin var olduğunu ve kullanıcının sahibi olduğunu kontrol et
    const existingCustomer = await prisma.customer.findFirst({
      where: {
        id: customerId,
        userId, // Sadece sahibi paylaşımı kaldırabilir
      },
    });

    if (!existingCustomer) {
      throw new Error('Müşteri bulunamadı veya paylaşım kaldırma yetkiniz yok');
    }

    const customer = await prisma.customer.update({
      where: { id: customerId },
      data: {
        sharedWith: {
          disconnect: { id: targetUserId },
        },
      },
      include: {
        projects: true,
        interactions: true,
        createdBy: true,
        sharedWith: true,
      },
    });

    return mapPrismaCustomerToCustomer(customer);
  },
}; 