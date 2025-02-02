import React, { useState } from 'react';
import {
  Box,
  TextField,
  Button,
  Grid,
  MenuItem,
  Typography,
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';

interface PaymentFormProps {
  invoiceAmount: number;
  onSubmit: (data: any) => void;
  onCancel: () => void;
}

const PaymentForm: React.FC<PaymentFormProps> = ({ invoiceAmount, onSubmit, onCancel }) => {
  const [amount, setAmount] = useState<number>(invoiceAmount);
  const [paymentDate, setPaymentDate] = useState<Date | null>(new Date());
  const [method, setMethod] = useState<string>('BANK_TRANSFER');
  const [reference, setReference] = useState('');
  const [notes, setNotes] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!paymentDate) return;

    onSubmit({
      amount,
      paymentDate: paymentDate.toISOString(),
      method,
      reference,
      notes,
    });
  };

  return (
    <Box component="form" onSubmit={handleSubmit} sx={{ mt: 2 }}>
      <Grid container spacing={3}>
        <Grid item xs={12}>
          <Typography variant="subtitle2" gutterBottom>
            Fatura Tutarı:{' '}
            {new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' })
              .format(invoiceAmount)}
          </Typography>
        </Grid>

        <Grid item xs={12}>
          <TextField
            fullWidth
            label="Ödeme Tutarı"
            type="number"
            value={amount}
            onChange={(e) => setAmount(Number(e.target.value))}
            required
            inputProps={{ min: 0, step: 0.01 }}
          />
        </Grid>

        <Grid item xs={12}>
          <DatePicker
            label="Ödeme Tarihi"
            value={paymentDate}
            onChange={(newValue) => setPaymentDate(newValue)}
            slotProps={{
              textField: {
                fullWidth: true,
                required: true,
              },
            }}
          />
        </Grid>

        <Grid item xs={12}>
          <TextField
            fullWidth
            select
            label="Ödeme Yöntemi"
            value={method}
            onChange={(e) => setMethod(e.target.value)}
            required
          >
            <MenuItem value="BANK_TRANSFER">Banka Havalesi</MenuItem>
            <MenuItem value="CREDIT_CARD">Kredi Kartı</MenuItem>
            <MenuItem value="CASH">Nakit</MenuItem>
            <MenuItem value="CHECK">Çek</MenuItem>
            <MenuItem value="OTHER">Diğer</MenuItem>
          </TextField>
        </Grid>

        <Grid item xs={12}>
          <TextField
            fullWidth
            label="Referans No"
            value={reference}
            onChange={(e) => setReference(e.target.value)}
            helperText="Havale/EFT no, çek no, vb."
          />
        </Grid>

        <Grid item xs={12}>
          <TextField
            fullWidth
            label="Notlar"
            multiline
            rows={3}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
        </Grid>

        <Grid item xs={12}>
          <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
            <Button onClick={onCancel}>
              İptal
            </Button>
            <Button
              type="submit"
              variant="contained"
              disabled={!amount || !paymentDate}
            >
              Ödeme Ekle
            </Button>
          </Box>
        </Grid>
      </Grid>
    </Box>
  );
};

export default PaymentForm; 