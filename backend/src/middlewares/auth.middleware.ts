import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

declare global {
  namespace Express {
    interface Request {
      user?: {
        userId: number;
        email: string;
        role: string;
      };
    }
  }
}

export const authMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    // CORS için OPTIONS isteklerini geçir
    if (req.method === 'OPTIONS') {
      return next();
    }

    const token = req.headers.authorization?.split(' ')[1];

    if (!token) {
      return res.status(401).json({ error: 'Yetkilendirme token\'ı bulunamadı' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as {
      userId: number;
      email: string;
      role: string;
    };

    req.user = decoded;

    console.log('Auth Middleware:', {
      path: req.path,
      method: req.method,
      userId: decoded.userId,
      email: decoded.email
    });

    next();
  } catch (error) {
    console.error('Auth middleware hatası:', error);
    return res.status(401).json({ error: 'Geçersiz token' });
  }
};

export const isAdmin = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  if (req.user?.role !== 'ADMIN') {
    return res.status(403).json({ error: 'Bu işlem için admin yetkisi gerekli' });
  }
  next();
}; 