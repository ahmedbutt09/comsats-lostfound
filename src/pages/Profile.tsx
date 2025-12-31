import React, { useState } from 'react';
import {
  Container,
  Paper,
  Typography,
  Box,
  TextField,
  Button,
  Grid,
  Avatar,
  Divider,
  Chip,
  Alert,
  CircularProgress,
} from '@mui/material';
import {
  Person,
  Email,
  Phone,
  School,
  Badge,
  LocationOn,
  Edit,
  Save,
  Cancel,
} from '@mui/icons-material';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';

const profileSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  phone: z.string().regex(/^\+?[\d\s-]{10,}$/, 'Please enter a valid phone number').optional(),
  student_id: z.string().optional(), // Updated field name to snake_case
  department: z.string().optional(),
});

type ProfileFormData = z.infer<typeof profileSchema>;

const Profile: React.FC = () => {
  const [isEditing, setIsEditing] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const { currentUser, userData, updateProfile } = useAuth(); // Added updateProfile from AuthContext
  
  const { register, handleSubmit, formState: { errors }, reset } = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: userData?.name || '',
      phone: userData?.phone || '',
      student_id: userData?.student_id || '', // Updated field name
      department: userData?.department || '',
    },
  });

  const onSubmit = async (data: ProfileFormData) => {
    if (!currentUser) return;

    setIsUpdating(true);
    try {
      // Use the updateProfile function from AuthContext
      await updateProfile(data);
      toast.success('Profile updated successfully');
      setIsEditing(false);
    } catch (error: any) {
      console.error('Error updating profile:', error);
      toast.error(error.message || 'Failed to update profile');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleCancel = () => {
    reset({
      name: userData?.name || '',
      phone: userData?.phone || '',
      student_id: userData?.student_id || '', // Updated field name
      department: userData?.department || '',
    });
    setIsEditing(false);
  };

  if (!currentUser) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4, mb: 8 }}>
        <Alert severity="warning">
          Please login to view your profile.
        </Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 8 }}>
      <Grid container spacing={4}>
        {/* Left Column - Profile Info */}
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 3, textAlign: 'center' }}>
            <Avatar
              sx={{
                width: 120,
                height: 120,
                fontSize: 48,
                bgcolor: 'primary.main',
                mx: 'auto',
                mb: 2,
              }}
            >
              {(userData?.name?.[0] || currentUser?.email?.[0] || 'U').toUpperCase()}
            </Avatar>
            
            <Typography variant="h5" gutterBottom fontWeight="bold">
              {userData?.name || currentUser?.email?.split('@')[0] || 'User'}
            </Typography>
            
            <Chip
              label={(userData?.role || 'STUDENT').toUpperCase()}
              color="primary"
              variant="outlined"
              size="small"
              sx={{ mb: 2 }}
            />
            
            <Divider sx={{ my: 2 }} />
            
            <Box sx={{ textAlign: 'left' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Email sx={{ mr: 2, color: 'text.secondary' }} />
                <Typography variant="body2">{currentUser.email}</Typography>
              </Box>
              
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Badge sx={{ mr: 2, color: 'text.secondary' }} />
                <Typography variant="body2">User ID: {currentUser.id.substring(0, 8)}...</Typography> {/* Updated from uid to id */}
              </Box>
              
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <LocationOn sx={{ mr: 2, color: 'text.secondary' }} />
                <Typography variant="body2">COMSATS University</Typography>
              </Box>
            </Box>
          </Paper>
        </Grid>

        {/* Right Column - Edit Form */}
        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
              <Typography variant="h5" fontWeight="bold">
                Profile Information
              </Typography>
              
              {!isEditing ? (
                <Button
                  startIcon={<Edit />}
                  variant="outlined"
                  onClick={() => setIsEditing(true)}
                >
                  Edit Profile
                </Button>
              ) : (
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <Button
                    startIcon={<Cancel />}
                    variant="outlined"
                    color="error"
                    onClick={handleCancel}
                    disabled={isUpdating}
                  >
                    Cancel
                  </Button>
                  <Button
                    startIcon={<Save />}
                    variant="contained"
                    onClick={handleSubmit(onSubmit)}
                    disabled={isUpdating}
                  >
                    {isUpdating ? <CircularProgress size={20} /> : 'Save Changes'}
                  </Button>
                </Box>
              )}
            </Box>

            <form onSubmit={handleSubmit(onSubmit)}>
              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Full Name"
                    disabled={!isEditing}
                    InputProps={{
                      startAdornment: <Person sx={{ mr: 1, color: 'action.active' }} />,
                    }}
                    {...register('name')}
                    error={!!errors.name}
                    helperText={errors.name?.message}
                  />
                </Grid>

                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Phone Number"
                    disabled={!isEditing}
                    placeholder="+92 XXX XXXXXXX"
                    InputProps={{
                      startAdornment: <Phone sx={{ mr: 1, color: 'action.active' }} />,
                    }}
                    {...register('phone')}
                    error={!!errors.phone}
                    helperText={errors.phone?.message}
                  />
                </Grid>

                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Student/Faculty ID"
                    disabled={!isEditing}
                    placeholder="CIIT/XXXX-XXXX"
                    InputProps={{
                      startAdornment: <Badge sx={{ mr: 1, color: 'action.active' }} />,
                    }}
                    {...register('student_id')} // Updated field name
                  />
                </Grid>

                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Department"
                    disabled={!isEditing}
                    placeholder="Computer Science, Electrical Engineering, etc."
                    InputProps={{
                      startAdornment: <School sx={{ mr: 1, color: 'action.active' }} />,
                    }}
                    {...register('department')}
                  />
                </Grid>

                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Email"
                    value={currentUser.email || ''}
                    disabled
                    InputProps={{
                      startAdornment: <Email sx={{ mr: 1, color: 'action.active' }} />,
                    }}
                  />
                  <Typography variant="caption" color="text.secondary" sx={{ mt: 1 }}>
                    Email cannot be changed. Contact admin for email updates.
                  </Typography>
                </Grid>
              </Grid>
            </form>

            {/* Account Info */}
            <Divider sx={{ my: 4 }} />
            
            <Typography variant="h6" gutterBottom>
              Account Information
            </Typography>
            
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <Paper variant="outlined" sx={{ p: 2 }}>
                  <Typography variant="caption" color="text.secondary" display="block">
                    Email Verified
                  </Typography>
                  <Typography variant="body2">
                    {currentUser.confirmed_at ? 'Yes' : 'No'} {/* Supabase uses confirmed_at */}
                    {!currentUser.confirmed_at && (
                      <Button size="small" sx={{ ml: 1 }}>
                        Verify
                      </Button>
                    )}
                  </Typography>
                </Paper>
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <Paper variant="outlined" sx={{ p: 2 }}>
                  <Typography variant="caption" color="text.secondary" display="block">
                    Account Status
                  </Typography>
                  <Chip
                    label="ACTIVE"
                    color="success"
                    size="small"
                  />
                </Paper>
              </Grid>
            </Grid>
          </Paper>
        </Grid>
      </Grid>
    </Container>
  );
};

export default Profile;
