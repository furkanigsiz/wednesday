import React, { useState, useEffect } from 'react';
import {
  Box,
  TextField,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Paper,
  Typography,
  Grid,
  SelectChangeEvent,
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { useSnackbar } from 'notistack';
import { customerService } from '../../services/api';
import { Customer, CustomerFormData, CustomerStatus } from '../../types';

interface CustomerFormProps {
  customer?: Customer;
  onSubmit?: () => void;
}

const CustomerForm: React.FC<CustomerFormProps> = ({ customer, onSubmit }) => {
  const navigate = useNavigate();
  const { enqueueSnackbar } = useSnackbar();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<CustomerFormData>({
    name: '',
    company: '',
    email: '',
    phone: '',
    role: '',
    status: 'LEAD',
  });

  useEffect(() => {
    if (customer) {
      setFormData({
        name: customer.name,
        company: customer.company || '',
        email: customer.email,
        phone: customer.phone || '',
        role: customer.role || '',
        status: customer.status,
      });
    }
  }, [customer]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleStatusChange = (e: SelectChangeEvent<CustomerStatus>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (customer) {
        await customerService.update(customer.id, formData);
        enqueueSnackbar('Müşteri başarıyla güncellendi', { variant: 'success' });
      } else {
        await customerService.create(formData);
        enqueueSnackbar('Müşteri başarıyla oluşturuldu', { variant: 'success' });
      }

      if (onSubmit) {
        onSubmit();
      } else {
        navigate('/crm/customers');
      }
    } catch (error) {
      console.error('Müşteri kaydedilemedi:', error);
      enqueueSnackbar('Müşteri kaydedilirken bir hata oluştu', { variant: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const statusOptions: { value: CustomerStatus; label: string }[] = [
    { value: 'LEAD', label: 'Potansiyel' },
    { value: 'CONTACT', label: 'İletişimde' },
    { value: 'OPPORTUNITY', label: 'Fırsat' },
    { value: 'CUSTOMER', label: 'Müşteri' },
    { value: 'INACTIVE', label: 'Pasif' },
  ];

  return (
    <Paper sx={{ p: 3 }}>
      <Typography variant="h6" sx={{ mb: 3 }}>
        {customer ? 'Müşteri Düzenle' : 'Yeni Müşteri'}
      </Typography>

      <form onSubmit={handleSubmit}>
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              required
              label="Müşteri Adı"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              disabled={loading}
            />
          </Grid>

          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Şirket"
              name="company"
              value={formData.company}
              onChange={handleInputChange}
              disabled={loading}
            />
          </Grid>

          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              required
              type="email"
              label="E-posta"
              name="email"
              value={formData.email}
              onChange={handleInputChange}
              disabled={loading}
            />
          </Grid>

          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Telefon"
              name="phone"
              value={formData.phone}
              onChange={handleInputChange}
              disabled={loading}
            />
          </Grid>

          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Rol"
              name="role"
              value={formData.role}
              onChange={handleInputChange}
              disabled={loading}
              placeholder="Örn: Satın Alma Müdürü"
            />
          </Grid>

          <Grid item xs={12} md={6}>
            <FormControl fullWidth required>
              <InputLabel>Durum</InputLabel>
              <Select
                name="status"
                value={formData.status}
                label="Durum"
                onChange={handleStatusChange}
                disabled={loading}
              >
                {statusOptions.map(option => (
                  <MenuItem key={option.value} value={option.value}>
                    {option.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
        </Grid>

        <Box sx={{ mt: 3, display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
          <Button
            variant="outlined"
            onClick={() => navigate('/crm/customers')}
            disabled={loading}
          >
            İptal
          </Button>
          <Button
            type="submit"
            variant="contained"
            disabled={loading}
          >
            {customer ? 'Güncelle' : 'Oluştur'}
          </Button>
        </Box>
      </form>
    </Paper>
  );
};

export default CustomerForm; 