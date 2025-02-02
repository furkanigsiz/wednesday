import { Request, Response } from 'express';
import { interactionService } from '../services/interaction.service';
import { InteractionFormData } from '../types';

export const getAll = async (req: Request, res: Response) => {
  try {
    const customerId = parseInt(req.params.customerId);
    const interactions = await interactionService.getAll(customerId);
    res.json(interactions);
  } catch (error) {
    console.error('Etkileşimleri getirme hatası:', error);
    res.status(500).json({ error: 'Etkileşimler yüklenirken bir hata oluştu' });
  }
};

export const create = async (req: Request, res: Response) => {
  try {
    const data: InteractionFormData = req.body;
    const userId = req.user?.userId;
    
    if (!userId) {
      return res.status(401).json({ error: 'Yetkilendirme gerekli' });
    }

    const interaction = await interactionService.create(data, userId);
    res.status(201).json(interaction);
  } catch (error) {
    console.error('Etkileşim oluşturma hatası:', error);
    res.status(500).json({ error: 'Etkileşim oluşturulurken bir hata oluştu' });
  }
};

export const deleteInteraction = async (req: Request, res: Response) => {
  try {
    await interactionService.delete(parseInt(req.params.id));
    res.status(204).send();
  } catch (error) {
    console.error('Etkileşim silme hatası:', error);
    res.status(500).json({ error: 'Etkileşim silinirken bir hata oluştu' });
  }
};

export const update = async (req: Request, res: Response) => {
  try {
    const interactionId = parseInt(req.params.id);
    const data = req.body;
    const userId = req.user?.userId;
    
    if (!userId) {
      return res.status(401).json({ error: 'Yetkilendirme gerekli' });
    }

    const interaction = await interactionService.update(interactionId, data);
    res.json(interaction);
  } catch (error) {
    console.error('Etkileşim güncelleme hatası:', error);
    res.status(500).json({ error: 'Etkileşim güncellenirken bir hata oluştu' });
  }
}; 