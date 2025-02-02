import express from 'express';
import { getAllUsers, getUserById } from '../controllers/user.controller';
import { authMiddleware } from '../middlewares/auth.middleware';

const router = express.Router();

// Tüm kullanıcıları getir
router.get('/', authMiddleware, getAllUsers);

// ID'ye göre kullanıcı getir
router.get('/:id', authMiddleware, getUserById);

export default router; 