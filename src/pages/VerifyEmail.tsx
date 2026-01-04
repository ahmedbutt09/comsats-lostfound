import React, { useState, useEffect } from 'react';
import { Box, Typography, Container, Paper, Button, TextField, CircularProgress, Alert } from '@mui/material';
import { MailOutline } from '@mui/icons-material';
import { useNavigate, useLocation } from 'react-router-dom';
import { authService } from '../services/supabaseAuthService'; // Verify this path
import toast from 'react-hot-toast';

const VerifyEmail: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const email = location.state?.email || '';

  // Safety: If someone refreshes the page and loses the email state, send them back
  useEffect(() => {
    if (!email) {
      toast.error('Session lost. Please try registering again.');
      navigate('/register');
    }
  }, [email, navigate]);

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (otp.length !== 8) {
      toast.error('Please enter the 8-digit code.');
      return;
    }

    try {
      setLoading(true);
      await authService.verifySignUpOTP(email, otp);
      toast.success('Email verified! You can now log in.');
      navigate('/login');
    } catch (error: any) {
      toast.error(error.message || 'Invalid code. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container maxWidth="sm">
      <Box sx={{ mt: 8, mb: 8, textAlign: 'center' }}>
        <Paper elevation={3} sx={{ p: 5, borderRadius: 2 }}>
          <MailOutline sx={{ fontSize: 80, color: 'primary.main', mb: 2 }} />
          
          <Typography variant="h4" gutterBottom fontWeight="bold">
            Enter Verification Code
          </Typography>
          
          <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
            We've sent a 8-digit code to <strong>{email}</strong>.
          </Typography>

          <Box component="form" onSubmit={handleVerify}>
            <TextField
              fullWidth
              label="8-Digit OTP"
              variant="outlined"
              placeholder="000000"
              value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 8))}
              disabled={loading}
              autoFocus
              inputProps={{ 
                style: { 
                  textAlign: 'center', 
                  letterSpacing: '0.8rem', 
                  fontSize: '2rem', 
                  fontWeight: 'bold' 
                } 
              }}
              sx={{ mb: 3 }}
            />

            <Button 
              type="submit"
              variant="contained" 
              fullWidth 
              disabled={loading || otp.length < 8}
              sx={{ py: 1.5, mb: 2 }}
            >
              {loading ? <CircularProgress size={24} color="inherit" /> : 'Verify Email'}
            </Button>
          </Box>

          <Button 
            variant="text" 
            onClick={() => navigate('/register')}
            sx={{ textTransform: 'none' }}
          >
            Entered the wrong email? Register again
          </Button>
        </Paper>
      </Box>
    </Container>
  );
};

export default VerifyEmail;