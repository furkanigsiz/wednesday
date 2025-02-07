import React, { useState, useEffect, useMemo } from 'react';
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
  Alert,
  CircularProgress,
  useTheme,
  Chip,
  Tooltip,
  InputAdornment,
  Card,
  CardContent,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Search as SearchIcon,
  Public as PublicIcon,
  Lock as LockIcon,
  CalendarToday as CalendarIcon,
  Business as BusinessIcon,
} from '@mui/icons-material';
import { projectService } from '../../services/api';
import { Project } from '../../types';
import ProjectForm from './ProjectForm';

const ProjectsPage: React.FC = () => {
  const theme = useTheme();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [editingProject, setEditingProject] = useState<Project | null>(null);

  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    try {
      setLoading(true);
      const data = await projectService.getAll();
      setProjects(data || []);
    } catch (err) {
      console.error('Proje yükleme hatası:', err);
      setError('Projeler yüklenirken bir hata oluştu.');
      setProjects([]);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = (project?: Project) => {
    setEditingProject(project || null);
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditingProject(null);
  };

  const handleSubmit = async (formData: Partial<Project>) => {
    try {
      if (editingProject) {
        await projectService.update(editingProject.id, formData);
      } else {
        await projectService.create(formData);
      }
      handleCloseDialog();
      fetchProjects();
    } catch (err) {
      setError('Proje kaydedilirken bir hata oluştu.');
    }
  };

  const handleDeleteProject = async (id: number) => {
    if (window.confirm('Bu projeyi silmek istediğinizden emin misiniz?')) {
      try {
        await projectService.delete(id);
        fetchProjects();
      } catch (err) {
        setError('Proje silinirken bir hata oluştu.');
      }
    }
  };

  const filteredProjects = useMemo(() => {
    return projects.filter(
      (project) =>
        project.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        project.description.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [projects, searchTerm]);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Container maxWidth="lg">
      <Box sx={{ mt: 4, mb: 4 }}>
        <Box sx={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center', 
          mb: 4,
          flexWrap: 'wrap',
          gap: 2
        }}>
          <Typography 
            variant="h4" 
            component="h1"
            sx={{ 
              fontWeight: 'bold',
              color: theme.palette.primary.main
            }}
          >
            Projeler ({projects.length})
          </Typography>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => handleOpenDialog()}
            sx={{
              borderRadius: 2,
              textTransform: 'none',
              px: 3,
              py: 1,
              backgroundColor: theme.palette.primary.main,
              '&:hover': {
                backgroundColor: theme.palette.primary.dark,
              },
            }}
          >
            Yeni Proje
          </Button>
        </Box>

        {error && (
          <Alert 
            severity="error" 
            sx={{ 
              mb: 3,
              borderRadius: 2
            }}
          >
            {error}
          </Alert>
        )}

        <Card 
          elevation={2}
          sx={{ 
            mb: 3,
            borderRadius: 2,
            backgroundColor: theme.palette.background.paper
          }}
        >
          <CardContent sx={{ p: 2 }}>
            <TextField
              fullWidth
              variant="outlined"
              placeholder="Projelerde ara..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon sx={{ color: 'text.secondary' }} />
                  </InputAdornment>
                ),
                sx: {
                  borderRadius: 2,
                  backgroundColor: theme.palette.background.default,
                }
              }}
            />
          </CardContent>
        </Card>

        <TableContainer 
          component={Paper} 
          elevation={2}
          sx={{ 
            borderRadius: 2,
            overflow: 'hidden'
          }}
        >
          <Table>
            <TableHead>
              <TableRow sx={{ backgroundColor: theme.palette.primary.main }}>
                <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Proje Adı</TableCell>
                <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Açıklama</TableCell>
                <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Müşteri</TableCell>
                <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Durum</TableCell>
                <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Oluşturulma Tarihi</TableCell>
                <TableCell align="right" sx={{ color: 'white', fontWeight: 'bold' }}>İşlemler</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredProjects.length > 0 ? (
                filteredProjects.map((project) => (
                  <TableRow key={project.id}>
                    <TableCell>{project.name}</TableCell>
                    <TableCell>{project.description}</TableCell>
                    <TableCell>
                      {project.customer ? (
                        <Chip
                          icon={<BusinessIcon />}
                          label={project.customer.company 
                            ? `${project.customer.name} (${project.customer.company})`
                            : project.customer.name}
                          size="small"
                          color="primary"
                          variant="outlined"
                        />
                      ) : (
                        <Typography variant="caption" color="text.secondary">
                          -
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell>
                      <Chip
                        icon={project.isPrivate ? <LockIcon /> : <PublicIcon />}
                        label={project.isPrivate ? 'Özel' : 'Genel'}
                        size="small"
                        color={project.isPrivate ? 'secondary' : 'default'}
                      />
                    </TableCell>
                    <TableCell>
                      <Tooltip title={new Date(project.createdAt).toLocaleString()}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <CalendarIcon fontSize="small" color="action" />
                          <Typography variant="body2">
                            {new Date(project.createdAt).toLocaleDateString()}
                          </Typography>
                        </Box>
                      </Tooltip>
                    </TableCell>
                    <TableCell align="right">
                      {project.isOwner && (
                        <>
                          <IconButton
                            size="small"
                            onClick={() => handleOpenDialog(project)}
                            sx={{ color: theme.palette.primary.main }}
                          >
                            <EditIcon />
                          </IconButton>
                          <IconButton
                            size="small"
                            onClick={() => handleDeleteProject(project.id)}
                            sx={{ color: theme.palette.error.main }}
                          >
                            <DeleteIcon />
                          </IconButton>
                        </>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={6} align="center">
                    <Typography variant="body2" color="text.secondary">
                      {searchTerm ? 'Arama kriterlerine uygun proje bulunamadı.' : 'Henüz proje bulunmuyor.'}
                    </Typography>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
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
        <DialogTitle>
          {editingProject ? 'Projeyi Düzenle' : 'Yeni Proje Oluştur'}
        </DialogTitle>
        <DialogContent>
          <ProjectForm
            onSubmit={handleSubmit}
            initialData={editingProject || undefined}
          />
        </DialogContent>
      </Dialog>
    </Container>
  );
};

export default ProjectsPage; 