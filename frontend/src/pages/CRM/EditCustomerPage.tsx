import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Box, Typography, CircularProgress } from '@mui/material';
import { useSnackbar } from 'notistack';
import CustomerForm from '../../components/CRM/CustomerForm';
import { customerService } from '../../services/api';
import { Customer } from '../../types';

const EditCustomerPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { enqueueSnackbar } = useSnackbar();
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [loading, setLoading] = useState(true);

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

    fetchCustomer();
  }, [id, navigate, enqueueSnackbar]);

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

  return (
    <Box>
      <Typography variant="h4" sx={{ mb: 4 }}>
        Müşteri Düzenle
      </Typography>
      <CustomerForm customer={customer} />
    </Box>
  );
};

export default EditCustomerPage; 