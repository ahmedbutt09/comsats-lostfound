import React, { useState } from 'react';
import {
  Container,
  Paper,
  Typography,
  Box,
  TextField,
  Button,
  Alert,
  CircularProgress,
  Link as MuiLink,
  InputAdornment,
} from '@mui/material';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import { Email as EmailIcon, VpnKey as KeyIcon, ArrowBack as BackIcon } from '@mui/icons-material';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { authService } from '../services/supabaseAuthService';
import { passwordResetSchema } from '../utils/validators';
import toast from 'react-hot-toast';

type ForgotPasswordFormData = z.infer<typeof passwordResetSchema>;

const ForgotPassword: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<'email' | 'otp'>('email');
  const [emailForOTP, setEmailForOTP] = useState('');
  const [otpValue, setOtpValue] = useState('');
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotPasswordFormData>({
    resolver: zodResolver(passwordResetSchema),
    defaultValues: {
      email: '',
    },
  });

  // Step 1: Send the OTP Code
  const handleRequestOTP = async (data: ForgotPasswordFormData) => {
    try {
      setLoading(true);
      await authService.resetPassword(data.email);
      setEmailForOTP(data.email);
      setStep('otp');
      toast.success('Verification code sent to your email!');
    } catch (error: any) {
      console.error('Reset password error:', error);
      toast.error(error.message || 'Failed to send reset code');
    } finally {
      setLoading(false);
    }
  };

  // Step 2: Verify the OTP Code
  const handleVerifyOTP = async () => {
    if (otpValue.length !== 8) {
      toast.error('Please enter a valid 8-digit code');
      return;
    }

    try {
      setLoading(true);
      // verifyResetOTP must be implemented in your authService
      await authService.verifyResetOTP(emailForOTP, otpValue);
      toast.success('Code verified successfully!');
      navigate('/reset-password');
    } catch (error: any) {
      console.error('OTP Verification error:', error);
      toast.error(error.message || 'Invalid code. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container component="main" maxWidth="sm">
      <Box sx={{ marginTop: 8, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <Paper elevation={3} sx={{ padding: 4, display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%' }}>
          
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
            {step === 'email' ? (
              <EmailIcon sx={{ fontSize: 40, color: 'primary.main' }} />
            ) : (
              <KeyIcon sx={{ fontSize: 40, color: 'primary.main' }} />
            )}
            <Typography component="h1" variant="h4">
              {step === 'email' ? 'Reset Password' : 'Verify Code'}
            </Typography>
          </Box>

          {step === 'email' ? (
            /* --- STEP 1: EMAIL ENTRY --- */
            <Box component="form" onSubmit={handleSubmit(handleRequestOTP)} sx={{ width: '100%' }}>
              <Alert severity="info" sx={{ mb: 3 }}>
                Enter your email address and we'll send you a 8-digit code to reset your password.
              </Alert>

              <TextField
                margin="normal"
                required
                fullWidth
                id="email"
                label="Email Address"
                autoComplete="email"
                autoFocus
                {...register('email')}
                error={!!errors.email}
                helperText={errors.email?.message}
                disabled={loading}
              />

              <Button
                type="submit"
                fullWidth
                variant="contained"
                sx={{ mt: 3, mb: 2, py: 1.5 }}
                disabled={loading}
                startIcon={loading && <CircularProgress size={20} color="inherit" />}
              >
                {loading ? 'Sending Code...' : 'Send Reset Code'}
              </Button>
            </Box>
          ) : (
            /* --- STEP 2: OTP ENTRY --- */
            <Box sx={{ width: '100%' }}>
              <Alert severity="success" sx={{ mb: 3 }}>
                Code sent to <strong>{emailForOTP}</strong>. Please enter the 8-digit code from your email.
              </Alert>

              <TextField
                margin="normal"
                required
                fullWidth
                id="otp"
                label="8-Digit Verification Code"
                placeholder="00000000"
                value={otpValue}
                onChange={(e) => setOtpValue(e.target.value.replace(/\D/g, '').slice(0, 8))}
                autoFocus
                disabled={loading}
                inputProps={{ 
                  style: { textAlign: 'center', letterSpacing: '0.5rem', fontSize: '1.5rem', fontWeight: 'bold' } 
                }}
              />

              <Button
                fullWidth
                variant="contained"
                onClick={handleVerifyOTP}
                sx={{ mt: 3, mb: 2, py: 1.5 }}
                disabled={loading || otpValue.length < 8}
                startIcon={loading && <CircularProgress size={20} color="inherit" />}
              >
                {loading ? 'Verifying...' : 'Verify & Proceed'}
              </Button>

              <Button
                fullWidth
                variant="outlined"
                startIcon={<BackIcon />}
                onClick={() => setStep('email')}
                disabled={loading}
              >
                Change Email
              </Button>
            </Box>
          )}

          <Box sx={{ textAlign: 'center', mt: 3 }}>
            <Typography variant="body2" color="text.secondary">
              Remember your password?{' '}
              <MuiLink
                component={RouterLink}
                to="/login"
                sx={{ textDecoration: 'none', fontWeight: 'bold' }}
              >
                Sign In
              </MuiLink>
            </Typography>
          </Box>
        </Paper>
      </Box>
    </Container>
  );
};

export default ForgotPassword;
