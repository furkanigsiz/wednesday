import axios from 'axios';
import { 
  AuthResponse, 
  Project, 
  Task, 
  User, 
  Note, 
  TaskFile,
  Subtask,
  Customer,
  Interaction,
  CustomerFormData,
  InteractionFormData
  // DashboardSummary ve Subtask'ı kaldırıyoruz çünkü kullanılmıyor
} from '../types';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3000/api';

export const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  },
  withCredentials: true,
  timeout: 30000,
  timeoutErrorMessage: 'Sunucu yanıt vermedi. Lütfen internet bağlantınızı kontrol edin veya daha sonra tekrar deneyin.'
});

// Request interceptor - token ekleme
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    console.log('Request Config:', {
      url: config.url,
      method: config.method,
      headers: config.headers,
      data: config.data
    });
    return config;
  },
  (error) => {
    console.error('Request interceptor error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor - hata işleme
api.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('API Error:', {
      message: error.message,
      response: error.response?.data,
      status: error.response?.status,
      path: error.config?.url
    });
    
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    
    return Promise.reject(error);
  }
);

// Auth servisleri
export const authService = {
  login: async (email: string, password: string): Promise<AuthResponse> => {
    try {
      console.log('Login isteği gönderiliyor:', { email });
      const response = await api.post<AuthResponse>('/api/auth/login', { email, password });
      console.log('Login yanıtı:', response.data);
      
      // Token'ı localStorage'a kaydet
      if (response.data.token) {
        localStorage.setItem('token', response.data.token);
      }
      
      return response.data;
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  },
  register: async (name: string, email: string, password: string): Promise<AuthResponse> => {
    try {
      console.log('Register isteği gönderiliyor:', { name, email });
      const response = await api.post<AuthResponse>('/api/auth/register', { name, email, password });
      console.log('Register yanıtı:', response.data);
      
      // Token'ı localStorage'a kaydet
      if (response.data.token) {
        localStorage.setItem('token', response.data.token);
      }
      
      return response.data;
    } catch (error) {
      console.error('Register error:', error);
      throw error;
    }
  },
  me: async (): Promise<User> => {
    const response = await api.get<User>('/api/auth/me');
    return response.data;
  },
  logout: () => {
    localStorage.removeItem('token');
  },
  getToken: (): string | null => {
    return localStorage.getItem('token');
  },
  isAuthenticated: (): boolean => {
    return !!localStorage.getItem('token');
  }
};

// Dashboard servisleri
export const dashboardService = {
  getSummary: async () => {
    try {
      const response = await api.get('/api/dashboard/summary');
      return response.data;
    } catch (error) {
      console.error('Dashboard summary error:', error);
      throw error;
    }
  },

  getDashboardStats: async () => {
    try {
      const response = await api.get('/api/dashboard/stats');
      return response.data;
    } catch (error) {
      console.error('Dashboard stats error:', error);
      throw error;
    }
  },

  getUserTasks: async () => {
    try {
      const response = await api.get('/api/dashboard/users/tasks');
      return response.data;
    } catch (error) {
      console.error('User tasks error:', error);
      throw error;
    }
  },

  getProjectProgress: async (projectId: number) => {
    try {
      const response = await api.get(`/api/dashboard/projects/${projectId}/progress`);
      return response.data;
    } catch (error) {
      console.error('Project progress error:', error);
      throw error;
    }
  },

  getTaskDistribution: async () => {
    try {
      const response = await api.get('/api/dashboard/task-distribution');
      return response.data;
    } catch (error) {
      console.error('Task distribution error:', error);
      throw error;
    }
  },

  getOverdueTasks: async () => {
    try {
      const response = await api.get('/api/dashboard/overdue-tasks');
      return response.data;
    } catch (error) {
      console.error('Overdue tasks error:', error);
      throw error;
    }
  }
};

// Proje servisleri
export const projectService = {
  getAll: async (): Promise<Project[]> => {
    try {
      const response = await api.get<{projects: Project[], total: number, page: number, limit: number}>('/api/projects');
      console.log('GetAll Response:', response.data);
      return response.data.projects;
    } catch (error) {
      console.error('GetAll Error:', error);
      throw error;
    }
  },
  getById: async (id: number): Promise<Project> => {
    try {
      const response = await api.get<Project>(`/api/projects/${id}`);
      return response.data;
    } catch (error) {
      console.error('GetById Error:', error);
      throw error;
    }
  },
  create: async (data: Partial<Project>): Promise<Project> => {
    try {
      console.log('Creating project with data:', data);
      const response = await api.post<Project>('/api/projects', data);
      console.log('Create Response:', response.data);
      return response.data;
    } catch (error) {
      console.error('Create Error:', error);
      throw error;
    }
  },
  update: async (id: number, data: Partial<Project>): Promise<Project> => {
    try {
      const response = await api.put<Project>(`/api/projects/${id}`, data);
      return response.data;
    } catch (error) {
      console.error('Update Error:', error);
      throw error;
    }
  },
  delete: async (id: number): Promise<void> => {
    try {
      await api.delete(`/api/projects/${id}`);
    } catch (error) {
      console.error('Delete Error:', error);
      throw error;
    }
  },
};

interface TasksResponse {
  tasks: Task[];
  total: number;
  page: number;
  limit: number;
}

// Görev servisleri
export const taskService = {
  getAll: async (): Promise<TasksResponse> => {
    const response = await api.get<TasksResponse>('/api/tasks');
    return response.data;
  },
  getById: async (id: number): Promise<Task> => {
    const response = await api.get<Task>(`/api/tasks/${id}`);
    return response.data;
  },
  create: async (data: Partial<Task>): Promise<Task> => {
    const response = await api.post<Task>('/api/tasks', data);
    return response.data;
  },
  update: async (id: number, data: Partial<Task>): Promise<Task> => {
    const response = await api.put<Task>(`/api/tasks/${id}`, data);
    return response.data;
  },
  delete: async (id: number): Promise<void> => {
    await api.delete(`/api/tasks/${id}`);
  },
  getProjectTasks: async (projectId: number): Promise<TasksResponse> => {
    const response = await api.get<TasksResponse>(`/api/projects/${projectId}/tasks`);
    return response.data;
  },
};

// Kullanıcı servisleri
export const userService = {
  getAll: async (): Promise<User[]> => {
    const response = await api.get<User[]>('/api/users');
    return response.data;
  },
};

// Not servisleri
export const noteService = {
  getAll: async (taskId: number): Promise<Note[]> => {
    const response = await api.get<Note[]>(`/api/tasks/${taskId}/notes`);
    return response.data;
  },
  create: async (taskId: number, content: string): Promise<Note> => {
    const response = await api.post<Note>(`/api/tasks/${taskId}/notes`, { content });
    return response.data;
  },
  update: async (taskId: number, noteId: number, content: string): Promise<Note> => {
    const response = await api.put<Note>(`/api/tasks/${taskId}/notes/${noteId}`, { content });
    return response.data;
  },
  delete: async (taskId: number, noteId: number): Promise<void> => {
    await api.delete(`/api/tasks/${taskId}/notes/${noteId}`);
  },
};

// Dosya servisleri
export const fileService = {
  upload: async (taskId: number, file: File): Promise<TaskFile> => {
    const formData = new FormData();
    formData.append('file', file);

    const response = await api.post<TaskFile>(
      `/api/tasks/${taskId}/files`,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    );
    return response.data;
  },
  download: async (taskId: number, fileId: number): Promise<Blob> => {
    const response = await api.get<Blob>(`/api/tasks/${taskId}/files/${fileId}/download`, {
      responseType: 'blob',
    });
    return response.data;
  },
  delete: async (taskId: number, fileId: number): Promise<void> => {
    await api.delete(`/api/tasks/${taskId}/files/${fileId}`);
  },
};

// Subtask servisleri
export const subtaskService = {
  getAll: async (taskId: number): Promise<Subtask[]> => {
    const response = await api.get<Subtask[]>(`/api/tasks/${taskId}/subtasks`);
    return response.data;
  },
  
  create: async (taskId: number, title: string): Promise<Subtask> => {
    const response = await api.post<Subtask>(`/api/tasks/${taskId}/subtasks`, { title });
    return response.data;
  },
  
  update: async (taskId: number, subtaskId: number, data: { title?: string; completed?: boolean }): Promise<Subtask> => {
    const response = await api.put<Subtask>(`/api/tasks/${taskId}/subtasks/${subtaskId}`, data);
    return response.data;
  },
  
  delete: async (taskId: number, subtaskId: number): Promise<void> => {
    await api.delete(`/api/tasks/${taskId}/subtasks/${subtaskId}`);
  }
};

// CRM servisleri
export const customerService = {
  getAll: async (): Promise<Customer[]> => {
    const response = await api.get<Customer[]>('/api/crm/customers');
    return response.data;
  },

  getById: async (id: number): Promise<Customer> => {
    const response = await api.get<Customer>(`/api/crm/customers/${id}`);
    return response.data;
  },

  create: async (data: CustomerFormData): Promise<Customer> => {
    const response = await api.post<Customer>('/api/crm/customers', data);
    return response.data;
  },

  update: async (id: number, data: Partial<CustomerFormData>): Promise<Customer> => {
    const response = await api.put<Customer>(`/api/crm/customers/${id}`, data);
    return response.data;
  },

  delete: async (id: number): Promise<void> => {
    await api.delete(`/api/crm/customers/${id}`);
  },

  shareWith: async (customerId: number, targetUserId: number): Promise<Customer> => {
    const response = await api.post<Customer>(`/api/crm/customers/${customerId}/share`, { targetUserId });
    return response.data;
  },

  removeShare: async (customerId: number, targetUserId: number): Promise<Customer> => {
    const response = await api.delete<Customer>(`/api/crm/customers/${customerId}/share`, { 
      data: { targetUserId } 
    });
    return response.data;
  }
};

// Etkileşim servisleri
export const interactionService = {
  getAll: async (customerId: number): Promise<Interaction[]> => {
    const response = await api.get<Interaction[]>(`/api/crm/customers/${customerId}/interactions`);
    return response.data;
  },

  create: async (data: InteractionFormData): Promise<Interaction> => {
    const response = await api.post<Interaction>(`/api/crm/customers/${data.customerId}/interactions`, data);
    return response.data;
  },

  update: async (customerId: number, interactionId: number, data: InteractionFormData): Promise<Interaction> => {
    const response = await api.put<Interaction>(`/api/crm/customers/${customerId}/interactions/${interactionId}`, data);
    return response.data;
  },

  delete: async (customerId: number, interactionId: number): Promise<void> => {
    await api.delete(`/api/crm/customers/${customerId}/interactions/${interactionId}`);
  },
}; 