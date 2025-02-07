export interface CreateProjectDTO {
  name: string;
  description?: string;
  isPrivate: boolean;
  customerId?: number;
}

export interface UpdateProjectDTO {
  name?: string;
  description?: string;
  isPrivate?: boolean;
}

export interface ProjectResponse {
  id: number;
  name: string;
  description: string | null;
  isPrivate: boolean;
  createdAt: Date;
  updatedAt: Date;
  ownerId: number;
  owner: {
    id: number;
    name: string;
    email: string;
  };
  _count?: {
    tasks: number;
  };
}

export interface ProjectListResponse {
  projects: ProjectResponse[];
  total: number;
  page: number;
  limit: number;
}

export interface ProjectQueryParams {
  page?: string;
  limit?: string;
  search?: string;
  isPrivate?: string;
} 