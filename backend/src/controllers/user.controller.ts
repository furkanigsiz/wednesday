import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const getAllUsers = async (req: Request, res: Response) => {
  try {
    console.log('Tüm kullanıcılar istendi');
    
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        // Hassas bilgileri göndermiyoruz
        password: false
      }
    });

    console.log(`${users.length} kullanıcı bulundu`);
    res.json(users);
  } catch (error) {
    console.error('Kullanıcıları getirme hatası:', error);
    res.status(500).json({ error: 'Kullanıcılar yüklenirken bir hata oluştu' });
  }
};

export const getUserById = async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    
    if (isNaN(id)) {
      return res.status(400).json({ error: 'Geçersiz kullanıcı ID' });
    }
    
    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        password: false
      }
    });

    if (!user) {
      return res.status(404).json({ error: 'Kullanıcı bulunamadı' });
    }

    res.json(user);
  } catch (error) {
    console.error('Kullanıcı getirme hatası:', error);
    res.status(500).json({ error: 'Kullanıcı yüklenirken bir hata oluştu' });
  }
}; 