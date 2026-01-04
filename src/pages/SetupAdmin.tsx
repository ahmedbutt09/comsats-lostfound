import React, { useState } from 'react';
import {
  Box,
  Button,
  TextField,
  Typography,
  Container,
  Paper,
  Alert,
  Stepper,
  Step,
  StepLabel,
  Card,
  CardContent,
  CircularProgress,
  MenuItem,
  IconButton,
  InputAdornment,
} from '@mui/material';
import { 
  Security, 
  CheckCircle, 
  Login, 
  Visibility, 
  VisibilityOff, 
  MailLock 
} from '@mui/icons-material';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { authService } from '../services/supabaseAuthService';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

// 1. ORIGINAL SCHEMA (Preserved all refinements and validation)
const setupSchema = z.object({
  email: z.string()
    .min(1, 'Email is required')
    .email('Please enter a valid email address'),
  password: z.string()
    .min(1, 'Password is required')
    .min(8, 'Password must be at least 8 characters'),
  confirmPassword: z.string()
    .min(1, 'Please confirm password'),
  name: z.string()
    .min(2, 'Name must be at least 2 characters'),
  adminCode: z.string()
    .min(1, 'Admin code is required')
    .refine((code) => code === '8219', {
      message: 'Invalid setup code',
    }),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

type SetupFormData = z.infer<typeof setupSchema>;

// 2. UPDATED STEPS (Added OTP Step)
const steps = ['Enter Setup Code', 'Create Admin Account', 'Verify Email OTP', 'Complete Setup'];

const SetupAdmin: React.FC = () => {
  const [activeStep, setActiveStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = React.useState(false);
  const [otp, setOtp] = useState('');
  const [createdEmail, setCreatedEmail] = useState('');
  const [createdPassword, setCreatedPassword] = useState('');
  
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    formState: { errors },
    trigger,
    getValues,
  } = useForm<SetupFormData>({
    resolver: zodResolver(setupSchema),
    mode: 'onTouched',
    defaultValues: {
      email: '', 
      password: '',
      confirmPassword: '',
      name: '',
      adminCode: '',
    },
  });

  const handleBackStep = () => {
    setActiveStep((prevStep) => prevStep - 1);
  };

  const handleVerifyCode = async () => {
    const isCodeValid = await trigger('adminCode');
    if (isCodeValid) {
      setActiveStep(1);
    } else {
      toast.error('Please enter the correct setup code');
    }
  };

  // Step 1 Submission: Trigger Supabase Sign Up + Send OTP
  const onAccountSubmit = async (data: SetupFormData) => {
    setLoading(true);
    try {
      await authService.setupFirstAdmin(data.email, data.password, data.name);
      setCreatedEmail(data.email);
      setCreatedPassword(data.password);
      setActiveStep(2); // Move to OTP verification
      toast.success('Admin account created! Check your email for the code.');
    } catch (error: any) {
      toast.error(error.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  // Step 2 Submission: Verify OTP
  /** Step 2: Verify the OTP received in email */
  const handleVerifyOtp = async () => {
    if (otp.length !== 8) {
      toast.error('Please enter the 8-digit code');
      return;
    }
    
    setLoading(true);
    try {
      // 1. Verify the OTP with Supabase
      await authService.verifySignUpOTP(createdEmail, otp);
      
      /** * 2. CRITICAL: Sign out immediately.
       * Supabase automatically logs the user in after OTP verification.
       * We sign them out so that the next login at /admin-login 
       * triggers a fresh session with the correct Admin role.
       */
      await authService.signOut(); 
      
      // 3. Move to the final success step
      setActiveStep(3); 
      toast.success('Email verified! Admin setup complete.');
    } catch (error: any) {
      console.error('Verification error:', error);
      toast.error(error.message || 'Invalid or expired OTP code');
    } finally {
      setLoading(false);
    }
  };

  const renderStepContent = (step: number) => {
    switch (step) {
      case 0:
        return (
          <Box sx={{ mt: 3 }}>
            <Alert severity="warning" sx={{ mb: 3 }}>
              <Typography variant="body2">
                <strong>Important:</strong> This setup should only be performed during initial system installation.
              </Typography>
            </Alert>
            <TextField
              fullWidth
              label="Setup Code"
              type="password"
              {...register('adminCode')}
              error={!!errors.adminCode}
              sx={{ mb: 2 }}
              autoFocus
            />
          </Box>
        );
        
      case 1:
        return (
          <Box sx={{ mt: 3 }}>
            <TextField
              margin="normal"
              fullWidth
              label="Admin Full Name"
              {...register('name')}
              error={!!errors.name}
              helperText={errors.name?.message}
              disabled={loading}
            />
            <TextField
              margin="normal"
              fullWidth
              label="Admin Email"
              {...register('email')}
              error={!!errors.email}
              helperText={errors.email?.message}
              disabled={loading}
            />
            <TextField
              margin="normal"
              fullWidth
              label="Password"
              type={showPassword ? 'text' : 'password'}
              {...register('password')}
              error={!!errors.password}
              helperText={errors.password?.message}
              disabled={loading}
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton onClick={() => setShowPassword(!showPassword)} edge="end">
                      {showPassword ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />
            <TextField
              margin="normal"
              fullWidth
              label="Confirm Password"
              type="password"
              {...register('confirmPassword')}
              error={!!errors.confirmPassword}
              helperText={errors.confirmPassword?.message}
              disabled={loading}
            />
          </Box>
        );

      case 2: // NEW OTP STEP
        return (
          <Box sx={{ mt: 3, textAlign: 'center' }}>
            <MailLock sx={{ fontSize: 60, color: 'primary.main', mb: 2 }} />
            <Typography variant="h5" gutterBottom>Verify Admin Email</Typography>
            <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
              A 8-digit security code was sent to <strong>{createdEmail}</strong>
            </Typography>
            <TextField
              fullWidth
              label="Verification Code"
              value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 8))}
              placeholder="00000000"
              inputProps={{ 
                style: { textAlign: 'center', letterSpacing: '0.8rem', fontSize: '1.8rem', fontWeight: 'bold' } 
              }}
              sx={{ mb: 2 }}
            />
          </Box>
        );
        
      case 3:
        return (
          <Box sx={{ mt: 3, textAlign: 'center' }}>
            <CheckCircle sx={{ fontSize: 60, color: 'success.main', mb: 2 }} />
            <Typography variant="h5" gutterBottom color="success.main">
              Setup Complete!
            </Typography>
            <Alert severity="success" sx={{ mb: 3, textAlign: 'left' }}>
              <Typography variant="body2">
                The administrator account has been verified and activated.
                <br /><br />
                <strong>Email:</strong> {createdEmail}<br/>
                <strong>Status:</strong> Active (Admin)
              </Typography>
            </Alert>
            <Button
  variant="contained"
  fullWidth
  startIcon={<Login />}
  onClick={() => navigate('/admin-login')} // Direct them to the admin-specific portal
>
  Go to Admin Login
</Button>
          </Box>
        );
      default:
        return null;
    }
  };

  return (
    <Container component="main" maxWidth="md">
      <Box sx={{ marginTop: 8, mb: 8, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <Card sx={{ width: '100%', boxShadow: 3 }}>
          <CardContent sx={{ p: 4 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
              <Security sx={{ fontSize: 40, color: 'primary.main', mr: 2 }} />
              <Typography component="h1" variant="h4">Initial Admin Setup</Typography>
            </Box>

            <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
              {steps.map((label) => (
                <Step key={label}><StepLabel>{label}</StepLabel></Step>
              ))}
            </Stepper>

            <Paper sx={{ p: 3, mb: 1 }}>
                {renderStepContent(activeStep)}
                
                {activeStep < 3 && (
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 4 }}>
                    <Button
                      onClick={handleBackStep}
                      disabled={activeStep === 0 || loading}
                      variant="outlined"
                    >
                      Back
                    </Button>
                    
                    {activeStep === 0 && (
                      <Button variant="contained" onClick={handleVerifyCode}>
                        Verify Code & Continue
                      </Button>
                    )}

                    {activeStep === 1 && (
                      <Button
                        variant="contained"
                        onClick={handleSubmit(onAccountSubmit)}
                        disabled={loading}
                        endIcon={loading && <CircularProgress size={20} color="inherit" />}
                      >
                        Create Admin Account
                      </Button>
                    )}

                    {activeStep === 2 && (
                      <Button
                        variant="contained"
                        onClick={handleVerifyOtp}
                        disabled={loading || otp.length < 8}
                        endIcon={loading && <CircularProgress size={20} color="inherit" />}
                      >
                        Verify & Finish
                      </Button>
                    )}
                  </Box>
                )}
            </Paper>
          </CardContent>
        </Card>
      </Box>
    </Container>
  );
};

export default SetupAdmin;
