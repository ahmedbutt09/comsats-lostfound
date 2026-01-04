import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate, Link as RouterLink } from 'react-router-dom';
import {
  Container,
  Paper,
  Typography,
  Box,
  TextField,
  Button,
  CircularProgress,
  Link as MuiLink,
  Alert,
} from '@mui/material';
import { MarkEmailRead as EmailIcon, ArrowBack as BackIcon } from '@mui/icons-material';
import { authService } from '../../services/supabaseAuthService';
import toast from 'react-hot-toast';

const VerifyEmail: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  
  // Get the email passed from the Register page state
  const email = location.state?.email || '';

  // Redirect if user accesses this page directly without an email
  useEffect(() => {
    if (!email) {
      toast.error('Session expired. Please register again.');
      navigate('/register');
    }
  }, [email, navigate]);

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (otp.length !== 6) {
      toast.error('Please enter the full 6-digit code');
      return;
    }

    try {
      setLoading(true);
      await authService.verifySignUpOTP(email, otp);
      toast.success('Email verified successfully! You can now log in.');
      navigate('/login');
    } catch (error: any) {
      console.error('Verification error:', error);
      toast.error(error.message || 'Invalid or expired code');
    } finally {
      setLoading(false);
    }
  };

  const handleResendCode = async () => {
    try {
      setResending(true);
      await authService.resendVerificationEmail(email);
      toast.success('A new code has been sent to your email.');
    } catch (error: any) {
      toast.error(error.message || 'Failed to resend code');
    } finally {
      setResending(false);
    }
  };

  return (
    <Container component="main" maxWidth="sm">
      <Box sx={{ marginTop: 8, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <Paper elevation={3} sx={{ padding: 4, display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%' }}>
          
          <EmailIcon sx={{ fontSize: 60, color: 'primary.main', mb: 2 }} />
          
          <Typography component="h1" variant="h4" gutterBottom>
            Verify Your Email
          </Typography>

          <Typography variant="body1" textAlign="center" color="text.secondary" sx={{ mb: 3 }}>
            We've sent a 6-digit verification code to <br />
            <strong>{email}</strong>
          </Typography>

          <Box component="form" onSubmit={handleVerify} sx={{ width: '100%' }}>
            <TextField
              fullWidth
              required
              label="Verification Code"
              placeholder="000000"
              value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
              disabled={loading}
              autoFocus
              inputProps={{
                style: { 
                  textAlign: 'center', 
                  letterSpacing: '0.8rem', 
                  fontSize: '1.8rem', 
                  fontWeight: 'bold' 
                }
              }}
              helperText="Enter the 6-digit code from your inbox"
            />

            <Button
              type="submit"
              fullWidth
              variant="contained"
              size="large"
              disabled={loading || otp.length < 6}
              sx={{ mt: 3, py: 1.5 }}
            >
              {loading ? <CircularProgress size={24} color="inherit" /> : 'Verify & Activate'}
            </Button>
          </Box>

          <Box sx={{ mt: 3, textAlign: 'center', width: '100%' }}>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
              Didn't receive the code?
            </Typography>
            <Button 
              variant="text" 
              onClick={handleResendCode} 
              disabled={resending || loading}
              sx={{ fontWeight: 'bold' }}
            >
              {resending ? 'Sending...' : 'Resend Code'}
            </Button>
          </Box>

          <Button
            startIcon={<BackIcon />}
            component={RouterLink}
            to="/register"
            sx={{ mt: 2, textTransform: 'none' }}
          >
            Back to Registration
          </Button>
        </Paper>
      </Box>
    </Container>
  );
};

export default VerifyEmail;
