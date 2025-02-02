import React from 'react';
import { Box, Typography } from '@mui/material';
import CustomerForm from '../../components/CRM/CustomerForm';

const NewCustomerPage: React.FC = () => {
  return (
    <Box>
      <Typography variant="h4" sx={{ mb: 4 }}>
        Yeni Müşteri Ekle
      </Typography>
      <CustomerForm />
    </Box>
  );
};

export default NewCustomerPage; 