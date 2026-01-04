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
  MenuItem,
  IconButton,
  InputAdornment,
} from '@mui/material';
import { Visibility, VisibilityOff } from '@mui/icons-material';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuth } from '../../contexts/AuthContext';
// Removed isValidComsatsEmail import as it is no longer needed
import toast from 'react-hot-toast';

const registerSchema = z.object({
  name: z.string()
    .min(2, 'Name must be at least 2 characters')
    .max(50, 'Name must be less than 50 characters'),
  email: z.string()
    .min(1, 'Email is required')
    .email('Invalid email address'), // Removed the .refine block that forced COMSATS emails
  password: z.string()
    .min(1, 'Password is required')
    .min(6, 'Password must be at least 6 characters'),
  confirmPassword: z.string()
    .min(1, 'Please confirm your password'),
  phone: z.string()
    .optional()
    .refine((phone) => !phone || /^[0-9+\-\s()]{10,15}$/.test(phone.replace(/\s/g, '')), {
      message: 'Invalid phone number',
    }),
  studentId: z.string().optional(),
  department: z.string().optional(),
  role: z.enum(['student', 'faculty']).default('student'),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

type RegisterFormData = z.infer<typeof registerSchema>;

const Register: React.FC = () => {
  const [showPassword, setShowPassword] = React.useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = React.useState(false);
  const [loading, setLoading] = React.useState(false);
  const navigate = useNavigate();
  const { register: registerUser } = useAuth();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      name: '',
      email: '',
      password: '',
      confirmPassword: '',
      phone: '',
      studentId: '',
      department: '', // Ensure this is an empty string, not undefined
      role: 'student',
    },
  });

  // Inside your onSubmit function in Register.tsx
  const onSubmit = async (data: RegisterFormData) => {
    try {
      setLoading(true);
      
      const additionalData = {
        role: data.role,
        studentId: data.studentId || '',
        phone: data.phone || '',
        department: data.department || '',
      };
      
      // Call the sign up service
      await registerUser(data.email, data.password, data.name, additionalData);
      
      // SUCCESS: Instead of setting a local 'success' state, we move to the OTP page
      toast.success('Account created! Please enter the verification code.');
      
      // This is the line that fixes your issue:
      navigate('/verify-email', { state: { email: data.email } });
      
    } catch (error: any) {
      console.error('Registration error:', error);
      toast.error(error.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  const handleClickShowPassword = () => setShowPassword(!showPassword);
  const handleClickShowConfirmPassword = () => setShowConfirmPassword(!showConfirmPassword);

  // 1. Updated Roles (Simplified)
const roles = [
  { value: 'student', label: 'Student' },
  { value: 'faculty', label: 'Faculty Member' },
];

  // 2. Comprehensive COMSATS Departments
const departments = [
  // Faculty of Information Science and Technology
  'Computer Science',
  'Software Engineering',
  'Cyber Security',
  'Artificial Intelligence',
  'Data Science',
  
  // Faculty of Engineering
  'Electrical & Computer Engineering',
  'Mechanical Engineering',
  'Civil Engineering',
  'Chemical Engineering',
  
  // Faculty of Business Administration
  'Management Sciences',
  'Economics',
  'Development Studies',
  
  // Faculty of Sciences
  'Mathematics',
  'Physics',
  'Chemistry',
  'Biosciences',
  'Meteorology',
  'Earth Sciences',
  'Environmental Sciences',
  
  // Faculty of Architecture and Design
  'Architecture',
  'Design',
  
  // Others
  'Humanities',
  'Psychology',
  'Other',
];

  return (
    <Container component="main" maxWidth="sm">
      <Box sx={{ marginTop: 4, marginBottom: 8, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <Paper elevation={3} sx={{ padding: 4, display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%' }}>
          <Typography component="h1" variant="h4" sx={{ mb: 3 }}>
            Create Account
          </Typography>

          <Alert severity="info" sx={{ mb: 3, width: '100%' }}>
            Join the Lost & Found community. You can use any valid email address to sign up.
          </Alert>

          <Box component="form" onSubmit={handleSubmit(onSubmit)} sx={{ width: '100%' }}>
            <TextField
              margin="normal"
              required
              fullWidth
              id="name"
              label="Full Name"
              autoComplete="name"
              autoFocus
              {...register('name')}
              error={!!errors.name}
              helperText={errors.name?.message}
              disabled={loading}
            />

            <TextField
              margin="normal"
              required
              fullWidth
              id="email"
              label="Email Address"
              autoComplete="email"
              {...register('email')}
              error={!!errors.email}
              helperText={errors.email?.message}
              disabled={loading}
              InputProps={{
                placeholder: 'e.g. yourname@gmail.com',
              }}
            />

            <TextField
              margin="normal"
              required
              fullWidth
              label="Password"
              type={showPassword ? 'text' : 'password'}
              id="password"
              autoComplete="new-password"
              {...register('password')}
              error={!!errors.password}
              helperText={errors.password?.message}
              disabled={loading}
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton onClick={handleClickShowPassword} edge="end">
                      {showPassword ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />

            <TextField
              margin="normal"
              required
              fullWidth
              label="Confirm Password"
              type={showConfirmPassword ? 'text' : 'password'}
              id="confirmPassword"
              autoComplete="new-password"
              {...register('confirmPassword')}
              error={!!errors.confirmPassword}
              helperText={errors.confirmPassword?.message}
              disabled={loading}
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton onClick={handleClickShowConfirmPassword} edge="end">
                      {showConfirmPassword ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />

            <TextField
              margin="normal"
              fullWidth
              id="phone"
              label="Phone Number (Optional)"
              autoComplete="tel"
              {...register('phone')}
              error={!!errors.phone}
              helperText={errors.phone?.message}
              disabled={loading}
              InputProps={{
                placeholder: '+923001234567',
              }}
            />

            <TextField
              margin="normal"
              fullWidth
              id="studentId"
              label="Student/Employee ID (Optional)"
              {...register('studentId')}
              error={!!errors.studentId}
              helperText={errors.studentId?.message}
              disabled={loading}
            />

            <TextField
              margin="normal"
              fullWidth
              select
              id="role"
              label="Role"
              defaultValue="student"
              {...register('role')}
              error={!!errors.role}
              helperText={errors.role?.message}
              disabled={loading}
            >
              {roles.map((option) => (
                <MenuItem key={option.value} value={option.value}>
                  {option.label}
                </MenuItem>
              ))}
            </TextField>

            <TextField
  margin="normal"
  fullWidth
  select
  id="department"
  label="Department (Optional)"
  // Important: Add value={watch('department') || ''} if using watch, 
  // or ensure the register spread doesn't result in undefined.
  {...register('department')}
  error={!!errors.department}
  helperText={errors.department?.message}
  disabled={loading}
>
  {/* The value here MUST match the default value exactly (empty string) */}
  <MenuItem value="">
    <em>None / Select Department</em>
  </MenuItem>
  {departments.map((dept) => (
    <MenuItem key={dept} value={dept}>{dept}</MenuItem>
  ))}
</TextField>

            <Button
              type="submit"
              fullWidth
              variant="contained"
              sx={{ mt: 3, mb: 2, py: 1.5 }}
              disabled={loading}
            >
              {loading ? 'Creating Account...' : 'Sign Up'}
            </Button>

            <Box sx={{ textAlign: 'center', mt: 2 }}>
              <Typography variant="body2" color="text.secondary">
                Already have an account?{' '}
                <Link component={RouterLink} to="/login" variant="body2" sx={{ textDecoration: 'none' }}>
                  Sign in
                </Link>
              </Typography>
            </Box>
          </Box>
        </Paper>
      </Box>
    </Container>
  );
};

export default Register;