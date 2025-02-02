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
  FormControlLabel,
  Switch,
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
} from '@mui/icons-material';
import { projectService } from '../../services/api';
import { Project } from '../../types';

const ProjectsPage: React.FC = () => {
  const theme = useTheme();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    isPrivate: false,
  });

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
    if (project) {
      setEditingProject(project);
      setFormData({
        name: project.name,
        description: project.description,
        isPrivate: project.isPrivate,
      });
    } else {
      setEditingProject(null);
      setFormData({
        name: '',
        description: '',
        isPrivate: false,
      });
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditingProject(null);
    setFormData({
      name: '',
      description: '',
      isPrivate: false,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
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
                <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Durum</TableCell>
                <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Oluşturulma Tarihi</TableCell>
                <TableCell align="right" sx={{ color: 'white', fontWeight: 'bold' }}>İşlemler</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredProjects.length > 0 ? (
                filteredProjects.map((project) => (
                  <TableRow 
                    key={project.id}
                    sx={{ 
                      '&:hover': { 
                        backgroundColor: theme.palette.action.hover 
                      }
                    }}
                  >
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        {project.isPrivate ? (
                          <LockIcon fontSize="small" sx={{ color: theme.palette.warning.main }} />
                        ) : (
                          <PublicIcon fontSize="small" sx={{ color: theme.palette.success.main }} />
                        )}
                        {project.name}
                      </Box>
                    </TableCell>
                    <TableCell>{project.description}</TableCell>
                    <TableCell>
                      <Chip
                        label={project.isPrivate ? 'Özel' : 'Genel'}
                        size="small"
                        color={project.isPrivate ? 'warning' : 'success'}
                        sx={{ borderRadius: 1 }}
                      />
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <CalendarIcon fontSize="small" sx={{ color: theme.palette.text.secondary }} />
                        {new Date(project.createdAt).toLocaleDateString('tr-TR')}
                      </Box>
                    </TableCell>
                    <TableCell align="right">
                      <Tooltip title="Düzenle">
                        <IconButton
                          color="primary"
                          onClick={() => handleOpenDialog(project)}
                          sx={{ 
                            '&:hover': { 
                              backgroundColor: theme.palette.primary.light 
                            }
                          }}
                        >
                          <EditIcon />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Sil">
                        <IconButton
                          color="error"
                          onClick={() => handleDeleteProject(project.id)}
                          sx={{ 
                            '&:hover': { 
                              backgroundColor: theme.palette.error.light 
                            }
                          }}
                        >
                          <DeleteIcon />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell 
                    colSpan={5} 
                    align="center"
                    sx={{ 
                      py: 4,
                      color: theme.palette.text.secondary
                    }}
                  >
                    {error ? 'Bir hata oluştu' : 'Henüz proje bulunmuyor'}
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
        <DialogTitle sx={{ 
          pb: 1,
          color: theme.palette.primary.main,
          fontWeight: 'bold'
        }}>
          {editingProject ? 'Projeyi Düzenle' : 'Yeni Proje Oluştur'}
        </DialogTitle>
        <form onSubmit={handleSubmit}>
          <DialogContent sx={{ pb: 2 }}>
            <TextField
              fullWidth
              label="Proje Adı"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
              sx={{ mb: 3 }}
              InputProps={{
                sx: { borderRadius: 1 }
              }}
            />
            <TextField
              fullWidth
              label="Açıklama"
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              multiline
              rows={4}
              sx={{ mb: 3 }}
              InputProps={{
                sx: { borderRadius: 1 }
              }}
            />
            <FormControlLabel
              control={
                <Switch
                  checked={formData.isPrivate}
                  onChange={(e) =>
                    setFormData({ ...formData, isPrivate: e.target.checked })
                  }
                  color="primary"
                />
              }
              label={
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  {formData.isPrivate ? (
                    <LockIcon fontSize="small" sx={{ color: theme.palette.warning.main }} />
                  ) : (
                    <PublicIcon fontSize="small" sx={{ color: theme.palette.success.main }} />
                  )}
                  <Typography>
                    {formData.isPrivate ? 'Özel Proje' : 'Genel Proje'}
                  </Typography>
                </Box>
              }
            />
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
              {editingProject ? 'Güncelle' : 'Oluştur'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </Container>
  );
};

export default ProjectsPage; 