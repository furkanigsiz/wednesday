import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Box,
  Grid,
  Paper,
  CircularProgress,
  Alert,
  Card,
  CardContent,
  useTheme,
  LinearProgress,
  Divider,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
} from '@mui/material';
import {
  Assignment as TaskIcon,
  Warning as WarningIcon,
  Folder as ProjectIcon,
  AccessTime as TimeIcon,
} from '@mui/icons-material';
import { useAuth } from '../../context/AuthContext';
import { dashboardService } from '../../services/api';
import { Bar, Pie } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  ChartData,
  ChartOptions,
} from 'chart.js';
import { useNavigate, Link } from 'react-router-dom';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

interface DashboardData {
  totalProjects: number;
  totalTasks: number;
  completedTasks: number;
  criticalTasks: number;
  overdueTasks: {
    length: number;
  };
  tasks?: {
    completed: number;
    inProgress: number;
    notStarted: number;
    stuck: number;
  };
}

interface TaskDistributionData {
  userId: number;
  userName: string;
  taskStats: {
    total: number;
    byStatus: {
      completed: number;
      inProgress: number;
      notStarted: number;
      stuck: number;
    };
    overdue: number;
  };
}

interface OverdueTask {
  id: number;
  title: string;
  project: {
    name: string;
  };
  user: {
    name: string;
  };
  dueDate: string;
  priority: string;
}

function DashboardPage() {
  const { user } = useAuth();
  const theme = useTheme();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [taskDistribution, setTaskDistribution] = useState<TaskDistributionData[]>([]);
  const [overdueTasks, setOverdueTasks] = useState<Record<string, OverdueTask[]>>({});
  const navigate = useNavigate();

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        const [summaryData, distributionData, overdueData] = await Promise.all([
          dashboardService.getDashboardStats(),
          dashboardService.getTaskDistribution(),
          dashboardService.getOverdueTasks(),
        ]);
        
        console.log('Dashboard Data:', summaryData);
        console.log('Task Distribution:', distributionData);
        console.log('Overdue Tasks:', overdueData);
        
        setDashboardData(summaryData);
        setTaskDistribution(distributionData);
        setOverdueTasks(overdueData);
      } catch (err) {
        setError('Veriler yüklenirken bir hata oluştu.');
        console.error('Dashboard veri hatası:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Container maxWidth="lg">
        <Alert severity="error" sx={{ mt: 2 }}>
          {error}
        </Alert>
      </Container>
    );
  }

  const completionRate = dashboardData?.totalTasks 
    ? Math.round((dashboardData.completedTasks / dashboardData.totalTasks) * 100) 
    : 0;

  const taskDistributionChartData: ChartData<'bar'> = {
    labels: taskDistribution.map(user => user.userName),
    datasets: [
      {
        label: 'Toplam Görev',
        data: taskDistribution.map(user => user.taskStats.total),
        backgroundColor: theme.palette.primary.light,
        borderColor: theme.palette.primary.main,
        borderWidth: 1,
        borderRadius: 6,
        barThickness: 20,
      },
      {
        label: 'Tamamlanan',
        data: taskDistribution.map(user => user.taskStats.byStatus.completed),
        backgroundColor: theme.palette.success.light,
        borderColor: theme.palette.success.main,
        borderWidth: 1,
        borderRadius: 6,
        barThickness: 20,
      },
      {
        label: 'Devam Eden',
        data: taskDistribution.map(user => user.taskStats.byStatus.inProgress),
        backgroundColor: theme.palette.info.light,
        borderColor: theme.palette.info.main,
        borderWidth: 1,
        borderRadius: 6,
        barThickness: 20,
      },
      {
        label: 'Geciken',
        data: taskDistribution.map(user => user.taskStats.overdue),
        backgroundColor: theme.palette.error.light,
        borderColor: theme.palette.error.main,
        borderWidth: 1,
        borderRadius: 6,
        barThickness: 20,
      },
    ],
  };

  const taskStatusChartData: ChartData<'pie'> = {
    labels: ['Tamamlandı', 'Devam Ediyor', 'Başlanmadı', 'Takıldı'],
    datasets: [{
      data: [
        dashboardData?.completedTasks || 0,
        dashboardData?.tasks?.inProgress || 0,
        dashboardData?.tasks?.notStarted || 0,
        dashboardData?.tasks?.stuck || 0,
      ],
      backgroundColor: [
        theme.palette.success.main,
        theme.palette.info.main,
        theme.palette.warning.main,
        theme.palette.error.main,
      ],
      borderWidth: 1,
      borderColor: theme.palette.background.paper,
    }],
  };

  const barChartOptions: ChartOptions<'bar'> = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      x: {
        grid: {
          display: false,
        },
        ticks: {
          font: {
            size: 12,
            weight: '500',
          },
        },
      },
      y: {
        beginAtZero: true,
        grid: {
          color: theme.palette.divider,
          borderDash: [3, 3],
        },
        ticks: {
          font: {
            size: 12,
          },
          stepSize: 1,
          callback: function(value) {
            return value + ' görev';
          },
        },
        title: {
          display: true,
          text: 'Görev Sayısı',
          font: {
            size: 14,
            weight: 'bold'
          },
          padding: { bottom: 10 }
        }
      },
    },
    plugins: {
      legend: {
        position: 'bottom',
        labels: {
          padding: 20,
          usePointStyle: true,
          pointStyle: 'circle',
          font: {
            size: 12,
            weight: '500',
          },
        },
      },
      tooltip: {
        backgroundColor: theme.palette.background.paper,
        titleColor: theme.palette.text.primary,
        bodyColor: theme.palette.text.secondary,
        borderColor: theme.palette.divider,
        borderWidth: 1,
        padding: 12,
        bodyFont: {
          size: 12,
        },
        titleFont: {
          size: 14,
          weight: 'bold',
        },
        callbacks: {
          title: function(context) {
            return context[0].label + ' - Görev Dağılımı';
          },
          label: function(context) {
            const value = context.raw as number;
            const datasetLabel = context.dataset.label || '';
            if (value === 0) {
              return `${datasetLabel}: Görev yok`;
            }
            return value === 1 
              ? `${datasetLabel}: ${value} görev` 
              : `${datasetLabel}: ${value} görev`;
          },
          footer: function(context) {
            const user = taskDistribution.find(u => u.userName === context[0].label);
            if (user) {
              const total = user.taskStats.total;
              const completed = user.taskStats.byStatus.completed;
              const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;
              return `\nTamamlanma Oranı: %${percentage}`;
            }
            return '';
          },
        },
      },
    },
  };

  const pieChartOptions: ChartOptions<'pie'> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom',
        labels: {
          padding: 20,
          usePointStyle: true,
        },
      },
      tooltip: {
        callbacks: {
          label: function(context) {
            const label = context.label || '';
            const value = context.raw as number;
            const total = (context.dataset.data as number[]).reduce((a, b) => a + b, 0);
            const percentage = total > 0 ? Math.round((value / total) * 100) : 0;
            return `${label}: ${value} (%${percentage})`;
          }
        }
      }
    }
  };

  const criticalTaskCount = dashboardData?.criticalTasks ?? 0;
  const overdueTaskCount = dashboardData?.overdueTasks?.length ?? 0;

  const handleTaskClick = (taskId: number) => {
    console.log('Göreve yönlendiriliyor:', taskId);
    try {
      navigate(`/tasks/${taskId}`, { replace: true });
    } catch (error) {
      console.error('Yönlendirme hatası:', error);
    }
  };

  return (
    <Container maxWidth="lg">
      <Box sx={{ mt: 4, mb: 6 }}>
        <Typography 
          variant="h4" 
          component="h1" 
          gutterBottom
          sx={{ 
            fontWeight: 'bold',
            color: theme.palette.primary.main,
            mb: 3
          }}
        >
          Hoş Geldiniz, {user?.name}!
        </Typography>

        <Grid container spacing={3}>
          {/* Proje İstatistikleri */}
          <Grid item xs={12} md={6} lg={3}>
            <Card 
              elevation={3}
              sx={{ 
                height: '100%',
                transition: 'transform 0.2s',
                '&:hover': {
                  transform: 'translateY(-4px)',
                }
              }}
            >
              <CardContent sx={{ 
                display: 'flex', 
                flexDirection: 'column', 
                alignItems: 'center',
                height: 140,
                position: 'relative'
              }}>
                <ProjectIcon sx={{ fontSize: 40, color: theme.palette.primary.main, mb: 1 }} />
                <Typography variant="h4" component="div" sx={{ fontWeight: 'bold' }}>
                  {dashboardData?.totalProjects || 0}
                </Typography>
                <Typography color="textSecondary" sx={{ mt: 1 }}>
                  Toplam Proje
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          {/* Görev İstatistikleri */}
          <Grid item xs={12} md={6} lg={3}>
            <Card 
              elevation={3}
              sx={{ 
                height: '100%',
                transition: 'transform 0.2s',
                '&:hover': {
                  transform: 'translateY(-4px)',
                }
              }}
            >
              <CardContent sx={{ 
                display: 'flex', 
                flexDirection: 'column', 
                alignItems: 'center',
                height: 140,
                position: 'relative'
              }}>
                <TaskIcon sx={{ fontSize: 40, color: theme.palette.info.main, mb: 1 }} />
                <Typography variant="h4" component="div" sx={{ fontWeight: 'bold' }}>
                  {dashboardData?.totalTasks || 0}
                </Typography>
                <Typography color="textSecondary" sx={{ mt: 1 }}>
                  Toplam Görev
                </Typography>
                <Box sx={{ width: '100%', mt: 2 }}>
                  <LinearProgress 
                    variant="determinate" 
                    value={completionRate} 
                    sx={{ 
                      height: 8, 
                      borderRadius: 4,
                      backgroundColor: theme.palette.grey[200],
                      '& .MuiLinearProgress-bar': {
                        backgroundColor: theme.palette.success.main,
                      }
                    }}
                  />
                  <Typography variant="caption" sx={{ mt: 0.5, display: 'block', textAlign: 'center' }}>
                    %{completionRate} Tamamlandı
                  </Typography>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          {/* Kritik Görevler */}
          <Grid item xs={12} md={6} lg={3}>
            <Card 
              elevation={3}
              sx={{ 
                height: '100%',
                transition: 'transform 0.2s',
                '&:hover': {
                  transform: 'translateY(-4px)',
                },
                bgcolor: criticalTaskCount > 0 ? 'error.light' : 'background.paper',
              }}
            >
              <CardContent sx={{ 
                display: 'flex', 
                flexDirection: 'column', 
                alignItems: 'center',
                height: 140,
                position: 'relative'
              }}>
                <WarningIcon 
                  sx={{ 
                    fontSize: 40, 
                    color: criticalTaskCount > 0 ? 'error.main' : theme.palette.warning.main,
                    mb: 1,
                    animation: criticalTaskCount > 0 ? 'pulse 2s infinite' : 'none',
                    '@keyframes pulse': {
                      '0%': { opacity: 1 },
                      '50%': { opacity: 0.6 },
                      '100%': { opacity: 1 },
                    },
                  }} 
                />
                <Typography 
                  variant="h4" 
                  component="div" 
                  sx={{ 
                    fontWeight: 'bold',
                    color: criticalTaskCount > 0 ? 'error.main' : 'text.primary'
                  }}
                >
                  {criticalTaskCount}
                </Typography>
                <Typography 
                  sx={{ 
                    mt: 1,
                    color: criticalTaskCount > 0 ? 'error.main' : 'text.secondary',
                    fontWeight: criticalTaskCount > 0 ? 'bold' : 'normal'
                  }}
                >
                  {criticalTaskCount > 0 
                    ? 'KRİTİK GÖREV!' 
                    : 'Kritik Görev'}
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          {/* Geciken Görevler */}
          <Grid item xs={12} md={6} lg={3}>
            <Card 
              elevation={3}
              sx={{ 
                height: '100%',
                transition: 'transform 0.2s',
                '&:hover': {
                  transform: 'translateY(-4px)',
                },
                bgcolor: overdueTaskCount > 0 ? 'warning.light' : 'background.paper',
              }}
            >
              <CardContent sx={{ 
                display: 'flex', 
                flexDirection: 'column', 
                alignItems: 'center',
                height: 140,
                position: 'relative'
              }}>
                <TimeIcon 
                  sx={{ 
                    fontSize: 40, 
                    color: overdueTaskCount > 0 ? 'warning.main' : theme.palette.success.main,
                    mb: 1 
                  }} 
                />
                <Typography 
                  variant="h4" 
                  component="div" 
                  sx={{ 
                    fontWeight: 'bold',
                    color: overdueTaskCount > 0 ? 'warning.dark' : 'text.primary'
                  }}
                >
                  {overdueTaskCount}
                </Typography>
                <Typography 
                  sx={{ 
                    mt: 1,
                    color: overdueTaskCount > 0 ? 'warning.dark' : 'text.secondary',
                    fontWeight: overdueTaskCount > 0 ? 'bold' : 'normal'
                  }}
                >
                  {overdueTaskCount > 0 
                    ? 'GECİKEN GÖREV!' 
                    : 'Geciken Görev'}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Kullanıcı Bazlı Görev Dağılımı Grafiği */}
        <Grid container spacing={3} sx={{ mt: 4 }}>
          <Grid item xs={12}>
            <Paper 
              elevation={3} 
              sx={{ 
                p: 3,
                background: `linear-gradient(to right bottom, ${theme.palette.background.paper}, ${theme.palette.background.default})`,
                borderRadius: 2,
              }}
            >
              <Box sx={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center',
                mb: 3
              }}>
                <Box>
                  <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold' }}>
                    Kullanıcı Bazlı Görev Dağılımı
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Her kullanıcının görev durumlarına göre dağılımı
                  </Typography>
                </Box>
              </Box>
              <Box sx={{ 
                height: 400,
                mt: 2,
              }}>
                <Bar
                  data={taskDistributionChartData}
                  options={barChartOptions}
                />
              </Box>
            </Paper>
          </Grid>

          {/* Görev Durumu Dağılımı */}
          <Grid item xs={12} md={6}>
            <Paper elevation={3} sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>
                Görev Durumu Dağılımı
              </Typography>
              <Box sx={{ height: 300 }}>
                <Pie
                  data={taskStatusChartData}
                  options={pieChartOptions}
                />
              </Box>
            </Paper>
          </Grid>

          {/* Geciken Görevler Tablosu */}
          <Grid item xs={12} md={6}>
            <Paper elevation={3} sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>
                Geciken Görevler
              </Typography>
              <TableContainer sx={{ maxHeight: 300 }}>
                <Table stickyHeader size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Görev</TableCell>
                      <TableCell>Proje</TableCell>
                      <TableCell>Atanan</TableCell>
                      <TableCell>Öncelik</TableCell>
                      <TableCell>Gecikme</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {Object.entries(overdueTasks).map(([priority, tasks]) =>
                      tasks.map((task: OverdueTask) => (
                        <TableRow
                          key={task.id}
                          onClick={() => navigate(`/tasks/${task.id}`)}
                          sx={{
                            backgroundColor: 
                              priority === 'critical' 
                                ? theme.palette.error.light 
                                : priority === 'high'
                                ? theme.palette.warning.light
                                : 'inherit',
                            cursor: 'pointer',
                            '&:hover': {
                              backgroundColor: 
                                priority === 'critical' 
                                  ? theme.palette.error.main 
                                  : priority === 'high'
                                  ? theme.palette.warning.main
                                  : theme.palette.action.hover,
                              '& td': {
                                color: priority === 'critical' || priority === 'high' 
                                  ? theme.palette.common.white 
                                  : 'inherit'
                              }
                            },
                            transition: 'all 0.2s ease',
                          }}
                        >
                          <TableCell sx={{ fontWeight: 'medium' }}>{task.title}</TableCell>
                          <TableCell>{task.project.name}</TableCell>
                          <TableCell>{task.user.name}</TableCell>
                          <TableCell>
                            <Box
                              sx={{
                                backgroundColor: 
                                  priority === 'critical' 
                                    ? theme.palette.error.dark
                                    : priority === 'high'
                                    ? theme.palette.warning.dark
                                    : theme.palette.grey[500],
                                color: theme.palette.common.white,
                                py: 0.5,
                                px: 1,
                                borderRadius: 1,
                                display: 'inline-block',
                                fontSize: '0.75rem',
                                fontWeight: 'bold',
                              }}
                            >
                              {priority.toUpperCase()}
                            </Box>
                          </TableCell>
                          <TableCell>
                            <Box
                              sx={{
                                color: theme.palette.error.main,
                                fontWeight: 'bold',
                              }}
                            >
                              {Math.ceil(
                                (new Date().getTime() - new Date(task.dueDate).getTime()) /
                                  (1000 * 60 * 60 * 24)
                              )} gün
                            </Box>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                    {Object.values(overdueTasks).flat().length === 0 && (
                      <TableRow>
                        <TableCell colSpan={5} sx={{ textAlign: 'center', py: 3 }}>
                          <Typography variant="body2" color="text.secondary">
                            Geciken görev bulunmamaktadır
                          </Typography>
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            </Paper>
          </Grid>
        </Grid>
      </Box>
    </Container>
  );
}

export default DashboardPage; 