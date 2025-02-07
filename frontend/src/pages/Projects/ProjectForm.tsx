import React, { useState, useEffect } from 'react';
import {
  Box,
  TextField,
  Button,
  Grid,
  FormControlLabel,
  Switch,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
} from '@mui/material';
import { Project, Customer } from '../../types';
import { customerService } from '../../services/api';

interface ProjectFormProps {
  onSubmit: (data: Partial<Project>) => void;
  initialData?: Partial<Project>;
}

const ProjectForm: React.FC<ProjectFormProps> = ({ onSubmit, initialData }) => {
  const defaultValues = {
    name: '',
    description: '',
    isPrivate: true,
    customerId: undefined
  };

  const [formData, setFormData] = useState<Partial<Project>>({
    ...defaultValues,
    ...initialData,
  });
  const [customers, setCustomers] = useState<Customer[]>([]);

  useEffect(() => {
    const fetchCustomers = async () => {
      try {
        const data = await customerService.getAll();
        setCustomers(data);
      } catch (error) {
        console.error('Müşteriler yüklenemedi:', error);
      }
    };

    fetchCustomers();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleCustomerChange = (e: any) => {
    setFormData(prev => ({
      ...prev,
      customerId: e.target.value ? Number(e.target.value) : undefined
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <Box component="form" onSubmit={handleSubmit} sx={{ mt: 2 }}>
      <Grid container spacing={3}>
        <Grid item xs={12}>
          <TextField
            fullWidth
            required
            label="Proje Adı"
            name="name"
            value={formData.name}
            onChange={handleChange}
          />
        </Grid>

        <Grid item xs={12}>
          <TextField
            fullWidth
            multiline
            rows={4}
            label="Açıklama"
            name="description"
            value={formData.description}
            onChange={handleChange}
          />
        </Grid>

        <Grid item xs={12}>
          <FormControl fullWidth>
            <InputLabel>Müşteri</InputLabel>
            <Select
              value={formData.customerId || ''}
              onChange={handleCustomerChange}
              label="Müşteri"
            >
              <MenuItem value="">
                <em>Müşteri Seçiniz</em>
              </MenuItem>
              {customers.map((customer) => (
                <MenuItem key={customer.id} value={customer.id}>
                  {customer.company ? `${customer.name} (${customer.company})` : customer.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>

        <Grid item xs={12}>
          <FormControlLabel
            control={
              <Switch
                name="isPrivate"
                checked={formData.isPrivate}
                onChange={handleChange}
              />
            }
            label="Özel Proje"
          />
        </Grid>

        <Grid item xs={12}>
          <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
            <Button type="submit" variant="contained">
              {initialData ? 'Güncelle' : 'Oluştur'}
            </Button>
          </Box>
        </Grid>
      </Grid>
    </Box>
  );
};

export default ProjectForm; 