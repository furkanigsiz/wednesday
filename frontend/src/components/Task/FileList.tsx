import React, { useState, useRef } from 'react';
import {
  Box,
  Button,
  IconButton,
  Typography,
  List,
  ListItem,
  ListItemText,
  ImageList,
  ImageListItem,
  Modal,
  Backdrop,
  Fade,
  styled,
} from '@mui/material';
import {
  CloudUpload as CloudUploadIcon,
  FileDownload as FileDownloadIcon,
  Delete as DeleteIcon,
  ZoomIn as ZoomInIcon,
  ZoomOut as ZoomOutIcon,
  Close as CloseIcon,
} from '@mui/icons-material';
import { Task, TaskFile } from '../../types';
import { fileService } from '../../services/api';
import { useSnackbar } from 'notistack';

interface FileListProps {
  task: Task;
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

const FileList: React.FC<FileListProps> = ({ task }) => {
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

export default FileList; 