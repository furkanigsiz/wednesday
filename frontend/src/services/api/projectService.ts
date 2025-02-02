import { Project } from '../../types';
import { api } from './api';

interface ProjectListResponse {
  projects: Project[];
  total: number;
  page: number;
  limit: number;
}

interface ProjectResponse {
  data: Project;
}

export const projectService = {
  getAll: async (): Promise<Project[]> => {
    try {
      const response = await api.get<ProjectListResponse>('/projects');
      console.log('API isteği yapıldı');
      console.log('API yanıtı (ham):', response);
      console.log('API yanıtı (data):', response.data);
      console.log('Projeler:', response.data.projects);
      
      if (!response.data.projects) {
        console.warn('API yanıtında projects array\'i bulunamadı');
        return [];
      }
      
      return response.data.projects;
    } catch (error) {
      console.error('API hatası:', error);
      throw error;
    }
  },

  getById: async (id: number): Promise<Project> => {
    const response = await api.get<Project>(`/projects/${id}`);
    return response.data;
  },

  create: async (data: Omit<Project, 'id' | 'createdAt' | 'updatedAt'>): Promise<Project> => {
    const response = await api.post<Project>('/projects', data);
    return response.data;
  },

  update: async (id: number, data: Partial<Project>): Promise<Project> => {
    const response = await api.put<Project>(`/projects/${id}`, data);
    return response.data;
  },

  delete: async (id: number): Promise<void> => {
    await api.delete(`/projects/${id}`);
  },
}; 