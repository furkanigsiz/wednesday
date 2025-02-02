export type Role = 'ADMIN' | 'USER';
export type TaskStatus = 'NOT_STARTED' | 'IN_PROGRESS' | 'STUCK' | 'COMPLETED';
export type TaskPriority = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';

export interface User {
  id: number;
  name: string;
  email: string;
  role: Role;
  customers?: Customer[];
  interactions?: Interaction[];
}

export interface Project {
  id: number;
  name: string;
  description?: string;
  ownerId: number;
  tasks: Task[];
  customer?: Customer;
  customerId?: number;
}

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
  notes: string;
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
  notes: string;
  customerId: number;
}

export interface Task {
  id: number;
  title: string;
  description?: string;
  status: TaskStatus;
  priority: TaskPriority;
  dueDate?: Date;
  projectId: number;
  project: Project;
  userId?: number;
  assignedTo?: User;
  subtasks?: Subtask[];
  notes?: Note[];
  files?: TaskFile[];
}

export interface Subtask {
  id: number;
  title: string;
  completed: boolean;
  taskId: number;
  task: Task;
  createdAt: Date;
  updatedAt: Date;
}

export interface Note {
  id: number;
  content: string;
  taskId: number;
  task: Task;
  userId: number;
  user: User;
  createdAt: Date;
  updatedAt: Date;
}

export interface TaskFile {
  id: number;
  filename: string;
  path: string;
  publicUrl: string;
  mimeType: string;
  size: number;
  taskId: number;
  task: Task;
  userId: number;
  user: User;
  createdAt: Date;
} 