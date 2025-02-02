import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Paper,
  Typography,
  Button,
  TextField,
  IconButton,
  Chip,
  Tooltip,
  useTheme,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Visibility as ViewIcon,
  Search as SearchIcon,
  Share as ShareIcon,
  PersonRemove as PersonRemoveIcon,
} from '@mui/icons-material';
import { DataGrid, GridColDef, GridRenderCellParams } from '@mui/x-data-grid';
import { useSnackbar } from 'notistack';
import { customerService, userService } from '../../services/api';
import { Customer, CustomerStatus, User } from '../../types';
import { useAuth } from '../../context/AuthContext';

const CustomerListPage: React.FC = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const { enqueueSnackbar } = useSnackbar();
  const { user: currentUser } = useAuth();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<CustomerStatus | 'ALL'>('ALL');
  const [shareDialogOpen, setShareDialogOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);

  useEffect(() => {
    fetchCustomers();
    fetchUsers();
  }, []);

  const fetchCustomers = async () => {
    try {
      setLoading(true);
      const data = await customerService.getAll();
      setCustomers(data);
    } catch (error) {
      console.error('Müşteri listesi alınamadı:', error);
      enqueueSnackbar('Müşteri listesi yüklenirken bir hata oluştu', { variant: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      const data = await userService.getAll();
      setUsers(data.filter(u => u.id !== currentUser?.id)); // Mevcut kullanıcıyı listeden çıkar
    } catch (error) {
      console.error('Kullanıcı listesi alınamadı:', error);
    }
  };

  const handleDelete = async (id: number) => {
    if (window.confirm('Bu müşteriyi silmek istediğinizden emin misiniz?')) {
      try {
        await customerService.delete(id);
        enqueueSnackbar('Müşteri başarıyla silindi', { variant: 'success' });
        fetchCustomers();
      } catch (error) {
        console.error('Müşteri silinemedi:', error);
        enqueueSnackbar('Müşteri silinirken bir hata oluştu', { variant: 'error' });
      }
    }
  };

  const handleShareClick = (customer: Customer) => {
    setSelectedCustomer(customer);
    setShareDialogOpen(true);
  };

  const handleShare = async (targetUserId: number) => {
    if (!selectedCustomer) return;

    try {
      await customerService.shareWith(selectedCustomer.id, targetUserId);
      enqueueSnackbar('Müşteri başarıyla paylaşıldı', { variant: 'success' });
      fetchCustomers();
    } catch (error) {
      console.error('Müşteri paylaşılamadı:', error);
      enqueueSnackbar('Müşteri paylaşılırken bir hata oluştu', { variant: 'error' });
    }
  };

  const handleRemoveShare = async (customerId: number, targetUserId: number) => {
    try {
      await customerService.removeShare(customerId, targetUserId);
      enqueueSnackbar('Müşteri paylaşımı kaldırıldı', { variant: 'success' });
      fetchCustomers();
    } catch (error) {
      console.error('Müşteri paylaşımı kaldırılamadı:', error);
      enqueueSnackbar('Müşteri paylaşımı kaldırılırken bir hata oluştu', { variant: 'error' });
    }
  };

  const getStatusColor = (status: CustomerStatus) => {
    switch (status) {
      case 'LEAD':
        return theme.palette.info.main;
      case 'CONTACT':
        return theme.palette.warning.main;
      case 'OPPORTUNITY':
        return theme.palette.success.main;
      case 'CUSTOMER':
        return theme.palette.primary.main;
      case 'INACTIVE':
        return theme.palette.error.main;
      default:
        return theme.palette.grey[500];
    }
  };

  const getStatusLabel = (status: CustomerStatus): string => {
    const labels: Record<CustomerStatus, string> = {
      LEAD: 'Potansiyel',
      CONTACT: 'İletişimde',
      OPPORTUNITY: 'Fırsat',
      CUSTOMER: 'Müşteri',
      INACTIVE: 'Pasif'
    };
    return labels[status];
  };

  const columns: GridColDef[] = [
    {
      field: 'name',
      headerName: 'Müşteri Adı',
      flex: 1,
      renderCell: (params: GridRenderCellParams) => (
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <Typography variant="body2">{params.value}</Typography>
        </Box>
      ),
    },
    {
      field: 'email',
      headerName: 'E-posta',
      flex: 1,
    },
    {
      field: 'phone',
      headerName: 'Telefon',
      flex: 1,
    },
    {
      field: 'status',
      headerName: 'Durum',
      flex: 1,
      renderCell: (params: GridRenderCellParams) => (
        <Chip
          label={getStatusLabel(params.value as CustomerStatus)}
          size="small"
          sx={{
            backgroundColor: getStatusColor(params.value as CustomerStatus),
            color: '#fff',
          }}
        />
      ),
    },
    {
      field: 'sharedWith',
      headerName: 'Paylaşılan Kullanıcılar',
      flex: 1,
      renderCell: (params: GridRenderCellParams) => {
        const customer = params.row as Customer;
        const isOwner = customer.userId === currentUser?.id;
        
        return (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            {customer.sharedWith?.map((sharedUser: User) => (
              <Chip
                key={sharedUser.id}
                label={sharedUser.name}
                size="small"
                onDelete={isOwner ? () => handleRemoveShare(customer.id, sharedUser.id) : undefined}
                sx={{ mr: 0.5 }}
              />
            ))}
            {isOwner && (
              <Tooltip title="Paylaş">
                <IconButton size="small" onClick={() => handleShareClick(customer)}>
                  <ShareIcon />
                </IconButton>
              </Tooltip>
            )}
          </Box>
        );
      },
    },
    {
      field: 'actions',
      headerName: 'İşlemler',
      flex: 1,
      sortable: false,
      renderCell: (params: GridRenderCellParams) => (
        <Box>
          <Tooltip title="Görüntüle">
            <IconButton
              size="small"
              onClick={() => navigate(`/crm/customers/${params.row.id}`)}
            >
              <ViewIcon />
            </IconButton>
          </Tooltip>
          <Tooltip title="Düzenle">
            <IconButton
              size="small"
              onClick={() => navigate(`/crm/customers/${params.row.id}/edit`)}
            >
              <EditIcon />
            </IconButton>
          </Tooltip>
          <Tooltip title="Sil">
            <IconButton
              size="small"
              onClick={() => handleDelete(params.row.id)}
            >
              <DeleteIcon />
            </IconButton>
          </Tooltip>
        </Box>
      ),
    },
  ];

  const filteredCustomers = customers.filter(customer => {
    const matchesSearch = 
      customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      customer.email.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'ALL' || customer.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  return (
    <Box>
      <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h4" component="h1">
          Müşteriler
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => navigate('/crm/customers/new')}
        >
          Yeni Müşteri
        </Button>
      </Box>

      <Paper sx={{ p: 2, mb: 2 }}>
        <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
          <TextField
            size="small"
            placeholder="Ara..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            InputProps={{
              startAdornment: <SearchIcon sx={{ mr: 1, color: 'text.secondary' }} />,
            }}
            sx={{ flex: 1 }}
          />
          <FormControl size="small" sx={{ minWidth: 200 }}>
            <InputLabel>Durum</InputLabel>
            <Select
              value={statusFilter}
              label="Durum"
              onChange={(e) => setStatusFilter(e.target.value as CustomerStatus | 'ALL')}
            >
              <MenuItem value="ALL">Tümü</MenuItem>
              <MenuItem value="LEAD">Potansiyel</MenuItem>
              <MenuItem value="CONTACT">İletişimde</MenuItem>
              <MenuItem value="OPPORTUNITY">Fırsat</MenuItem>
              <MenuItem value="CUSTOMER">Müşteri</MenuItem>
              <MenuItem value="INACTIVE">Pasif</MenuItem>
            </Select>
          </FormControl>
        </Box>

        <DataGrid
          rows={filteredCustomers}
          columns={columns}
          loading={loading}
          autoHeight
          pageSizeOptions={[10, 25, 50]}
          initialState={{
            pagination: { paginationModel: { pageSize: 10 } },
          }}
          disableRowSelectionOnClick
          sx={{
            '& .MuiDataGrid-cell': {
              borderBottom: `1px solid ${theme.palette.divider}`,
            },
          }}
        />
      </Paper>

      <Dialog open={shareDialogOpen} onClose={() => setShareDialogOpen(false)}>
        <DialogTitle>Müşteriyi Paylaş</DialogTitle>
        <DialogContent>
          <List>
            {users.map((user) => (
              <ListItem key={user.id} button onClick={() => handleShare(user.id)}>
                <ListItemText primary={user.name} secondary={user.email} />
              </ListItem>
            ))}
          </List>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShareDialogOpen(false)}>Kapat</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default CustomerListPage; 