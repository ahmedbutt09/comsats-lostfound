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
} from '@mui/material';
import { Security, CheckCircle, Error, Login } from '@mui/icons-material';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { authService } from '../services/supabaseAuthService';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

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
    .refine((code) => code === 'INITIAL_SETUP_2024', {
      message: 'Invalid setup code',
    }),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

type SetupFormData = z.infer<typeof setupSchema>;

const steps = ['Enter Setup Code', 'Create Admin Account', 'Complete Setup'];

const SetupAdmin: React.FC = () => {
  const [activeStep, setActiveStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [adminCreated, setAdminCreated] = useState(false);
  const [createdEmail, setCreatedEmail] = useState('');
  const [createdPassword, setCreatedPassword] = useState('');
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    formState: { errors },
    trigger,
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

  /**
   * FIX: Manual verification for Step 0
   * This bypasses the full form validation (email/password)
   */
  const handleVerifyCode = async () => {
    const isCodeValid = await trigger('adminCode');
    if (isCodeValid) {
      setActiveStep(1);
    } else {
      toast.error('Please enter the correct setup code');
    }
  };

  /**
   * Final Form Submission for Step 1
   */
  const onSubmit = async (data: SetupFormData) => {
    setLoading(true);
    try {
      await authService.setupFirstAdmin(data.email, data.password, data.name);
      setAdminCreated(true);
      setCreatedEmail(data.email);
      setCreatedPassword(data.password);
      setActiveStep(2);
      toast.success('Admin account created!');
    } catch (error: any) {
      toast.error(error.message || 'Registration failed');
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
              helperText={errors.adminCode?.message || 'Enter: INITIAL_SETUP_2024'}
              sx={{ mb: 2 }}
              autoFocus
            />
            <Alert severity="info">
              <Typography variant="body2">
                <strong>Default setup code: INITIAL_SETUP_2024</strong>
              </Typography>
            </Alert>
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
              type="password"
              {...register('password')}
              error={!!errors.password}
              helperText={errors.password?.message}
              disabled={loading}
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
        
      case 2:
        return (
          <Box sx={{ mt: 3, textAlign: 'center' }}>
            <CheckCircle sx={{ fontSize: 60, color: 'success.main', mb: 2 }} />
            <Typography variant="h5" gutterBottom color="success.main">
              Setup Complete!
            </Typography>
            <Alert severity="success" sx={{ mb: 3, textAlign: 'left' }}>
              <Typography variant="body2">
                <strong>Email:</strong> {createdEmail}<br/>
                <strong>Password:</strong> {createdPassword}
              </Typography>
            </Alert>
            <Button
              variant="contained"
              fullWidth
              startIcon={<Login />}
              onClick={() => navigate('/admin-login')}
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
      <Box sx={{ marginTop: 8, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
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

            <Paper sx={{ p: 3, mb: 3 }}>
              {/* The form only wraps content for the final submission on Step 1 */}
              <form onSubmit={handleSubmit(onSubmit)}>
                {renderStepContent(activeStep)}
                
                {activeStep < 2 && (
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 4 }}>
                    <Button
                      onClick={handleBackStep}
                      disabled={activeStep === 0 || loading}
                      variant="outlined"
                    >
                      Back
                    </Button>
                    
                    {activeStep === 0 ? (
                      /* FIX: This button is NOT a submit type. It runs a manual check. */
                      <Button
                        type="button" 
                        variant="contained"
                        onClick={handleVerifyCode}
                      >
                        Verify Code & Continue
                      </Button>
                    ) : (
                      /* Final submission button */
                      <Button
                        type="submit"
                        variant="contained"
                        disabled={loading}
                        endIcon={loading && <CircularProgress size={20} />}
                      >
                        Create Admin Account
                      </Button>
                    )}
                  </Box>
                )}
              </form>
            </Paper>
          </CardContent>
        </Card>
      </Box>
    </Container>
  );
};

export default SetupAdmin;
