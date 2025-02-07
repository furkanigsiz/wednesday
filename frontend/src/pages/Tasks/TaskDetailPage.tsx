import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Container,
  Box,
  Typography,
  Paper,
  Grid,
  Chip,
  Button,
  IconButton,
  Divider,
  Tab,
  Tabs,
  CircularProgress,
  Alert,
  Card,
  CardContent,
  Stack,
  Tooltip,
  TextField,
  MenuItem,
} from '@mui/material';
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  ArrowBack as ArrowBackIcon,
  Schedule as ScheduleIcon,
  Person as PersonIcon,
  Folder as ProjectIcon,
  PriorityHigh,
  Error,
  LowPriority,
  LinearScale,
  Save as SaveIcon,
  Cancel as CancelIcon,
} from '@mui/icons-material';
import { Task, TaskStatus, TaskPriority } from '../../types';
import { taskService } from '../../services/api';
import SubtaskList from '../../components/Task/SubtaskList';
import NoteList from '../../components/Task/NoteList';
import FileList from '../../components/Task/FileList';
import { useSnackbar } from 'notistack';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

interface TaskDetailPageProps {
  isEditing?: boolean;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`task-tabpanel-${index}`}
      aria-labelledby={`task-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ p: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

const TaskStatusLabels: Record<TaskStatus, string> = {
  NOT_STARTED: 'Başlanmadı',
  IN_PROGRESS: 'Devam Ediyor',
  STUCK: 'Takıldı',
  COMPLETED: 'Tamamlandı',
};

const TaskPriorityLabels: Record<TaskPriority, string> = {
  CRITICAL: 'Kritik',
  HIGH: 'Yüksek',
  NORMAL: 'Normal',
  LOW: 'Düşük',
};

const TaskDetailPage: React.FC<TaskDetailPageProps> = ({ isEditing = false }) => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [task, setTask] = useState<Task | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tabValue, setTabValue] = useState(0);
  const { enqueueSnackbar } = useSnackbar();
  const [editForm, setEditForm] = useState<Partial<Task>>({});

  useEffect(() => {
    fetchTask();
  }, [id]);

  useEffect(() => {
    if (task) {
      setEditForm({
        title: task.title,
        description: task.description,
        status: task.status,
        priority: task.priority,
        dueDate: task.dueDate,
      });
    }
  }, [task]);

  const fetchTask = async () => {
    try {
      setLoading(true);
      const data = await taskService.getById(Number(id));
      setTask(data);
    } catch (err) {
      console.error('Görev yükleme hatası:', err);
      setError('Görev yüklenirken bir hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const handleDelete = async () => {
    if (!task || !window.confirm('Bu görevi silmek istediğinizden emin misiniz?')) {
      return;
    }

    try {
      await taskService.delete(task.id);
      enqueueSnackbar('Görev başarıyla silindi', { variant: 'success' });
      navigate('/tasks');
    } catch (err) {
      console.error('Görev silme hatası:', err);
      enqueueSnackbar('Görev silinirken bir hata oluştu', { variant: 'error' });
    }
  };

  const handleEdit = () => {
    navigate(`/tasks/${id}/edit`);
  };

  const handleSave = async () => {
    try {
      if (!task || !editForm) return;
      
      await taskService.update(task.id, editForm);
      enqueueSnackbar('Görev başarıyla güncellendi', { variant: 'success' });
      
      // Önce detay sayfasına yönlendir
      navigate(`/tasks/${id}/details`);
      
      // Ardından görevi yeniden yükle
      await fetchTask();

    } catch (err) {
      console.error('Görev güncelleme hatası:', err);
      enqueueSnackbar('Görev güncellenirken bir hata oluştu', { variant: 'error' });
    }
  };

  const handleCancel = () => {
    navigate(`/tasks/${id}/details`);
  };

  const getPriorityIcon = (priority: TaskPriority) => {
    switch (priority) {
      case 'CRITICAL':
        return <Error color="error" />;
      case 'HIGH':
        return <PriorityHigh color="warning" />;
      case 'LOW':
        return <LowPriority color="info" />;
      default:
        return <LinearScale />;
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error || !task) {
    return (
      <Container>
        <Alert severity="error">{error || 'Görev bulunamadı'}</Alert>
      </Container>
    );
  }

  if (isEditing) {
    return (
      <Container maxWidth="lg">
        <Box sx={{ py: 4 }}>
          <Box sx={{ mb: 3, display: 'flex', alignItems: 'center', gap: 2 }}>
            <IconButton onClick={handleCancel}>
              <ArrowBackIcon />
            </IconButton>
            <Typography variant="h4" component="h1" sx={{ flex: 1 }}>
              Görevi Düzenle
            </Typography>
            <Box>
              <Button
                variant="contained"
                startIcon={<SaveIcon />}
                onClick={handleSave}
                sx={{ mr: 1 }}
              >
                Kaydet
              </Button>
              <Button
                variant="outlined"
                startIcon={<CancelIcon />}
                onClick={handleCancel}
              >
                İptal
              </Button>
            </Box>
          </Box>

          <Card>
            <CardContent>
              <Grid container spacing={3}>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Görev Başlığı"
                    value={editForm.title || ''}
                    onChange={(e) => setEditForm(prev => ({ ...prev, title: e.target.value }))}
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    multiline
                    rows={4}
                    label="Açıklama"
                    value={editForm.description || ''}
                    onChange={(e) => setEditForm(prev => ({ ...prev, description: e.target.value }))}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    select
                    label="Durum"
                    value={editForm.status || ''}
                    onChange={(e) => setEditForm(prev => ({ ...prev, status: e.target.value as TaskStatus }))}
                  >
                    {Object.entries(TaskStatusLabels).map(([value, label]) => (
                      <MenuItem key={value} value={value}>
                        {label}
                      </MenuItem>
                    ))}
                  </TextField>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    select
                    label="Öncelik"
                    value={editForm.priority || ''}
                    onChange={(e) => setEditForm(prev => ({ ...prev, priority: e.target.value as TaskPriority }))}
                  >
                    {Object.entries(TaskPriorityLabels).map(([value, label]) => (
                      <MenuItem key={value} value={value}>
                        {label}
                      </MenuItem>
                    ))}
                  </TextField>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    type="date"
                    label="Bitiş Tarihi"
                    value={editForm.dueDate ? new Date(editForm.dueDate).toISOString().split('T')[0] : ''}
                    onChange={(e) => setEditForm(prev => ({ ...prev, dueDate: new Date(e.target.value) }))}
                    InputLabelProps={{ shrink: true }}
                  />
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg">
      <Box sx={{ py: 4 }}>
        {/* Üst Bar */}
        <Box sx={{ mb: 3, display: 'flex', alignItems: 'center', gap: 2 }}>
          <IconButton onClick={handleCancel}>
            <ArrowBackIcon />
          </IconButton>
          <Typography variant="h4" component="h1" sx={{ flex: 1 }}>
            {task.title}
          </Typography>
          <Box>
            <IconButton onClick={handleEdit} sx={{ mr: 1 }}>
              <EditIcon />
            </IconButton>
            <IconButton onClick={handleDelete} color="error">
              <DeleteIcon />
            </IconButton>
          </Box>
        </Box>

        {/* Ana Bilgiler Kartı */}
        <Grid container spacing={3} sx={{ mb: 3 }}>
          <Grid item xs={12} md={8}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Görev Detayları
                </Typography>
                <Typography variant="body1" sx={{ mb: 3 }}>
                  {task.description || 'Açıklama bulunmuyor'}
                </Typography>
                
                <Stack direction="row" spacing={2} flexWrap="wrap" useFlexGap>
                  <Chip
                    label={TaskStatusLabels[task.status]}
                    color={
                      task.status === 'COMPLETED' ? 'success' :
                      task.status === 'STUCK' ? 'error' :
                      task.status === 'IN_PROGRESS' ? 'primary' :
                      'default'
                    }
                  />
                  <Chip
                    icon={getPriorityIcon(task.priority)}
                    label={TaskPriorityLabels[task.priority]}
                    color={
                      task.priority === 'CRITICAL' ? 'error' :
                      task.priority === 'HIGH' ? 'warning' :
                      task.priority === 'LOW' ? 'info' :
                      'default'
                    }
                  />
                  {task.dueDate && (
                    <Chip
                      icon={<ScheduleIcon />}
                      label={`Bitiş: ${new Date(task.dueDate).toLocaleDateString('tr-TR')}`}
                      variant="outlined"
                    />
                  )}
                </Stack>
              </CardContent>
            </Card>
          </Grid>

          {/* Sağ Bilgi Kartı */}
          <Grid item xs={12} md={4}>
            <Card>
              <CardContent>
                <Stack spacing={2}>
                  <Box>
                    <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                      Proje
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <ProjectIcon color="action" />
                      <Typography>{task.project?.name || 'Belirtilmemiş'}</Typography>
                    </Box>
                  </Box>

                  <Box>
                    <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                      Atanan Kişi
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <PersonIcon color="action" />
                      <Typography>{task.user?.name || 'Atanmamış'}</Typography>
                    </Box>
                  </Box>

                  <Box>
                    <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                      Oluşturulma Tarihi
                    </Typography>
                    <Typography>
                      {new Date(task.createdAt).toLocaleDateString('tr-TR')}
                    </Typography>
                  </Box>
                </Stack>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Alt Sekmeler */}
        <Card>
          <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
            <Tabs value={tabValue} onChange={handleTabChange}>
              <Tab label="Alt Görevler" />
              <Tab label="Notlar" />
              <Tab label="Dosyalar" />
            </Tabs>
          </Box>

          <TabPanel value={tabValue} index={0}>
            <SubtaskList task={task} onSubtaskUpdate={fetchTask} />
          </TabPanel>
          <TabPanel value={tabValue} index={1}>
            <NoteList task={task} onNoteUpdate={fetchTask} />
          </TabPanel>
          <TabPanel value={tabValue} index={2}>
            <FileList task={task} />
          </TabPanel>
        </Card>
      </Box>
    </Container>
  );
};

export default TaskDetailPage; 