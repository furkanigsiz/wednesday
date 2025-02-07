export interface User {
  id: number;
  name: string;
  email: string;
}

export interface Project {
  id: number;
  name: string;
  description: string;
  isPrivate: boolean;
  createdAt: string;
  updatedAt: string;
  ownerId: number;
  owner: User;
  customerId?: number;
  customer?: Customer;
  isOwner: boolean;
  tasks?: Task[];
}

export type TaskStatus = 'NOT_STARTED' | 'IN_PROGRESS' | 'STUCK' | 'COMPLETED';
export type TaskPriority = 'CRITICAL' | 'HIGH' | 'NORMAL' | 'LOW';

export interface Subtask {
  id: number;
  title: string;
  completed: boolean;
  createdAt: string;
  updatedAt: string;
  taskId: number;
  task: {
    userId: number;
    project: {
      ownerId: number;
    };
  };
}

export interface Note {
  id: number;
  content: string;
  createdAt: string;
  updatedAt: string;
  userId: number;
  taskId: number;
  user: User;
  task: {
    userId: number;
    project: {
      ownerId: number;
    };
  };
}

export interface TaskFile {
  id: number;
  taskId: number;
  userId: number;
  filename: string;
  filePath: string;
  mimeType: string;
  size: number;
  publicUrl?: string;
  createdAt: string;
  user?: User;
}

export interface Task {
  id: number;
  title: string;
  description?: string;
  status: TaskStatus;
  priority: TaskPriority;
  dueDate?: Date;
  projectId: number;
  userId?: number;
  createdAt: Date;
  updatedAt: Date;
  project?: Project;
  user?: User;
  subtasks?: Subtask[];
  notes?: Note[];
  files?: TaskFile[];
  projectName?: string;
  projectOwner?: {
    id: number;
    name: string;
  };
  assignedTo?: {
    id: number;
    name: string;
  };
  createdBy?: string;
}

export interface DashboardSummary {
  projects: {
    total: number;
    private: number;
    public: number;
  };
  tasks: {
    total: number;
    completed: number;
    inProgress: number;
    notStarted: number;
    stuck: number;
    overdue: number;
  };
  tasksByPriority: {
    critical: number;
    high: number;
    normal: number;
    low: number;
  };
}

export interface AuthResponse {
  token: string;
  user: {
    id: number;
    name: string;
    email: string;
    role: string;
  };
}

export interface ApiError {
  message: string;
  statusCode?: number;
}

// Chart.js ve react-chartjs-2 için tip tanımlamaları @types paketlerinden geliyor

export interface ApiError {
  message: string;
  statusCode?: number;
}

// CRM Types
export type CustomerStatus = 'LEAD' | 'CONTACT' | 'OPPORTUNITY' | 'CUSTOMER' | 'INACTIVE';
export type InteractionType = 'PHONE' | 'EMAIL' | 'MEETING' | 'NOTE';

export interface Customer {
  id: number;
  name: string;
  email: string;
  phone: string;
  address: string;
  status: CustomerStatus;
  notes: string;
  userId: number;
  company?: string;
  role?: string;
  sharedWith?: User[];
  createdAt: string;
  updatedAt: string;
}

export interface Interaction {
  id: number;
  type: InteractionType;
  notes: string;
  customerId: number;
  userId: number;
  createdAt: string;
  updatedAt: string;
  createdBy: User;
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
  customerId: number;
  type: InteractionType;
  notes: string;
} 