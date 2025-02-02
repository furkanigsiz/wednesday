import { PrismaClient, InvoiceStatus } from '@prisma/client';

const prisma = new PrismaClient();

export const invoiceService = {
  getAll: async (customerId: number) => {
    return prisma.invoice.findMany({
      where: { customerId },
      include: {
        items: true,
        payments: true
      },
      orderBy: { createdAt: 'desc' }
    });
  },

  getById: async (invoiceId: number) => {
    return prisma.invoice.findUnique({
      where: { id: invoiceId },
      include: {
        items: true,
        payments: true,
        customer: true
      }
    });
  },

  create: async (customerId: number, userId: number, data: any) => {
    const { items, dueDate, notes } = data;

    return prisma.invoice.create({
      data: {
        number: `INV-${Date.now()}`,
        customerId,
        userId,
        dueDate: new Date(dueDate),
        notes,
        totalAmount: items.reduce((sum: number, item: any) => sum + (item.quantity * item.unitPrice), 0),
        items: {
          create: items.map((item: any) => ({
            description: item.description,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            totalPrice: item.quantity * item.unitPrice
          }))
        }
      },
      include: {
        items: true,
        customer: true
      }
    });
  },

  createPayment: async (invoiceId: number, userId: number, data: any) => {
    const { amount, method, reference, notes } = data;

    // Önce faturanın var olduğunu kontrol et
    const invoice = await prisma.invoice.findUnique({
      where: { id: invoiceId },
      include: { payments: true }
    });

    if (!invoice) {
      throw new Error('Fatura bulunamadı');
    }

    // Ödeme tutarının fatura tutarını aşıp aşmadığını kontrol et
    const totalPaid = invoice.payments.reduce((sum, p) => sum + p.amount, 0);
    const remainingAmount = invoice.totalAmount - totalPaid;

    if (amount > remainingAmount) {
      throw new Error('Ödeme tutarı kalan fatura tutarını aşamaz');
    }

    // Ödemeyi oluştur
    const payment = await prisma.payment.create({
      data: {
        invoiceId,
        userId,
        amount,
        method,
        reference,
        notes,
        status: 'COMPLETED'
      }
    });

    // Fatura durumunu güncelle
    const newTotalPaid = totalPaid + amount;
    const newStatus = newTotalPaid >= invoice.totalAmount ? 'PAID' : 'PARTIALLY_PAID';
    
    await prisma.invoice.update({
      where: { id: invoiceId },
      data: { status: newStatus }
    });

    return payment;
  },

  updateStatus: async (invoiceId: number, status: InvoiceStatus) => {
    // Faturanın mevcut durumunu kontrol et
    const invoice = await prisma.invoice.findUnique({
      where: { id: invoiceId },
      include: { payments: true }
    });

    if (!invoice) {
      throw new Error('Fatura bulunamadı');
    }

    // Eğer fatura ödenmişse durumu değiştirmeye izin verme
    if (invoice.status === 'PAID') {
      throw new Error('Ödenmiş faturanın durumu değiştirilemez');
    }

    // Durumu güncelle
    return prisma.invoice.update({
      where: { id: invoiceId },
      data: { status },
      include: {
        items: true,
        payments: true
      }
    });
  }
}; 