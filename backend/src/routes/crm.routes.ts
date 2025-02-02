import express from 'express';
import * as customerController from '../controllers/customer.controller';
import * as interactionController from '../controllers/interaction.controller';
import { authMiddleware } from '../middlewares/auth.middleware';

const router = express.Router();

// Müşteri route'ları
router.get('/customers', authMiddleware, customerController.getAll);
router.get('/customers/:id', authMiddleware, customerController.getById);
router.post('/customers', authMiddleware, customerController.create);
router.put('/customers/:id', authMiddleware, customerController.update);
router.delete('/customers/:id', authMiddleware, customerController.deleteCustomer);

// Müşteri paylaşım route'ları
router.post('/customers/:id/share', authMiddleware, customerController.shareCustomer);
router.delete('/customers/:id/share', authMiddleware, customerController.removeShare);

// Etkileşim route'ları
router.get('/customers/:customerId/interactions', authMiddleware, interactionController.getAll);
router.post('/customers/:customerId/interactions', authMiddleware, interactionController.create);
router.put('/customers/:customerId/interactions/:id', authMiddleware, interactionController.update);
router.delete('/customers/:customerId/interactions/:id', authMiddleware, interactionController.deleteInteraction);

// Fatura işlemleri
router.get('/customers/:customerId/invoices', authMiddleware, customerController.getInvoices);
router.post('/customers/:customerId/invoices', authMiddleware, customerController.createInvoice);
router.get('/invoices/:invoiceId', authMiddleware, customerController.getInvoiceById);
router.post('/invoices/:invoiceId/payments', authMiddleware, customerController.createPayment);
router.patch('/invoices/:invoiceId/status', authMiddleware, customerController.updateInvoiceStatus);

export default router; 