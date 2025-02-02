import { User } from './user.types';
import { Project } from './project.types';

export type CustomerStatus = 'LEAD' | 'CONTACT' | 'OPPORTUNITY' | 'CUSTOMER' | 'INACTIVE';
export type InteractionType = 'EMAIL' | 'PHONE' | 'MEETING' | 'NOTE';

export interface Customer {
  id: number;
  name: string;
  company?: string;
  email: string;
  phone?: string;
  role?: string;
  status: CustomerStatus;
  projects?: Project[];
  interactions?: Interaction[];
  createdAt: Date;
  updatedAt: Date;
  createdBy: User;
  userId: number;
}

export interface Interaction {
  id: number;
  type: InteractionType;
  content: string;
  customer: Customer;
  customerId: number;
  createdBy: User;
  userId: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface CustomerFormData {
  name: string;
  company?: string;
  email: string;
  phone?: string;
  role?: string;
  status: CustomerStatus;
}

export interface InteractionFormData {
  type: InteractionType;
  content: string;
  customerId: number;
} 