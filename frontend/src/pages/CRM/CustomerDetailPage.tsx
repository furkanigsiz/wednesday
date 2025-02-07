import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Paper,
  Grid,
  Chip,
  Button,
  CircularProgress,
  Divider,
  List,
  ListItem,
  ListItemText,
  IconButton,
  useTheme,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  Card,
  CardContent,
  CardHeader,
  Avatar,
  ToggleButtonGroup,
  ToggleButton,
  Tooltip,
  InputAdornment,
  Collapse,
  Tabs,
  Tab,
  TableContainer,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  Menu,
  MenuItem as MuiMenuItem,
  ListItemIcon,
} from '@mui/material';
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  Email as EmailIcon,
  Phone as PhoneIcon,
  Business as BusinessIcon,
  Person as PersonIcon,
  Share as ShareIcon,
  PersonRemove as PersonRemoveIcon,
  Add as AddIcon,
  PhoneInTalk as PhoneInTalkIcon,
  Email as MailIcon,
  MeetingRoom as MeetingRoomIcon,
  Chat as ChatIcon,
  Search as SearchIcon,
  ArrowUpward as ArrowUpwardIcon,
  ArrowDownward as ArrowDownwardIcon,
  SortByAlpha as SortByAlphaIcon,
  Assessment as AssessmentIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  Receipt as ReceiptIcon,
  AccountBalance as AccountBalanceIcon,
  FolderOpen as ProjectIcon,
  Assignment as TaskIcon,
  CheckCircle as CompletedIcon,
  Schedule as PendingIcon,
  Warning as StuckIcon,
  PriorityHigh,
  Error,
  LowPriority,
  LinearScale,
  Schedule,
  Person,
  ArrowForward,
} from '@mui/icons-material';
import { useSnackbar } from 'notistack';
import { customerService, userService, interactionService } from '../../services/api';
import { api } from '../../services/api';
import { Customer, CustomerStatus, User, Interaction, InteractionType, Project, Task } from '../../types';
import { useAuth } from '../../context/AuthContext';
import InvoiceForm from '../../components/forms/InvoiceForm';
import PaymentForm from '../../components/forms/PaymentForm';
import {
  Timeline,
  TimelineItem,
  TimelineSeparator,
  TimelineConnector,
  TimelineContent,
  TimelineDot,
} from '@mui/lab';

type SortOrder = 'asc' | 'desc';
type SortField = 'createdAt' | 'type';

interface Invoice {
  id: number;
  number: string;
  issueDate: string;
  dueDate: string;
  status: 'DRAFT' | 'SENT' | 'PAID' | 'PARTIALLY_PAID' | 'OVERDUE' | 'CANCELLED';
  totalAmount: number;
  items: InvoiceItem[];
  payments: Payment[];
}

interface InvoiceItem {
  id: number;
  description: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

interface Payment {
  id: number;
  amount: number;
  paymentDate: string;
  method: 'BANK_TRANSFER' | 'CREDIT_CARD' | 'CASH' | 'CHECK' | 'OTHER';
  status: 'PENDING' | 'COMPLETED' | 'FAILED' | 'REFUNDED';
  reference?: string;
}

const getInteractionLabel = (type: InteractionType): string => {
  switch (type) {
    case 'PHONE':
      return 'Telefon';
    case 'EMAIL':
      return 'E-posta';
    case 'MEETING':
      return 'Toplantı';
    case 'NOTE':
      return 'Not';
    default:
      return type;
  }
};

// Fatura durumlarını Türkçeleştirmek için yardımcı fonksiyon
const getInvoiceStatusLabel = (status: string): string => {
  const statusMap: Record<string, string> = {
    'DRAFT': 'Hazırlanıyor',
    'SENT': 'Fatura Gönderildi',
    'PAID': 'Tamamen Ödendi',
    'PARTIALLY_PAID': 'Kısmi Ödeme Yapıldı',
    'OVERDUE': 'Ödeme Gecikti',
    'CANCELLED': 'İptal Edildi'
  };
  return statusMap[status] || status;
};

const CustomerDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const theme = useTheme();
  const { enqueueSnackbar } = useSnackbar();
  const { user: currentUser } = useAuth();
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState<User[]>([]);
  const [shareDialogOpen, setShareDialogOpen] = useState(false);
  const [interactions, setInteractions] = useState<Interaction[]>([]);
  const [interactionDialogOpen, setInteractionDialogOpen] = useState(false);
  const [interactionForm, setInteractionForm] = useState({
    type: 'PHONE',
    notes: '',
  });
  const [selectedTypes, setSelectedTypes] = useState<InteractionType[]>([]);
  const [editingInteraction, setEditingInteraction] = useState<Interaction | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortConfig, setSortConfig] = useState<{ field: SortField; order: SortOrder }>({
    field: 'createdAt',
    order: 'desc'
  });
  const [statsExpanded, setStatsExpanded] = useState(true);
  const [interactionsExpanded, setInteractionsExpanded] = useState(true);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [invoiceDialogOpen, setInvoiceDialogOpen] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);
  const [activeTab, setActiveTab] = useState(0);
  const [statusMenuAnchor, setStatusMenuAnchor] = useState<null | HTMLElement>(null);
  const [selectedInvoiceForStatus, setSelectedInvoiceForStatus] = useState<Invoice | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [projectTasks, setProjectTasks] = useState<Task[]>([]);

  const handleSort = (field: SortField) => {
    setSortConfig(prev => ({
      field,
      order: prev.field === field && prev.order === 'desc' ? 'asc' : 'desc'
    }));
  };

  const filteredInteractions = useMemo(() => {
    let filtered = interactions;
    
    // Tür filtreleme
    if (selectedTypes.length > 0) {
      filtered = filtered.filter(interaction => selectedTypes.includes(interaction.type));
    }
    
    // Metin arama
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      filtered = filtered.filter(interaction =>
        interaction.notes.toLowerCase().includes(query) ||
        interaction.createdBy.name.toLowerCase().includes(query)
      );
    }

    // Sıralama
    return [...filtered].sort((a, b) => {
      if (sortConfig.field === 'createdAt') {
        const dateA = new Date(a.createdAt).getTime();
        const dateB = new Date(b.createdAt).getTime();
        return sortConfig.order === 'asc' ? dateA - dateB : dateB - dateA;
      } else {
        const labelA = getInteractionLabel(a.type);
        const labelB = getInteractionLabel(b.type);
        return sortConfig.order === 'asc'
          ? labelA.localeCompare(labelB)
          : labelB.localeCompare(labelA);
      }
    });
  }, [interactions, selectedTypes, searchQuery, sortConfig]);

  const interactionStats = useMemo(() => {
    const stats = {
      total: interactions.length,
      byType: {
        PHONE: 0,
        EMAIL: 0,
        MEETING: 0,
        NOTE: 0
      },
      lastInteraction: interactions[0]?.createdAt ? new Date(interactions[0].createdAt) : null
    };

    interactions.forEach(interaction => {
      stats.byType[interaction.type]++;
    });

    return stats;
  }, [interactions]);

  useEffect(() => {
    const fetchCustomer = async () => {
      try {
        if (!id) return;
        const data = await customerService.getById(parseInt(id));
        setCustomer(data);
      } catch (error) {
        console.error('Müşteri bilgileri alınamadı:', error);
        enqueueSnackbar('Müşteri bilgileri yüklenirken bir hata oluştu', { variant: 'error' });
        navigate('/crm/customers');
      } finally {
        setLoading(false);
      }
    };

    const fetchUsers = async () => {
      try {
        const data = await userService.getAll();
        // Mevcut kullanıcıyı ve zaten paylaşılmış kullanıcıları listeden çıkar
        const filteredUsers = data.filter(u => 
          u.id !== currentUser?.id && 
          !customer?.sharedWith?.some(sw => sw.id === u.id)
        );
        setUsers(filteredUsers);
      } catch (error) {
        console.error('Kullanıcı listesi alınamadı:', error);
        enqueueSnackbar('Kullanıcı listesi yüklenirken bir hata oluştu', { variant: 'error' });
      }
    };

    const fetchInteractions = async () => {
      try {
        if (!id) return;
        const data = await interactionService.getAll(parseInt(id));
        setInteractions(data);
      } catch (error) {
        console.error('Etkileşim geçmişi alınamadı:', error);
        enqueueSnackbar('Etkileşim geçmişi yüklenirken bir hata oluştu', { variant: 'error' });
      }
    };

    const fetchInvoices = async () => {
      try {
        if (!id) return;
        const response = await api.get(`/api/crm/customers/${id}/invoices`, {
          params: {
            include: 'items,payments'
          }
        });
        setInvoices(response.data);
      } catch (error) {
        console.error('Faturalar yüklenemedi:', error);
        enqueueSnackbar('Faturalar yüklenirken bir hata oluştu', { variant: 'error' });
      }
    };

    const fetchProjects = async () => {
      try {
        if (!id) return;
        const response = await api.get(`/api/crm/customers/${id}/projects`);
        setProjects(response.data);
      } catch (error) {
        console.error('Projeler yüklenemedi:', error);
        enqueueSnackbar('Projeler yüklenirken bir hata oluştu', { variant: 'error' });
      }
    };

    fetchCustomer();
    fetchUsers();
    fetchInteractions();
    fetchInvoices();
    fetchProjects();
  }, [id, navigate, enqueueSnackbar, currentUser?.id, customer?.sharedWith]);

  useEffect(() => {
    const fetchProjectTasks = async () => {
      try {
        if (!selectedProject?.id) return;
        const response = await api.get(`/api/tasks`, {
          params: {
            projectId: selectedProject.id
          }
        });
        setProjectTasks(response.data.tasks || []);
      } catch (error) {
        console.error('Görevler yüklenemedi:', error);
        enqueueSnackbar('Görevler yüklenirken bir hata oluştu', { variant: 'error' });
        setProjectTasks([]);
      }
    };

    if (selectedProject) {
      fetchProjectTasks();
    } else {
      setProjectTasks([]);
    }
  }, [selectedProject, enqueueSnackbar]);

  const handleShare = async (targetUserId: number) => {
    try {
      if (!customer) return;
      await customerService.shareWith(customer.id, targetUserId);
      enqueueSnackbar('Müşteri başarıyla paylaşıldı', { variant: 'success' });
      // Müşteri bilgilerini yeniden yükle
      const updatedCustomer = await customerService.getById(customer.id);
      setCustomer(updatedCustomer);
      setShareDialogOpen(false);
    } catch (error) {
      console.error('Müşteri paylaşılamadı:', error);
      enqueueSnackbar('Müşteri paylaşılırken bir hata oluştu', { variant: 'error' });
    }
  };

  const handleRemoveShare = async (targetUserId: number) => {
    try {
      if (!customer) return;
      await customerService.removeShare(customer.id, targetUserId);
      enqueueSnackbar('Paylaşım başarıyla kaldırıldı', { variant: 'success' });
      // Müşteri bilgilerini yeniden yükle
      const updatedCustomer = await customerService.getById(customer.id);
      setCustomer(updatedCustomer);
    } catch (error) {
      console.error('Paylaşım kaldırılamadı:', error);
      enqueueSnackbar('Paylaşım kaldırılırken bir hata oluştu', { variant: 'error' });
    }
  };

  const handleEditInteraction = (interaction: Interaction) => {
    setEditingInteraction(interaction);
    setInteractionForm({
      type: interaction.type,
      notes: interaction.notes,
    });
    setInteractionDialogOpen(true);
  };

  const handleInteractionSubmit = async () => {
    try {
      if (!id) return;
      
      if (editingInteraction) {
        // Etkileşimi güncelle
        await interactionService.update(parseInt(id), editingInteraction.id, {
          type: interactionForm.type as InteractionType,
          notes: interactionForm.notes,
          customerId: parseInt(id),
        });
      } else {
        // Yeni etkileşim oluştur
        await interactionService.create({
          customerId: parseInt(id),
          type: interactionForm.type as InteractionType,
          notes: interactionForm.notes,
        });
      }
      
      // Etkileşimleri yeniden yükle
      const updatedInteractions = await interactionService.getAll(parseInt(id));
      setInteractions(updatedInteractions);
      
      setInteractionDialogOpen(false);
      setInteractionForm({ type: 'PHONE', notes: '' });
      setEditingInteraction(null);
      enqueueSnackbar(
        editingInteraction 
          ? 'Etkileşim başarıyla güncellendi' 
          : 'Etkileşim başarıyla kaydedildi', 
        { variant: 'success' }
      );
    } catch (error) {
      console.error('Etkileşim işlemi başarısız:', error);
      enqueueSnackbar(
        editingInteraction 
          ? 'Etkileşim güncellenirken bir hata oluştu'
          : 'Etkileşim kaydedilirken bir hata oluştu',
        { variant: 'error' }
      );
    }
  };

  const handleCloseDialog = () => {
    setInteractionDialogOpen(false);
    setInteractionForm({ type: 'PHONE', notes: '' });
    setEditingInteraction(null);
  };

  const handleDeleteInteraction = async (interactionId: number) => {
    try {
      if (!id) return;
      await interactionService.delete(parseInt(id), interactionId);
      
      // Etkileşimleri yeniden yükle
      const updatedInteractions = await interactionService.getAll(parseInt(id));
      setInteractions(updatedInteractions);
      
      enqueueSnackbar('Etkileşim başarıyla silindi', { variant: 'success' });
    } catch (error) {
      console.error('Etkileşim silinemedi:', error);
      enqueueSnackbar('Etkileşim silinirken bir hata oluştu', { variant: 'error' });
    }
  };

  const getStatusColor = (status: CustomerStatus) => {
    const colors = {
      LEAD: theme.palette.info.main,
      CONTACT: theme.palette.warning.main,
      OPPORTUNITY: theme.palette.success.main,
      CUSTOMER: theme.palette.primary.main,
      INACTIVE: theme.palette.error.main,
    };
    return colors[status];
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

  const getInteractionIcon = (type: InteractionType) => {
    const icons = {
      PHONE: <PhoneInTalkIcon />,
      EMAIL: <MailIcon />,
      MEETING: <MeetingRoomIcon />,
      NOTE: <ChatIcon />,
    };
    return icons[type];
  };

  const handleDelete = async () => {
    if (!customer || !window.confirm('Bu müşteriyi silmek istediğinizden emin misiniz?')) return;

    try {
      await customerService.delete(customer.id);
      enqueueSnackbar('Müşteri başarıyla silindi', { variant: 'success' });
      navigate('/crm/customers');
    } catch (error) {
      console.error('Müşteri silinemedi:', error);
      enqueueSnackbar('Müşteri silinirken bir hata oluştu', { variant: 'error' });
    }
  };

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };

  const financialSummary = useMemo(() => {
    const summary = {
      totalInvoiced: 0,
      totalPaid: 0,
      overdue: 0,
      pending: 0
    };

    const today = new Date();

    invoices.forEach(invoice => {
      summary.totalInvoiced += invoice.totalAmount;
      
      // Eğer payments undefined ise boş array olarak kabul et
      const payments = invoice.payments || [];
      const totalPaid = payments.reduce((sum, payment) => 
        payment.status === 'COMPLETED' ? sum + payment.amount : sum, 0);
      
      summary.totalPaid += totalPaid;

      const remainingAmount = invoice.totalAmount - totalPaid;
      const dueDate = new Date(invoice.dueDate);
      
      // Vadesi geçmiş tutarlar
      if (dueDate < today && remainingAmount > 0 && invoice.status !== 'PAID') {
        summary.overdue += remainingAmount;
      } 
      // Bekleyen tahsilatlar (vadesi gelmemiş)
      else if (dueDate >= today && remainingAmount > 0 && invoice.status !== 'PAID') {
        summary.pending += remainingAmount;
      }
    });

    return summary;
  }, [invoices]);

  const handleCreateInvoice = async (formData: any) => {
    try {
      if (!id) return;
      const response = await api.post(`/api/crm/customers/${id}/invoices`, formData);
      setInvoices(prev => [response.data, ...prev]);
      setInvoiceDialogOpen(false);
      enqueueSnackbar('Fatura başarıyla oluşturuldu', { variant: 'success' });
    } catch (error) {
      console.error('Fatura oluşturulamadı:', error);
      enqueueSnackbar('Fatura oluşturulurken bir hata oluştu', { variant: 'error' });
    }
  };

  const handleCreatePayment = async (invoiceId: number, formData: any) => {
    try {
      const response = await api.post(`/api/crm/invoices/${invoiceId}/payments`, formData);
      
      // Faturaları yeniden yükle
      if (id) {
        const invoicesResponse = await api.get(`/api/crm/customers/${id}/invoices`);
        setInvoices(invoicesResponse.data);
      }
      
      setPaymentDialogOpen(false);
      enqueueSnackbar('Ödeme başarıyla kaydedildi', { variant: 'success' });
    } catch (error) {
      console.error('Ödeme kaydedilemedi:', error);
      enqueueSnackbar('Ödeme kaydedilirken bir hata oluştu', { variant: 'error' });
    }
  };

  const handleUpdateInvoiceStatus = async (invoiceId: number, newStatus: string) => {
    try {
      await api.patch(`/api/crm/invoices/${invoiceId}/status`, { status: newStatus });
      
      // Faturaları yeniden yükle
      const response = await api.get(`/api/crm/customers/${id}/invoices`, {
        params: {
          include: 'items,payments'
        }
      });
      setInvoices(response.data);
      
      enqueueSnackbar('Fatura durumu güncellendi', { variant: 'success' });
    } catch (error) {
      console.error('Fatura durumu güncellenemedi:', error);
      enqueueSnackbar('Fatura durumu güncellenirken bir hata oluştu', { variant: 'error' });
    } finally {
      setStatusMenuAnchor(null);
      setSelectedInvoiceForStatus(null);
    }
  };

  const getTaskStatusIcon = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return <CompletedIcon color="success" />;
      case 'IN_PROGRESS':
        return <PendingIcon color="primary" />;
      case 'STUCK':
        return <StuckIcon color="error" />;
      default:
        return <TaskIcon color="action" />;
    }
  };

  const getTaskStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      'NOT_STARTED': 'Başlanmadı',
      'IN_PROGRESS': 'Devam Ediyor',
      'STUCK': 'Takıldı',
      'COMPLETED': 'Tamamlandı'
    };
    return labels[status] || status;
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!customer) {
    return null;
  }

  const canManageSharing = customer.userId === currentUser?.id;
  
  console.log('Debug Bilgileri:');
  console.log('Müşteri ID:', customer.userId);
  console.log('Mevcut Kullanıcı ID:', currentUser?.id);
  console.log('canManageSharing:', canManageSharing);

  return (
    <Box>
      <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h4">
          Müşteri Detayları
        </Typography>
        <Box sx={{ display: 'flex', gap: 2 }}>
          {canManageSharing && (
            <Button
              variant="contained"
              startIcon={<ShareIcon />}
              onClick={() => setShareDialogOpen(true)}
            >
              Paylaş
            </Button>
          )}
          {canManageSharing && (
            <Button
              variant="outlined"
              startIcon={<EditIcon />}
              onClick={() => navigate(`/crm/customers/${customer.id}/edit`)}
            >
              Düzenle
            </Button>
          )}
          {canManageSharing && (
            <Button
              variant="outlined"
              color="error"
              startIcon={<DeleteIcon />}
              onClick={handleDelete}
            >
              Sil
            </Button>
          )}
        </Box>
      </Box>

      <Tabs value={activeTab} onChange={handleTabChange}>
        <Tab label="Müşteri Bilgileri" />
        <Tab label="Müşteri İstatistikleri" />
        <Tab label="Müşteri Etkileşimleri" />
        <Tab label="Finansal Bilgiler" />
        <Tab label="Müşteri Projeleri" />
      </Tabs>

      {activeTab === 0 && (
        <Grid container spacing={3}>
          <Grid item xs={12} md={8}>
            <Paper sx={{ p: 3, mb: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Typography variant="h5" sx={{ flexGrow: 1 }}>
                  Müşteri Detay Bilgileri
                </Typography>
                <Chip
                  label={getStatusLabel(customer.status)}
                  sx={{
                    backgroundColor: getStatusColor(customer.status),
                    color: '#fff',
                  }}
                />
              </Box>
              
              <Divider sx={{ my: 2 }} />

              <Grid container spacing={2}>
                {customer.company && (
                  <Grid item xs={12} sm={6}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <BusinessIcon color="action" />
                      <Typography>{customer.company}</Typography>
                    </Box>
                  </Grid>
                )}
                
                {customer.role && (
                  <Grid item xs={12} sm={6}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <PersonIcon color="action" />
                      <Typography>{customer.role}</Typography>
                    </Box>
                  </Grid>
                )}

                <Grid item xs={12} sm={6}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <EmailIcon color="action" />
                    <Typography>{customer.email}</Typography>
                  </Box>
                </Grid>

                {customer.phone && (
                  <Grid item xs={12} sm={6}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <PhoneIcon color="action" />
                      <Typography>{customer.phone}</Typography>
                    </Box>
                  </Grid>
                )}
              </Grid>

              {customer.notes && (
                <>
                  <Divider sx={{ my: 2 }} />
                  <Typography variant="h6" sx={{ mb: 1 }}>Notlar</Typography>
                  <Typography>{customer.notes}</Typography>
                </>
              )}
            </Paper>

            {/* İstatistikler Kartı */}
            <Card sx={{ mb: 3 }}>
              <CardHeader
                avatar={
                  <Avatar sx={{ bgcolor: theme.palette.primary.main }}>
                    <AssessmentIcon />
                  </Avatar>
                }
                title={
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Typography variant="h6">Müşteri İletişim İstatistikleri</Typography>
                    <IconButton
                      onClick={() => setStatsExpanded(!statsExpanded)}
                      aria-expanded={statsExpanded}
                      aria-label="istatistikleri göster/gizle"
                      size="small"
                    >
                      {statsExpanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                    </IconButton>
                  </Box>
                }
                sx={{ 
                  borderBottom: statsExpanded ? 1 : 0, 
                  borderColor: 'divider',
                  '& .MuiCardHeader-content': { flex: '1 1 auto' },
                  '& .MuiCardHeader-action': { margin: 0 }
                }}
              />
              <Collapse in={statsExpanded} timeout="auto" unmountOnExit>
                <CardContent>
                  <Grid container spacing={2}>
                    <Grid item xs={12} sm={6} md={3}>
                      <Typography variant="subtitle2" color="textSecondary">
                        Toplam Etkileşim
                      </Typography>
                      <Typography variant="h4">
                        {interactionStats.total}
                      </Typography>
                    </Grid>
                    <Grid item xs={12} sm={6} md={3}>
                      <Typography variant="subtitle2" color="textSecondary">
                        Telefon Görüşmeleri
                      </Typography>
                      <Typography variant="h4">
                        {interactionStats.byType.PHONE}
                      </Typography>
                    </Grid>
                    <Grid item xs={12} sm={6} md={3}>
                      <Typography variant="subtitle2" color="textSecondary">
                        E-posta Yazışmaları
                      </Typography>
                      <Typography variant="h4">
                        {interactionStats.byType.EMAIL}
                      </Typography>
                    </Grid>
                    <Grid item xs={12} sm={6} md={3}>
                      <Typography variant="subtitle2" color="textSecondary">
                        Toplantılar
                      </Typography>
                      <Typography variant="h4">
                        {interactionStats.byType.MEETING}
                      </Typography>
                    </Grid>
                    <Grid item xs={12}>
                      <Typography variant="subtitle2" color="textSecondary">
                        Son Etkileşim
                      </Typography>
                      <Typography>
                        {interactionStats.lastInteraction 
                          ? new Intl.DateTimeFormat('tr-TR', { 
                              dateStyle: 'full', 
                              timeStyle: 'short' 
                            }).format(interactionStats.lastInteraction)
                          : 'Henüz etkileşim yok'}
                      </Typography>
                    </Grid>
                  </Grid>
                </CardContent>
              </Collapse>
            </Card>

            {/* Etkileşimler Kartı */}
            <Card>
              <CardHeader
                title={
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Typography variant="h6">Müşteri İletişim Geçmişi</Typography>
                    <Box sx={{ display: 'flex', gap: 0.5 }}>
                      <Tooltip title="Tarihe göre sırala">
                        <IconButton
                          size="small"
                          onClick={() => handleSort('createdAt')}
                          color={sortConfig.field === 'createdAt' ? 'primary' : 'default'}
                        >
                          {sortConfig.field === 'createdAt' && sortConfig.order === 'asc' ? (
                            <ArrowUpwardIcon />
                          ) : (
                            <ArrowDownwardIcon />
                          )}
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Türe göre sırala">
                        <IconButton 
                          size="small"
                          onClick={() => handleSort('type')}
                          color={sortConfig.field === 'type' ? 'primary' : 'default'}
                        >
                          {sortConfig.field === 'type' && sortConfig.order === 'asc' ? (
                            <SortByAlphaIcon />
                          ) : (
                            <SortByAlphaIcon sx={{ transform: 'scaleY(-1)' }} />
                          )}
                        </IconButton>
                      </Tooltip>
                    </Box>
                  </Box>
                }
                action={
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Button
                      variant="contained"
                      startIcon={<AddIcon />}
                      onClick={() => {
                        setEditingInteraction(null);
                        setInteractionForm({ type: 'PHONE', notes: '' });
                        setInteractionDialogOpen(true);
                      }}
                      size="small"
                    >
                      Yeni Etkileşim
                    </Button>
                    <IconButton
                      onClick={() => setInteractionsExpanded(!interactionsExpanded)}
                      aria-expanded={interactionsExpanded}
                      aria-label="etkileşimleri göster/gizle"
                      size="small"
                    >
                      {interactionsExpanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                    </IconButton>
                  </Box>
                }
                sx={{ 
                  borderBottom: interactionsExpanded ? 1 : 0, 
                  borderColor: 'divider',
                  '& .MuiCardHeader-content': { flex: '1 1 auto' },
                  '& .MuiCardHeader-action': { 
                    margin: 0,
                    alignSelf: 'center'
                  }
                }}
              />
              <Collapse in={interactionsExpanded} timeout="auto" unmountOnExit>
                <CardContent>
                  <Box sx={{ mb: 2 }}>
                    <Grid container spacing={2} alignItems="center">
                      <Grid item xs={12} sm={6}>
                        <TextField
                          size="small"
                          fullWidth
                          placeholder="Etkileşimlerde ara..."
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          InputProps={{
                            startAdornment: (
                              <InputAdornment position="start">
                                <SearchIcon />
                              </InputAdornment>
                            ),
                          }}
                        />
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <ToggleButtonGroup
                          value={selectedTypes}
                          onChange={(e, newTypes) => setSelectedTypes(newTypes)}
                          size="small"
                        >
                          <ToggleButton value="PHONE">
                            <Tooltip title="Telefon">
                              <PhoneInTalkIcon />
                            </Tooltip>
                          </ToggleButton>
                          <ToggleButton value="EMAIL">
                            <Tooltip title="E-posta">
                              <MailIcon />
                            </Tooltip>
                          </ToggleButton>
                          <ToggleButton value="MEETING">
                            <Tooltip title="Toplantı">
                              <MeetingRoomIcon />
                            </Tooltip>
                          </ToggleButton>
                          <ToggleButton value="NOTE">
                            <Tooltip title="Not">
                              <ChatIcon />
                            </Tooltip>
                          </ToggleButton>
                        </ToggleButtonGroup>
                      </Grid>
                    </Grid>
                  </Box>
                  <List>
                    {filteredInteractions.length > 0 ? (
                      filteredInteractions.map((interaction) => (
                        <Card key={interaction.id} sx={{ mb: 2 }}>
                          <CardHeader
                            avatar={
                              <Avatar sx={{ bgcolor: theme.palette.primary.main }}>
                                {getInteractionIcon(interaction.type)}
                              </Avatar>
                            }
                            action={
                              <Box>
                                <IconButton onClick={() => handleEditInteraction(interaction)}>
                                  <EditIcon />
                                </IconButton>
                                <IconButton onClick={() => handleDeleteInteraction(interaction.id)}>
                                  <DeleteIcon />
                                </IconButton>
                              </Box>
                            }
                            title={getInteractionLabel(interaction.type)}
                            subheader={new Date(interaction.createdAt).toLocaleString('tr-TR')}
                          />
                          <CardContent>
                            <Typography variant="body2" color="text.secondary">
                              {interaction.notes}
                            </Typography>
                            <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                              Ekleyen: {interaction.createdBy.name}
                            </Typography>
                          </CardContent>
                        </Card>
                      ))
                    ) : (
                      <Typography color="text.secondary">
                        Henüz etkileşim kaydı bulunmuyor.
                      </Typography>
                    )}
                  </List>
                </CardContent>
              </Collapse>
            </Card>
          </Grid>

          <Grid item xs={12} md={4}>
            <Paper sx={{ p: 3, mb: 3 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6">Müşteri Bilgilerini Görüntüleyebilen Kullanıcılar</Typography>
                {canManageSharing && (
                  <IconButton 
                    size="small" 
                    color="primary"
                    onClick={() => setShareDialogOpen(true)}
                  >
                    <ShareIcon />
                  </IconButton>
                )}
              </Box>
              {customer.sharedWith && customer.sharedWith.length > 0 ? (
                <List>
                  {customer.sharedWith.map((user) => (
                    <ListItem
                      key={user.id}
                      secondaryAction={
                        canManageSharing && (
                          <IconButton 
                            edge="end" 
                            onClick={() => handleRemoveShare(user.id)}
                            size="small"
                          >
                            <PersonRemoveIcon />
                          </IconButton>
                        )
                      }
                    >
                      <ListItemText
                        primary={user.name}
                        secondary={user.email}
                      />
                    </ListItem>
                  ))}
                </List>
              ) : (
                <Typography color="text.secondary">
                  Bu müşteri henüz kimseyle paylaşılmamış.
                </Typography>
              )}
            </Paper>
          </Grid>
        </Grid>
      )}

      {activeTab === 1 && (
        <Box sx={{ mt: 2 }}>
          <Grid container spacing={2}>
            {/* Finansal Özet */}
            <Grid item xs={12}>
              <Paper sx={{ p: 2 }}>
                <Typography variant="h6" gutterBottom>
                  Finansal Özet
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={3}>
                    <Typography variant="subtitle2" color="textSecondary">
                      Toplam Fatura
                    </Typography>
                    <Typography variant="h6">
                      {new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' })
                        .format(financialSummary.totalInvoiced)}
                    </Typography>
                  </Grid>
                  <Grid item xs={3}>
                    <Typography variant="subtitle2" color="textSecondary">
                      Toplam Tahsilat
                    </Typography>
                    <Typography variant="h6">
                      {new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' })
                        .format(financialSummary.totalPaid)}
                    </Typography>
                  </Grid>
                  <Grid item xs={3}>
                    <Typography variant="subtitle2" color="textSecondary">
                      Vadesi Geçmiş
                    </Typography>
                    <Typography variant="h6" color="error">
                      {new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' })
                        .format(financialSummary.overdue)}
                    </Typography>
                  </Grid>
                  <Grid item xs={3}>
                    <Typography variant="subtitle2" color="textSecondary">
                      Bekleyen Tahsilat
                    </Typography>
                    <Typography variant="h6" color="warning.main">
                      {new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' })
                        .format(financialSummary.pending)}
                    </Typography>
                  </Grid>
                </Grid>
              </Paper>
            </Grid>

            {/* Fatura Listesi */}
            <Grid item xs={12}>
              <Paper sx={{ p: 2 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                  <Typography variant="h6">
                    Faturalar
                  </Typography>
                  <Button
                    variant="contained"
                    startIcon={<AddIcon />}
                    onClick={() => setInvoiceDialogOpen(true)}
                  >
                    Yeni Fatura
                  </Button>
                </Box>
                <TableContainer>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>Fatura No</TableCell>
                        <TableCell>Tarih</TableCell>
                        <TableCell>Vade</TableCell>
                        <TableCell>Tutar</TableCell>
                        <TableCell>Ödenen</TableCell>
                        <TableCell>Kalan</TableCell>
                        <TableCell>Durum</TableCell>
                        <TableCell>İşlemler</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {invoices.map(invoice => {
                        const payments = invoice.payments || [];
                        const totalPaid = payments.reduce((sum, payment) => 
                          payment.status === 'COMPLETED' ? sum + payment.amount : sum, 0);
                        const remainingAmount = invoice.totalAmount - totalPaid;
                        
                        return (
                          <TableRow key={invoice.id}>
                            <TableCell>{invoice.number}</TableCell>
                            <TableCell>
                              {new Date(invoice.issueDate).toLocaleDateString('tr-TR')}
                            </TableCell>
                            <TableCell>
                              {new Date(invoice.dueDate).toLocaleDateString('tr-TR')}
                            </TableCell>
                            <TableCell>
                              {new Intl.NumberFormat('tr-TR', { 
                                style: 'currency', 
                                currency: 'TRY' 
                              }).format(invoice.totalAmount)}
                            </TableCell>
                            <TableCell>
                              {new Intl.NumberFormat('tr-TR', { 
                                style: 'currency', 
                                currency: 'TRY' 
                              }).format(totalPaid)}
                            </TableCell>
                            <TableCell>
                              {new Intl.NumberFormat('tr-TR', { 
                                style: 'currency', 
                                currency: 'TRY' 
                              }).format(remainingAmount)}
                            </TableCell>
                            <TableCell>
                              <Chip
                                label={getInvoiceStatusLabel(invoice.status)}
                                color={
                                  invoice.status === 'PAID' ? 'success' :
                                  invoice.status === 'OVERDUE' ? 'error' :
                                  invoice.status === 'PARTIALLY_PAID' ? 'warning' :
                                  'default'
                                }
                                size="small"
                              />
                            </TableCell>
                            <TableCell>
                              <Box sx={{ display: 'flex', gap: 1 }}>
                                <IconButton
                                  onClick={() => {
                                    setSelectedInvoice(invoice);
                                    setPaymentDialogOpen(true);
                                  }}
                                  disabled={invoice.status === 'PAID' || invoice.status === 'CANCELLED'}
                                >
                                  <ReceiptIcon />
                                </IconButton>
                                <IconButton
                                  onClick={(event) => {
                                    setStatusMenuAnchor(event.currentTarget);
                                    setSelectedInvoiceForStatus(invoice);
                                  }}
                                  disabled={invoice.status === 'PAID'}
                                >
                                  <EditIcon />
                                </IconButton>
                              </Box>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Paper>
            </Grid>
          </Grid>
        </Box>
      )}

      {activeTab === 2 && (
        <Box sx={{ mt: 2 }}>
          <Grid container spacing={2}>
            {/* Fatura Oluşturma Dialog */}
            <Grid item xs={12}>
              <Paper sx={{ p: 2 }}>
                <Typography variant="h6" gutterBottom>
                  Fatura Oluştur
                </Typography>
                <InvoiceForm
                  onSubmit={handleCreateInvoice}
                  onCancel={() => setInvoiceDialogOpen(false)}
                />
              </Paper>
            </Grid>
          </Grid>
        </Box>
      )}

      {activeTab === 3 && (
        <Box sx={{ mt: 2 }}>
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <Paper sx={{ p: 2 }}>
                <Typography variant="h6" gutterBottom>
                  Ödeme Oluştur
                </Typography>
                
                <Box sx={{ mb: 3 }}>
                  <TextField
                    select
                    fullWidth
                    label="Fatura Seçin"
                    value={selectedInvoice?.id || ''}
                    onChange={(e) => {
                      const invoice = invoices.find(inv => inv.id === Number(e.target.value));
                      setSelectedInvoice(invoice || null);
                    }}
                  >
                    {invoices
                      .filter(invoice => invoice.status !== 'PAID')
                      .map(invoice => (
                        <MenuItem key={invoice.id} value={invoice.id}>
                          {invoice.number} - {new Intl.NumberFormat('tr-TR', { 
                            style: 'currency', 
                            currency: 'TRY' 
                          }).format(invoice.totalAmount)}
                          {invoice.status === 'PARTIALLY_PAID' && ' (Kısmi Ödenmiş)'}
                          {invoice.status === 'OVERDUE' && ' (Vadesi Geçmiş)'}
                        </MenuItem>
                    ))}
                  </TextField>
                </Box>

                {selectedInvoice ? (
                  <PaymentForm
                    invoiceAmount={selectedInvoice.totalAmount}
                    onSubmit={(data) => handleCreatePayment(selectedInvoice.id, data)}
                    onCancel={() => setSelectedInvoice(null)}
                  />
                ) : (
                  <Typography color="text.secondary" align="center">
                    Lütfen ödeme yapmak için bir fatura seçin
                  </Typography>
                )}
              </Paper>
            </Grid>
          </Grid>
        </Box>
      )}

      {activeTab === 4 && (
        <Box sx={{ mt: 2 }}>
          <Grid container spacing={3}>
            {/* Projeler Listesi */}
            <Grid item xs={12} md={4}>
              <Paper sx={{ p: 2 }}>
                <Box sx={{ mb: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography variant="h6">
                    Projeler
                  </Typography>
                </Box>
                <List>
                  {projects.map((project) => (
                    <ListItem
                      key={project.id}
                      button
                      selected={selectedProject?.id === project.id}
                      onClick={() => setSelectedProject(project)}
                    >
                      <ListItemIcon>
                        <ProjectIcon color={selectedProject?.id === project.id ? "primary" : "action"} />
                      </ListItemIcon>
                      <ListItemText
                        primary={project.name}
                        secondary={`${project.tasks?.length || 0} görev`}
                      />
                    </ListItem>
                  ))}
                  {projects.length === 0 && (
                    <Typography color="text.secondary" align="center" sx={{ py: 2 }}>
                      Henüz proje bulunmuyor
                    </Typography>
                  )}
                </List>
              </Paper>
            </Grid>

            {/* Seçili Projenin Görevleri */}
            <Grid item xs={12} md={8}>
              <Paper sx={{ p: 2 }}>
                <Box sx={{ mb: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography variant="h6">
                    {selectedProject ? `${selectedProject.name} - Görevler` : 'Görevler'}
                  </Typography>
                </Box>
                {selectedProject ? (
                  <Grid container spacing={2}>
                    {projectTasks.length > 0 ? (
                      projectTasks.map((task) => (
                        <Grid item xs={12} key={task.id}>
                          <Card 
                            sx={{ 
                              borderLeft: 6,
                              borderColor: task.status === 'COMPLETED' ? 'success.main' :
                                         task.status === 'IN_PROGRESS' ? 'primary.main' :
                                         task.status === 'STUCK' ? 'error.main' :
                                         'warning.main'
                            }}
                          >
                            <CardContent>
                              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                                <Typography variant="h6" component="div" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                  {getTaskStatusIcon(task.status)}
                                  {task.title}
                                </Typography>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                  <Chip
                                    label={getTaskStatusLabel(task.status)}
                                    color={
                                      task.status === 'COMPLETED' ? 'success' :
                                      task.status === 'IN_PROGRESS' ? 'primary' :
                                      task.status === 'STUCK' ? 'error' :
                                      'warning'
                                    }
                                    size="small"
                                  />
                                  <Tooltip title="Göreve Git">
                                    <IconButton 
                                      size="small"
                                      onClick={() => navigate(`/tasks/${task.id}/details`)}
                                      sx={{ ml: 1 }}
                                    >
                                      <ArrowForward />
                                    </IconButton>
                                  </Tooltip>
                                </Box>
                              </Box>
                              
                              {task.description && (
                                <Typography color="text.secondary" sx={{ mb: 2 }}>
                                  {task.description}
                                </Typography>
                              )}
                              
                              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, alignItems: 'center' }}>
                                {task.dueDate && (
                                  <Chip
                                    icon={<Schedule />}
                                    label={`Bitiş: ${new Date(task.dueDate).toLocaleDateString('tr-TR')}`}
                                    size="small"
                                    variant="outlined"
                                  />
                                )}
                                
                                {task.user && (
                                  <Chip
                                    icon={<Person />}
                                    label={`Atanan: ${task.user.name}`}
                                    size="small"
                                    variant="outlined"
                                  />
                                )}

                                {task.priority && (
                                  <Chip
                                    icon={task.priority === 'HIGH' ? <PriorityHigh /> : 
                                         task.priority === 'CRITICAL' ? <Error /> :
                                         task.priority === 'LOW' ? <LowPriority /> :
                                         <LinearScale />}
                                    label={`Öncelik: ${
                                      task.priority === 'HIGH' ? 'Yüksek' :
                                      task.priority === 'CRITICAL' ? 'Kritik' :
                                      task.priority === 'LOW' ? 'Düşük' :
                                      'Normal'
                                    }`}
                                    size="small"
                                    variant="outlined"
                                    color={
                                      task.priority === 'HIGH' ? 'warning' :
                                      task.priority === 'CRITICAL' ? 'error' :
                                      task.priority === 'LOW' ? 'info' :
                                      'default'
                                    }
                                  />
                                )}
                              </Box>
                            </CardContent>
                          </Card>
                        </Grid>
                      ))
                    ) : (
                      <Grid item xs={12}>
                        <Paper sx={{ p: 3, textAlign: 'center', bgcolor: 'background.default' }}>
                          <Typography color="text.secondary" variant="h6">
                            Bu projede henüz görev bulunmuyor
                          </Typography>
                        </Paper>
                      </Grid>
                    )}
                  </Grid>
                ) : (
                  <Paper sx={{ p: 3, textAlign: 'center', bgcolor: 'background.default' }}>
                    <Typography color="text.secondary" variant="h6">
                      Görevleri görüntülemek için bir proje seçin
                    </Typography>
                  </Paper>
                )}
              </Paper>
            </Grid>
          </Grid>
        </Box>
      )}

      <Dialog 
        open={shareDialogOpen} 
        onClose={() => setShareDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Müşteriyi Paylaş</DialogTitle>
        <DialogContent>
          <List>
            {users.length > 0 ? (
              users.map((user) => (
                <ListItem
                  key={user.id}
                  button
                  onClick={() => handleShare(user.id)}
                >
                  <ListItemText
                    primary={user.name}
                    secondary={user.email}
                  />
                </ListItem>
              ))
            ) : (
              <Typography color="text.secondary" sx={{ p: 2 }}>
                Paylaşılabilecek kullanıcı bulunamadı.
              </Typography>
            )}
          </List>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShareDialogOpen(false)}>Kapat</Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={interactionDialogOpen}
        onClose={handleCloseDialog}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          {editingInteraction ? 'Etkileşimi Düzenle' : 'Yeni Etkileşim Ekle'}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
            <TextField
              select
              label="Etkileşim Türü"
              value={interactionForm.type}
              onChange={(e) => setInteractionForm(prev => ({ ...prev, type: e.target.value }))}
              fullWidth
            >
              <MenuItem value="PHONE">Telefon</MenuItem>
              <MenuItem value="EMAIL">E-posta</MenuItem>
              <MenuItem value="MEETING">Toplantı</MenuItem>
              <MenuItem value="NOTE">Not</MenuItem>
            </TextField>

            <TextField
              label="Notlar"
              multiline
              rows={4}
              value={interactionForm.notes}
              onChange={(e) => setInteractionForm(prev => ({ ...prev, notes: e.target.value }))}
              fullWidth
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>İptal</Button>
          <Button onClick={handleInteractionSubmit} variant="contained">
            Kaydet
          </Button>
        </DialogActions>
      </Dialog>

      {/* Fatura Oluşturma Dialog */}
      <Dialog
        open={invoiceDialogOpen}
        onClose={() => setInvoiceDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Yeni Fatura Oluştur</DialogTitle>
        <DialogContent>
          <InvoiceForm
            onSubmit={handleCreateInvoice}
            onCancel={() => setInvoiceDialogOpen(false)}
          />
        </DialogContent>
      </Dialog>

      {/* Ödeme Oluşturma Dialog */}
      <Dialog
        open={paymentDialogOpen}
        onClose={() => setPaymentDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Ödeme Ekle</DialogTitle>
        <DialogContent>
          {selectedInvoice && (
            <PaymentForm
              invoiceAmount={selectedInvoice.totalAmount}
              onSubmit={(data) => handleCreatePayment(selectedInvoice.id, data)}
              onCancel={() => setPaymentDialogOpen(false)}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Durum güncelleme menüsü */}
      <Menu
        anchorEl={statusMenuAnchor}
        open={Boolean(statusMenuAnchor)}
        onClose={() => {
          setStatusMenuAnchor(null);
          setSelectedInvoiceForStatus(null);
        }}
      >
        <MuiMenuItem 
          onClick={() => selectedInvoiceForStatus && handleUpdateInvoiceStatus(selectedInvoiceForStatus.id, 'SENT')}
        >
          Fatura Gönderildi
        </MuiMenuItem>
        <MuiMenuItem 
          onClick={() => selectedInvoiceForStatus && handleUpdateInvoiceStatus(selectedInvoiceForStatus.id, 'CANCELLED')}
        >
          İptal Edildi
        </MuiMenuItem>
      </Menu>
    </Box>
  );
};

export default CustomerDetailPage; 