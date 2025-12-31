import * as React from 'react';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import {
  Box,
  Button,
  TextField,
  Typography,
  Container,
  Paper,
  Link,
  Alert,
  IconButton,
  InputAdornment,
  Card,
  CardContent,
} from '@mui/material';
import { Visibility, VisibilityOff, Security, Lock } from '@mui/icons-material';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuth } from '../../contexts/AuthContext';
import toast from 'react-hot-toast';

const adminLoginSchema = z.object({
  email: z.string()
    .min(1, 'Email is required')
    .email('Invalid email address'),
  password: z.string()
    .min(1, 'Password is required'),
});

type AdminLoginFormData = z.infer<typeof adminLoginSchema>;

const AdminLogin: React.FC = () => {
  const [showPassword, setShowPassword] = React.useState(false);
  const [loading, setLoading] = React.useState(false);
  const navigate = useNavigate();
  const { login } = useAuth();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<AdminLoginFormData>({
    resolver: zodResolver(adminLoginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const onSubmit = async (data: AdminLoginFormData) => {
    try {
      setLoading(true);
      await login(data.email, data.password);
      
      toast.success('Admin login successful');
      navigate('/admin');
    } catch (error: any) {
      // Note: The actual admin check is now handled in the AuthContext
      // by checking the user's role from the database
      toast.error(error.message || 'Admin login failed');
    } finally {
      setLoading(false);
    }
  };

  const handleClickShowPassword = () => {
    setShowPassword(!showPassword);
  };

  const handleSetupAdmin = () => {
    navigate('/setup-admin');
  };

  return (
    <Container component="main" maxWidth="sm">
      <Box
        sx={{
          marginTop: 8,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
        }}
      >
        <Card sx={{ width: '100%', boxShadow: 3 }}>
          <CardContent sx={{ p: 4 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
              <Security sx={{ fontSize: 40, color: 'primary.main', mr: 2 }} />
              <Box>
                <Typography component="h1" variant="h4">
                  Admin Login
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  COMSATS Lost & Found System
                </Typography>
              </Box>
            </Box>

            <Alert severity="warning" sx={{ mb: 3 }}>
              <Typography variant="body2">
                <strong>Restricted Access:</strong> This portal is for authorized administrators only.
                Unauthorized access is prohibited.
              </Typography>
            </Alert>

            <Box
              component="form"
              onSubmit={handleSubmit(onSubmit)}
              sx={{ width: '100%' }}
            >
              <TextField
                margin="normal"
                required
                fullWidth
                id="email"
                label="Admin Email"
                autoComplete="email"
                autoFocus
                {...register('email')}
                error={!!errors.email}
                helperText={errors.email?.message}
                disabled={loading}
                InputProps={{
                  startAdornment: (
                    <Lock sx={{ mr: 1, color: 'action.active' }} />
                  ),
                }}
              />

              <TextField
                margin="normal"
                required
                fullWidth
                label="Admin Password"
                type={showPassword ? 'text' : 'password'}
                id="password"
                autoComplete="current-password"
                {...register('password')}
                error={!!errors.password}
                helperText={errors.password?.message}
                disabled={loading}
                InputProps={{
                  startAdornment: (
                    <Lock sx={{ mr: 1, color: 'action.active' }} />
                  ),
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        aria-label="toggle password visibility"
                        onClick={handleClickShowPassword}
                        edge="end"
                      >
                        {showPassword ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
              />

              <Button
                type="submit"
                fullWidth
                variant="contained"
                sx={{ mt: 3, mb: 2, py: 1.5 }}
                disabled={loading}
              >
                {loading ? 'Authenticating...' : 'Login as Admin'}
              </Button>

              <Alert severity="info" sx={{ mt: 2 }}>
                <Typography variant="body2">
                  <strong>Note:</strong> Admin access is determined by user role in the database.
                  Contact system administrator for access.
                </Typography>
              </Alert>

              <Box sx={{ mt: 3, textAlign: 'center' }}>
                <Button
                  variant="text"
                  onClick={handleSetupAdmin}
                  size="small"
                >
                  Setup First Admin
                </Button>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                  <Link component={RouterLink} to="/login" variant="body2">
                    Back to User Login
                  </Link>
                </Typography>
              </Box>
            </Box>
          </CardContent>
        </Card>
      </Box>
    </Container>
  );
};

export default AdminLogin;
