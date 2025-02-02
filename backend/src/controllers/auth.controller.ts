import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import jwt from 'jsonwebtoken';
import { hashPassword, comparePasswords } from '../utils/password.utils';
import { RegisterDTO, LoginDTO, AuthResponse } from '../types/auth.types';

const prisma = new PrismaClient();

export const register = async (req: Request, res: Response) => {
  try {
    console.log('Register isteği:', req.body);
    const { email, password, name }: RegisterDTO = req.body;

    if (!email || !password || !name) {
      return res.status(400).json({ error: 'Tüm alanlar zorunludur' });
    }

    // Email kontrolü
    const existingUser = await prisma.user.findUnique({
      where: { email }
    });

    if (existingUser) {
      return res.status(400).json({ error: 'Bu email adresi zaten kullanımda' });
    }

    // Şifreyi hash'le
    const hashedPassword = await hashPassword(password);

    // Kullanıcıyı oluştur
    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name,
        role: 'USER'
      }
    });

    // JWT token oluştur
    const token = jwt.sign(
      { userId: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET as string,
      { expiresIn: '24h' }
    );

    const response: AuthResponse = {
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role
      }
    };

    console.log('Kullanıcı başarıyla kaydedildi:', {
      userId: user.id,
      email: user.email,
      role: user.role
    });

    res.status(201).json(response);
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ error: 'Kayıt işlemi başarısız oldu' });
  }
};

export const login = async (req: Request, res: Response) => {
  try {
    console.log('Login isteği:', {
      body: req.body,
      headers: req.headers
    });

    const { email, password }: LoginDTO = req.body;

    if (!email || !password) {
      console.log('Email veya şifre eksik');
      return res.status(400).json({ error: 'Email ve şifre zorunludur' });
    }

    // Kullanıcıyı bul
    const user = await prisma.user.findUnique({
      where: { email }
    });

    console.log('Kullanıcı arama sonucu:', {
      found: !!user,
      email
    });

    if (!user) {
      return res.status(401).json({ error: 'Geçersiz email veya şifre' });
    }

    // Şifreyi kontrol et
    const isPasswordValid = await comparePasswords(password, user.password);

    console.log('Şifre kontrolü:', {
      isValid: isPasswordValid,
      userId: user.id
    });

    if (!isPasswordValid) {
      return res.status(401).json({ error: 'Geçersiz email veya şifre' });
    }

    // JWT token oluştur
    const token = jwt.sign(
      { userId: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET as string,
      { expiresIn: '24h' }
    );

    const response: AuthResponse = {
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role
      }
    };

    console.log('Başarılı giriş:', {
      userId: user.id,
      email: user.email,
      role: user.role
    });

    res.json(response);
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Giriş işlemi başarısız oldu' });
  }
};

export const me = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.userId;

    if (!userId) {
      return res.status(401).json({ error: 'Yetkilendirme gerekli' });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
      }
    });

    if (!user) {
      return res.status(404).json({ error: 'Kullanıcı bulunamadı' });
    }

    res.json(user);
  } catch (error) {
    console.error('Kullanıcı bilgileri alınamadı:', error);
    res.status(500).json({ error: 'Kullanıcı bilgileri alınırken bir hata oluştu' });
  }
}; 