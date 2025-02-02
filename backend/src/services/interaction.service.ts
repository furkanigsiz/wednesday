import { PrismaClient, Interaction as PrismaInteraction } from '@prisma/client';
import { Interaction, InteractionFormData } from '../types';

const prisma = new PrismaClient();

const mapPrismaInteractionToInteraction = (prismaInteraction: PrismaInteraction & {
  customer?: any;
  createdBy?: any;
}): Interaction => ({
  id: prismaInteraction.id,
  type: prismaInteraction.type,
  notes: prismaInteraction.notes,
  customerId: prismaInteraction.customerId,
  userId: prismaInteraction.userId,
  createdAt: prismaInteraction.createdAt,
  updatedAt: prismaInteraction.updatedAt,
  customer: prismaInteraction.customer,
  createdBy: prismaInteraction.createdBy,
});

const getAll = async (customerId: number): Promise<Interaction[]> => {
  const interactions = await prisma.interaction.findMany({
    where: { customerId },
    include: {
      customer: true,
      createdBy: true,
    },
    orderBy: {
      createdAt: 'desc',
    },
  });

  return interactions.map(mapPrismaInteractionToInteraction);
};

const create = async (data: InteractionFormData, userId: number): Promise<Interaction> => {
  const interaction = await prisma.interaction.create({
    data: {
      type: data.type,
      notes: data.notes,
      customerId: data.customerId,
      userId,
    },
    include: {
      customer: true,
      createdBy: true,
    },
  });

  return mapPrismaInteractionToInteraction(interaction);
};

const deleteInteraction = async (id: number): Promise<void> => {
  await prisma.interaction.delete({
    where: { id },
  });
};

const update = async (id: number, data: InteractionFormData): Promise<Interaction> => {
  const interaction = await prisma.interaction.update({
    where: { id },
    data: {
      type: data.type,
      notes: data.notes,
      customerId: data.customerId,
    },
    include: {
      customer: {
        include: {
          createdBy: true
        }
      },
      createdBy: {
        select: {
          id: true,
          name: true,
          email: true
        }
      }
    }
  });

  return mapPrismaInteractionToInteraction(interaction);
};

export const interactionService = {
  getAll,
  create,
  delete: deleteInteraction,
  update
}; 