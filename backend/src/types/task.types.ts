import { Status, Priority } from '@prisma/client';

export interface CreateTaskDTO {
  title: string;
  description?: string;
  status: Status;
  priority: Priority;
  projectId: number;
  userId?: number;
  dueDate?: string;
}

export interface UpdateTaskDTO {
  title?: string;
  description?: string;
  status?: Status;
  priority?: Priority;
  projectId?: number;
  userId?: number;
  dueDate?: string;
}

export interface TaskResponse {
  id: number;
  title: string;
  description: string | null;
  status: string;
  priority: string;
  dueDate: Date | null;
  createdAt: Date;
  updatedAt: Date;
  projectId: number;
  userId: number;
  project: {
    id: number;
    name: string;
  };
  assignedTo: {
    id: number;
    name: string;
    email: string;
  };
}

export interface TaskListResponse {
  tasks: TaskResponse[];
  total: number;
  page: number;
  limit: number;
}

export interface TaskQueryParams {
  page?: string;
  limit?: string;
  status?: Status;
  priority?: Priority;
  projectId?: string;
  search?: string;
  userId?: string;
  dueBefore?: string;
  dueAfter?: string;
}

export interface TaskFile {
  id: number;
  createdAt: Date;
  updatedAt: Date;
  taskId: number;
  userId: number;
  filename: string;
  filePath: string;
  mimeType: string;
  size: number;
}

// Multer ile gelen dosya tipini genişlet
declare global {
  namespace Express {
    interface Request {
      file?: {
        fieldname: string;
        originalname: string;
        encoding: string;
        mimetype: string;
        size: number;
        destination: string;
        filename: string;
        path: string;
        buffer: Buffer;
      };
    }
  }
} 