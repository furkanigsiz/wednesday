import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Container,
  Typography,
  Box,
  Button,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  CircularProgress,
  List,
  ListItem,
  ListItemText,
  Collapse,
  Card,
  CardContent,
  Grid,
  Chip,
  Tooltip,
  InputAdornment,
  ImageList,
  ImageListItem,
  Modal,
  Backdrop,
  Fade,
  styled,
  Stack,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Search as SearchIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  ZoomIn as ZoomInIcon,
  ZoomOut as ZoomOutIcon,
  Close as CloseIcon,
  FilterList as FilterListIcon,
  Clear as ClearIcon,
} from '@mui/icons-material';
import { taskService, projectService, subtaskService, userService, noteService, fileService } from '../../services/api';
import { Task, TaskStatus, TaskPriority, Project, Subtask, User, Note, TaskFile } from '../../types';
import { useSnackbar } from 'notistack';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import { useTheme } from '@mui/material/styles';
import CalendarIcon from '@mui/icons-material/CalendarToday';
import SubtaskList from '../../components/Task/SubtaskList';
import NoteList from '../../components/Task/NoteList';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';

const TaskStatusLabels: Record<TaskStatus, string> = {
  NOT_STARTED: 'Başlanmadı',
  IN_PROGRESS: 'Devam Ediyor',
  STUCK: 'Takıldı',
  COMPLETED: 'Bitti',
};

const TaskPriorityLabels: Record<TaskPriority, string> = {
  CRITICAL: 'Kritik',
  HIGH: 'Çok Önemli',
  NORMAL: 'Normal',
  LOW: 'Düşük',
};

interface TaskFormData {
  title: string;
  description: string;
  status: TaskStatus;
  priority: TaskPriority;
  dueDate: string;
  projectId: string;
  userId?: string;
}

interface SubtaskListProps {
  task: Task;
  onSubtaskUpdate: () => void;
}

interface TaskFilters {
  status: TaskStatus | 'ALL';
  priority: TaskPriority | 'ALL';
  startDate: Date | null;
  endDate: Date | null;
  assignedUserId: number | 'ALL';
}

const StyledModal = styled(Modal)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
}));

const ImageContainer = styled(Box)(({ theme }) => ({
  position: 'relative',
  backgroundColor: theme.palette.background.paper,
  boxShadow: theme.shadows[5],
  padding: theme.spacing(2),
  maxWidth: '90vw',
  maxHeight: '90vh',
  outline: 'none',
  '& img': {
    maxWidth: '100%',
    maxHeight: '80vh',
    objectFit: 'contain',
  },
}));

const CloseButton = styled(IconButton)(({ theme }) => ({
  position: 'absolute',
  right: theme.spacing(1),
  top: theme.spacing(1),
  color: theme.palette.grey[500],
}));

const FileList = ({ task }: { task: Task }) => {
  const [files, setFiles] = useState<TaskFile[]>(task.files || []);
  const [uploading, setUploading] = useState(false);
  const [selectedImage, setSelectedImage] = useState<TaskFile | null>(null);
  const [zoom, setZoom] = useState(100);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { enqueueSnackbar } = useSnackbar();

  const isImageFile = (mimeType: string) => {
    return mimeType.startsWith('image/');
  };

  const imageFiles = files.filter(file => isImageFile(file.mimeType));
  const otherFiles = files.filter(file => !isImageFile(file.mimeType));

  const handleZoomIn = () => {
    setZoom(prev => Math.min(prev + 20, 200));
  };

  const handleZoomOut = () => {
    setZoom(prev => Math.max(prev - 20, 50));
  };

  const handleImageClick = (file: TaskFile) => {
    setSelectedImage(file);
    setZoom(100);
  };

  const handleCloseModal = () => {
    setSelectedImage(null);
    setZoom(100);
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      setUploading(true);
      const uploadedFile = await fileService.upload(task.id, file);
      setFiles([...files, uploadedFile]);
      enqueueSnackbar('Dosya başarıyla yüklendi', { variant: 'success' });
    } catch (error) {
      console.error('Dosya yükleme hatası:', error);
      enqueueSnackbar('Dosya yüklenirken bir hata oluştu', { variant: 'error' });
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleFileDownload = async (file: TaskFile) => {
    try {
      const blob = await fileService.download(task.id, file.id);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = file.filename;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Dosya indirme hatası:', error);
      enqueueSnackbar('Dosya indirilirken bir hata oluştu', { variant: 'error' });
    }
  };

  const handleFileDelete = async (file: TaskFile) => {
    try {
      await fileService.delete(task.id, file.id);
      setFiles(files.filter(f => f.id !== file.id));
      enqueueSnackbar('Dosya başarıyla silindi', { variant: 'success' });
    } catch (error) {
      console.error('Dosya silme hatası:', error);
      enqueueSnackbar('Dosya silinirken bir hata oluştu', { variant: 'error' });
    }
  };

  return (
    <Box>
      <List>
        <ListItem>
          <input
            type="file"
            onChange={handleFileUpload}
            style={{ display: 'none' }}
            ref={fileInputRef}
          />
          <Button
            variant="outlined"
            startIcon={<CloudUploadIcon />}
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            size="small"
          >
            {uploading ? 'Yükleniyor...' : 'Dosya Yükle'}
          </Button>
        </ListItem>
      </List>

      {imageFiles.length > 0 && (
        <Box sx={{ mt: 2 }}>
          <Typography variant="subtitle1" gutterBottom>
            Fotoğraflar ({imageFiles.length})
          </Typography>
          <ImageList cols={3} gap={8}>
            {imageFiles.map((file) => (
              <ImageListItem 
                key={file.id}
                sx={{ 
                  cursor: 'pointer',
                  '&:hover': {
                    opacity: 0.8,
                    '& .image-actions': {
                      opacity: 1,
                    },
                  },
                }}
              >
                <img
                  src={file.publicUrl}
                  alt={file.filename}
                  loading="lazy"
                  style={{ height: 200, objectFit: 'cover' }}
                  onClick={() => handleImageClick(file)}
                />
                <Box
                  className="image-actions"
                  sx={{
                    position: 'absolute',
                    top: 0,
                    right: 0,
                    bgcolor: 'rgba(0, 0, 0, 0.5)',
                    opacity: 0,
                    transition: 'opacity 0.2s',
                    p: 0.5,
                    borderRadius: '0 0 0 8px',
                  }}
                >
                  <IconButton
                    size="small"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleFileDownload(file);
                    }}
                    sx={{ color: 'white' }}
                  >
                    <FileDownloadIcon />
                  </IconButton>
                  <IconButton
                    size="small"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleFileDelete(file);
                    }}
                    sx={{ color: 'white' }}
                  >
                    <DeleteIcon />
                  </IconButton>
                </Box>
                <Box
                  sx={{
                    position: 'absolute',
                    bottom: 0,
                    left: 0,
                    right: 0,
                    bgcolor: 'rgba(0, 0, 0, 0.5)',
                    color: 'white',
                    p: 1,
                    fontSize: '0.75rem',
                  }}
                >
                  <Typography variant="caption" sx={{ color: 'white' }}>
                    {file.filename}
                  </Typography>
                </Box>
              </ImageListItem>
            ))}
          </ImageList>
        </Box>
      )}

      {otherFiles.length > 0 && (
        <Box sx={{ mt: 2 }}>
          <Typography variant="subtitle1" gutterBottom>
            Diğer Dosyalar ({otherFiles.length})
          </Typography>
          <List>
            {otherFiles.map((file) => (
              <ListItem
                key={file.id}
                sx={{
                  border: '1px solid #eee',
                  borderRadius: 1,
                  mb: 1,
                }}
              >
                <ListItemText
                  primary={file.filename}
                  secondary={`${(file.size / 1024).toFixed(2)} KB - ${new Date(file.createdAt).toLocaleString()} - Yükleyen: ${file.user?.name || 'Bilinmiyor'}`}
                />
                <Box>
                  <IconButton
                    size="small"
                    onClick={() => handleFileDownload(file)}
                    title="İndir"
                  >
                    <FileDownloadIcon />
                  </IconButton>
                  <IconButton
                    size="small"
                    onClick={() => handleFileDelete(file)}
                    title="Sil"
                  >
                    <DeleteIcon />
                  </IconButton>
                </Box>
              </ListItem>
            ))}
          </List>
        </Box>
      )}

      <StyledModal
        open={!!selectedImage}
        onClose={handleCloseModal}
        closeAfterTransition
        BackdropComponent={Backdrop}
        BackdropProps={{
          timeout: 500,
        }}
      >
        <Fade in={!!selectedImage}>
          <ImageContainer>
            <CloseButton onClick={handleCloseModal}>
              <CloseIcon />
            </CloseButton>
            {selectedImage && (
              <>
                <Box sx={{ mb: 2, display: 'flex', justifyContent: 'center', gap: 2 }}>
                  <IconButton onClick={handleZoomOut} disabled={zoom <= 50}>
                    <ZoomOutIcon />
                  </IconButton>
                  <Typography sx={{ lineHeight: '40px' }}>{zoom}%</Typography>
                  <IconButton onClick={handleZoomIn} disabled={zoom >= 200}>
                    <ZoomInIcon />
                  </IconButton>
                </Box>
                <Box
                  sx={{
                    overflow: 'auto',
                    maxHeight: '70vh',
                    display: 'flex',
                    justifyContent: 'center',
                  }}
                >
                  <img
                    src={selectedImage.publicUrl}
                    alt={selectedImage.filename}
                    style={{
                      transform: `scale(${zoom / 100})`,
                      transition: 'transform 0.2s',
                      transformOrigin: 'center center',
                    }}
                  />
                </Box>
                <Box sx={{ mt: 2, textAlign: 'center' }}>
                  <Typography variant="caption" color="text.secondary">
                    {selectedImage.filename} - {(selectedImage.size / 1024).toFixed(2)} KB
                  </Typography>
                </Box>
              </>
            )}
          </ImageContainer>
        </Fade>
      </StyledModal>
    </Box>
  );
};

const FilterPanel = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(2),
  marginBottom: theme.spacing(2),
  transition: 'all 0.3s ease',
  '&.expanded': {
    marginBottom: theme.spacing(3),
  }
}));

const TaskCard = styled(Card)(({ theme }) => ({
  marginBottom: theme.spacing(2),
  transition: 'all 0.3s ease',
  '&:hover': {
    boxShadow: theme.shadows[4],
  }
}));

const FilterChip = styled(Chip)(({ theme }) => ({
  margin: theme.spacing(0.5),
  '& .MuiChip-label': {
    fontWeight: 500,
  }
}));

const TasksPage: React.FC = () => {
  const theme = useTheme();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [formData, setFormData] = useState<TaskFormData>({
    title: '',
    description: '',
    status: 'NOT_STARTED',
    priority: 'NORMAL',
    dueDate: '',
    projectId: '',
    userId: '',
  });
  const [filters, setFilters] = useState<TaskFilters>({
    status: 'ALL',
    priority: 'ALL',
    startDate: null,
    endDate: null,
    assignedUserId: 'ALL'
  });
  const [showFilters, setShowFilters] = useState(false);
  const [expandedTaskId, setExpandedTaskId] = useState<number | null>(null);
  const [isFilterExpanded, setIsFilterExpanded] = useState(false);

  useEffect(() => {
    fetchTasks();
    fetchProjects();
    fetchUsers();
  }, []);

  const fetchTasks = async () => {
    try {
      setLoading(true);
      const response = await taskService.getAll();
      setTasks(response.tasks);
    } catch (err) {
      console.error('Görev yükleme hatası:', err);
      setError('Görevler yüklenirken bir hata oluştu.');
      setTasks([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchProjects = async () => {
    try {
      const data = await projectService.getAll();
      setProjects(data);
    } catch (err) {
      console.error('Proje yükleme hatası:', err);
      setError('Projeler yüklenirken bir hata oluştu.');
    }
  };

  const fetchUsers = async () => {
    try {
      const data = await userService.getAll();
      setUsers(data);
    } catch (err) {
      console.error('Kullanıcı yükleme hatası:', err);
      setUsers([]);
    }
  };

  const handleOpenDialog = (task?: Task) => {
    if (task) {
      setEditingTask(task);
      setFormData({
        title: task.title,
        description: task.description || '',
        status: task.status,
        priority: task.priority,
        dueDate: task.dueDate ? new Date(task.dueDate).toISOString().split('T')[0] : '',
        projectId: task.projectId.toString(),
        userId: task.userId?.toString() || '',
      });
    } else {
      setEditingTask(null);
      setFormData({
        title: '',
        description: '',
        status: 'NOT_STARTED',
        priority: 'NORMAL',
        dueDate: '',
        projectId: '',
        userId: '',
      });
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditingTask(null);
    setFormData({
      title: '',
      description: '',
      status: 'NOT_STARTED',
      priority: 'NORMAL',
      dueDate: '',
      projectId: '',
      userId: '',
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const taskData: Partial<Task> = {
        ...formData,
        projectId: formData.projectId ? parseInt(formData.projectId, 10) : undefined,
        userId: formData.userId ? parseInt(formData.userId, 10) : undefined,
        dueDate: formData.dueDate ? new Date(formData.dueDate) : undefined,
      };

      if (editingTask) {
        await taskService.update(editingTask.id, taskData);
      } else {
        await taskService.create(taskData);
      }
      handleCloseDialog();
      fetchTasks();
    } catch (err) {
      setError('Görev kaydedilirken bir hata oluştu.');
    }
  };

  const handleDeleteTask = async (id: number) => {
    if (window.confirm('Bu görevi silmek istediğinizden emin misiniz?')) {
      try {
        await taskService.delete(id);
        fetchTasks();
      } catch (err) {
        setError('Görev silinirken bir hata oluştu.');
      }
    }
  };

  const getFilteredTasks = useCallback(() => {
    return tasks.filter(task => {
      if (filters.status !== 'ALL' && task.status !== filters.status) {
        return false;
      }

      if (filters.priority !== 'ALL' && task.priority !== filters.priority) {
        return false;
      }

      if (filters.startDate && new Date(task.dueDate!) < filters.startDate) {
        return false;
      }
      if (filters.endDate && new Date(task.dueDate!) > filters.endDate) {
        return false;
      }

      if (filters.assignedUserId !== 'ALL' && task.userId !== filters.assignedUserId) {
        return false;
      }

      return true;
    });
  }, [tasks, filters]);

  const getActiveFilterCount = () => {
    let count = 0;
    if (filters.status !== 'ALL') count++;
    if (filters.priority !== 'ALL') count++;
    if (filters.startDate) count++;
    if (filters.endDate) count++;
    if (filters.assignedUserId !== 'ALL') count++;
    return count;
  };

  const handleClearFilters = () => {
    setFilters({
      status: 'ALL',
      priority: 'ALL',
      startDate: null,
      endDate: null,
      assignedUserId: 'ALL'
    });
  };

  const handleExpandTask = (taskId: number) => {
    setExpandedTaskId(expandedTaskId === taskId ? null : taskId);
  };

  const renderActiveFilters = () => {
    const activeFilters = [];

    if (filters.status !== 'ALL') {
      activeFilters.push(
        <FilterChip
          key="status"
          label={`Durum: ${TaskStatusLabels[filters.status]}`}
          onDelete={() => setFilters(prev => ({ ...prev, status: 'ALL' }))}
          color="primary"
          variant="outlined"
        />
      );
    }

    if (filters.priority !== 'ALL') {
      activeFilters.push(
        <FilterChip
          key="priority"
          label={`Öncelik: ${TaskPriorityLabels[filters.priority]}`}
          onDelete={() => setFilters(prev => ({ ...prev, priority: 'ALL' }))}
          color="primary"
          variant="outlined"
        />
      );
    }

    if (filters.startDate) {
      activeFilters.push(
        <FilterChip
          key="startDate"
          label={`Başlangıç: ${new Date(filters.startDate).toLocaleDateString()}`}
          onDelete={() => setFilters(prev => ({ ...prev, startDate: null }))}
          color="primary"
          variant="outlined"
        />
      );
    }

    if (filters.endDate) {
      activeFilters.push(
        <FilterChip
          key="endDate"
          label={`Bitiş: ${new Date(filters.endDate).toLocaleDateString()}`}
          onDelete={() => setFilters(prev => ({ ...prev, endDate: null }))}
          color="primary"
          variant="outlined"
        />
      );
    }

    if (filters.assignedUserId !== 'ALL') {
      const user = users.find(u => u.id === filters.assignedUserId);
      if (user) {
        activeFilters.push(
          <FilterChip
            key="assignedUser"
            label={`Atanan: ${user.name}`}
            onDelete={() => setFilters(prev => ({ ...prev, assignedUserId: 'ALL' }))}
            color="primary"
            variant="outlined"
          />
        );
      }
    }

    return activeFilters;
  };

  const handleTaskUpdate = (updatedTask: Task) => {
    setTasks(prevTasks => 
      prevTasks.map(task => 
        task.id === updatedTask.id ? { ...task, ...updatedTask } : task
      )
    );
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Container maxWidth="lg">
      <Box sx={{ py: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h4" component="h1">
            Görevler
          </Typography>
          <Button
            variant="contained"
            color="primary"
            startIcon={<AddIcon />}
            onClick={() => handleOpenDialog()}
          >
            Yeni Görev
          </Button>
        </Box>

        <FilterPanel className={isFilterExpanded ? 'expanded' : ''}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <FilterListIcon sx={{ mr: 1 }} />
              <Typography variant="h6">Filtreler</Typography>
            </Box>
            <Box>
              <IconButton onClick={() => setIsFilterExpanded(!isFilterExpanded)} size="small">
                {isFilterExpanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
              </IconButton>
              {getActiveFilterCount() > 0 && (
                <IconButton onClick={handleClearFilters} size="small" sx={{ ml: 1 }}>
                  <ClearIcon />
                </IconButton>
              )}
            </Box>
          </Box>

          <Collapse in={isFilterExpanded}>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6} md={3}>
                <FormControl fullWidth size="small">
                  <InputLabel>Durum</InputLabel>
                  <Select
                    value={filters.status}
                    onChange={(e) => setFilters({ ...filters, status: e.target.value as TaskStatus | 'ALL' })}
                    label="Durum"
                  >
                    <MenuItem value="ALL">Tümü</MenuItem>
                    {Object.entries(TaskStatusLabels).map(([value, label]) => (
                      <MenuItem key={value} value={value}>{label}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <FormControl fullWidth size="small">
                  <InputLabel>Öncelik</InputLabel>
                  <Select
                    value={filters.priority}
                    onChange={(e) => setFilters({ ...filters, priority: e.target.value as TaskPriority | 'ALL' })}
                    label="Öncelik"
                  >
                    <MenuItem value="ALL">Tümü</MenuItem>
                    {Object.entries(TaskPriorityLabels).map(([value, label]) => (
                      <MenuItem key={value} value={value}>{label}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <DatePicker
                  label="Başlangıç Tarihi"
                  value={filters.startDate}
                  onChange={(date) => setFilters({ ...filters, startDate: date })}
                  slotProps={{ textField: { size: 'small', fullWidth: true } }}
                />
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <DatePicker
                  label="Bitiş Tarihi"
                  value={filters.endDate}
                  onChange={(date) => setFilters({ ...filters, endDate: date })}
                  slotProps={{ textField: { size: 'small', fullWidth: true } }}
                />
              </Grid>
            </Grid>
          </Collapse>

          {getActiveFilterCount() > 0 && (
            <Box sx={{ mt: 2, display: 'flex', flexWrap: 'wrap', gap: 1 }}>
              {renderActiveFilters()}
            </Box>
          )}
        </FilterPanel>

        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <CircularProgress />
          </Box>
        ) : tasks.length === 0 ? (
          <Alert severity="info">Görev bulunamadı</Alert>
        ) : (
          <Box>
            {tasks.map((task) => (
              <TaskCard key={task.id}>
                <CardContent>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <Box sx={{ flex: 1 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                        <Typography variant="h6" component="div" sx={{ mr: 2 }}>
                          {task.title}
                        </Typography>
                        <Chip
                          label={TaskStatusLabels[task.status]}
                          size="small"
                          color={task.status === 'COMPLETED' ? 'success' : task.status === 'STUCK' ? 'error' : 'primary'}
                          sx={{ mr: 1 }}
                        />
                        <Chip
                          label={TaskPriorityLabels[task.priority]}
                          size="small"
                          color={task.priority === 'CRITICAL' ? 'error' : task.priority === 'HIGH' ? 'warning' : 'default'}
                        />
                      </Box>
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                        {task.description}
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', gap: 1 }}>
                      <IconButton size="small" onClick={() => handleOpenDialog(task)}>
                        <EditIcon />
                      </IconButton>
                      <IconButton size="small" onClick={() => handleDeleteTask(task.id)}>
                        <DeleteIcon />
                      </IconButton>
                      <IconButton size="small" onClick={() => handleExpandTask(task.id)}>
                        {expandedTaskId === task.id ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                      </IconButton>
                    </Box>
                  </Box>

                  <Collapse in={expandedTaskId === task.id}>
                    <Box sx={{ mt: 2 }}>
                      <Typography variant="subtitle2" gutterBottom>Alt Görevler</Typography>
                      <SubtaskList 
                        task={task} 
                        onSubtaskUpdate={() => handleTaskUpdate(task)} 
                      />

                      <Typography variant="subtitle2" gutterBottom sx={{ mt: 2 }}>Notlar</Typography>
                      <NoteList 
                        task={task} 
                        onNoteUpdate={() => handleTaskUpdate(task)} 
                      />

                      <Typography variant="subtitle2" gutterBottom sx={{ mt: 2 }}>Dosyalar</Typography>
                      <FileList task={task} />
                    </Box>
                  </Collapse>
                </CardContent>
              </TaskCard>
            ))}
          </Box>
        )}
      </Box>

      <Dialog 
        open={openDialog} 
        onClose={handleCloseDialog} 
        maxWidth="sm" 
        fullWidth
        PaperProps={{
          elevation: 2,
          sx: { borderRadius: 2 }
        }}
      >
        <DialogTitle sx={{ 
          pb: 1,
          color: theme.palette.primary.main,
          fontWeight: 'bold'
        }}>
          {editingTask ? 'Görevi Düzenle' : 'Yeni Görev Oluştur'}
        </DialogTitle>
        <form onSubmit={handleSubmit}>
          <DialogContent sx={{ pb: 2 }}>
            <FormControl fullWidth margin="normal" required sx={{ mb: 2 }}>
              <InputLabel>Proje</InputLabel>
              <Select
                value={formData.projectId}
                onChange={(e) => setFormData({ ...formData, projectId: e.target.value })}
                label="Proje"
                sx={{ borderRadius: 1 }}
              >
                <MenuItem value="">
                  <em>Proje Seçin</em>
                </MenuItem>
                {projects.map((project) => (
                  <MenuItem key={project.id} value={project.id.toString()}>
                    {project.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            
            <TextField
              fullWidth
              label="Görev Başlığı"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              margin="normal"
              required
              sx={{ mb: 2 }}
              InputProps={{
                sx: { borderRadius: 1 }
              }}
            />
            <TextField
              fullWidth
              label="Açıklama"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              margin="normal"
              multiline
              rows={3}
              sx={{ mb: 2 }}
              InputProps={{
                sx: { borderRadius: 1 }
              }}
            />
            <FormControl fullWidth margin="normal" sx={{ mb: 2 }}>
              <InputLabel>Durum</InputLabel>
              <Select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value as TaskStatus })}
                label="Durum"
                sx={{ borderRadius: 1 }}
              >
                {Object.entries(TaskStatusLabels).map(([key, value]) => (
                  <MenuItem key={key} value={key}>
                    <Chip
                      label={value}
                      size="small"
                      color={
                        key === 'COMPLETED' 
                          ? 'success' 
                          : key === 'STUCK' 
                            ? 'error'
                            : key === 'IN_PROGRESS'
                              ? 'warning'
                              : 'default'
                      }
                      sx={{ borderRadius: 1, minWidth: 100 }}
                    />
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <FormControl fullWidth margin="normal" sx={{ mb: 2 }}>
              <InputLabel>Öncelik</InputLabel>
              <Select
                value={formData.priority}
                onChange={(e) => setFormData({ ...formData, priority: e.target.value as TaskPriority })}
                label="Öncelik"
                sx={{ borderRadius: 1 }}
              >
                {Object.entries(TaskPriorityLabels).map(([key, value]) => (
                  <MenuItem key={key} value={key}>
                    <Chip
                      label={value}
                      size="small"
                      color={
                        key === 'CRITICAL' 
                          ? 'error' 
                          : key === 'HIGH'
                            ? 'warning'
                            : key === 'NORMAL'
                              ? 'info'
                              : 'default'
                      }
                      sx={{ borderRadius: 1, minWidth: 90 }}
                    />
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <TextField
              fullWidth
              label="Bitiş Tarihi"
              type="date"
              value={formData.dueDate}
              onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
              margin="normal"
              sx={{ mb: 2 }}
              InputLabelProps={{
                shrink: true,
              }}
              InputProps={{
                sx: { borderRadius: 1 }
              }}
            />
            <FormControl fullWidth margin="normal" sx={{ mb: 2 }}>
              <InputLabel>Atanan Kullanıcı</InputLabel>
              <Select
                value={formData.userId}
                onChange={(e) => setFormData({ ...formData, userId: e.target.value })}
                label="Atanan Kullanıcı"
                sx={{ borderRadius: 1 }}
              >
                <MenuItem value="">
                  <em>Atanmamış</em>
                </MenuItem>
                {users.map((user) => (
                  <MenuItem key={user.id} value={user.id.toString()}>
                    {user.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 2 }}>
            <Button 
              onClick={handleCloseDialog}
              sx={{ 
                textTransform: 'none',
                borderRadius: 1
              }}
            >
              İptal
            </Button>
            <Button 
              type="submit" 
              variant="contained"
              sx={{ 
                textTransform: 'none',
                borderRadius: 1,
                px: 3
              }}
            >
              {editingTask ? 'Güncelle' : 'Oluştur'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </Container>
  );
};

export default TasksPage; 