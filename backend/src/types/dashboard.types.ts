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

export interface UserTasksSummary {
  userId: number;
  userName: string;
  email: string;
  assignedTasks: number;
  completedTasks: number;
  overdueTasks: number;
}

export interface ProjectProgress {
  id: number;
  name: string;
  totalTasks: number;
  completedTasks: number;
  progress: number; // Yüzde olarak (0-100)
  recentActivity: {
    date: Date;
    action: string;
    taskTitle: string;
  }[];
}

export interface DashboardFilters {
  startDate?: string;
  endDate?: string;
  userId?: string;
  projectId?: string;
} 