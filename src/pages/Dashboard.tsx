import React, { useState, useEffect } from 'react';
import {
  Container,
  Grid,
  Paper,
  Typography,
  Box,
  Button,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Chip,
  Divider,
  Avatar,
  CircularProgress,
} from '@mui/material';
import {
  AddCircle,
  Search,
  CheckCircle,
  Pending,
  FindInPage,
  Person,
  Email,
  Phone,
  School,
  LocationOn,
} from '@mui/icons-material';
import { useNavigate, Link as RouterLink } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import LoadingSpinner from '../components/common/LoadingSpinner';
import CaseCard from '../components/cases/CaseCard';
import { supabase } from '../lib/supabaseClient';
import { Case, User } from '../types';

interface CaseWithUser extends Case {
  user_name?: string;
}

const Dashboard: React.FC = () => {
  const { userData, currentUser } = useAuth();
  const navigate = useNavigate();
  
  const [userCases, setUserCases] = useState<CaseWithUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Load user's cases
  const loadUserCases = async (userId: string) => {
    try {
      setIsLoading(true);
      
      // Fetch user's cases
      const { data: casesData, error } = await supabase
        .from('cases')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      
      // Fetch user names for each case if needed
      const casesWithUsers: CaseWithUser[] = (casesData || []).map(caseItem => {
        // If we have userData, use it, otherwise just return the case
        return {
          ...caseItem,
          user_name: userData?.name
        };
      });
      
      setUserCases(casesWithUsers);
    } catch (error) {
      console.error('Error loading user cases:', error);
      setUserCases([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Load recent cases (not user-specific)
  const loadRecentCases = async () => {
    // This function could be used to show recent lost/found cases on the dashboard
    // For now, we're just loading user cases
    // You can implement this if needed
  };

  useEffect(() => {
    // Load user's cases when component mounts or user changes
    if (currentUser?.id) {
      loadUserCases(currentUser.id);
    }
  }, [currentUser?.id]);

  // Calculate stats from actual userCases - Updated for Supabase status values
  const stats = [
    { 
      label: 'Active Cases', // Updated from 'Open Cases'
      value: userCases.filter(c => c.status === 'active').length, // Updated status
      icon: <Pending color="warning" />, 
      color: 'warning.main' 
    },
    { 
      label: 'Resolved Cases', 
      value: userCases.filter(c => c.status === 'resolved' || c.status === 'closed').length, 
      icon: <CheckCircle color="success" />, 
      color: 'success.main' 
    },
    { 
      label: 'Reports Made', 
      value: userCases.length, 
      icon: <AddCircle color="primary" />, 
      color: 'primary.main' 
    },
    { 
      label: 'Items Found', 
      value: userCases.filter(c => c.type === 'found').length, 
      icon: <Search color="info" />, 
      color: 'info.main' 
    },
  ];

  // Show loading spinner while loading data
  if (isLoading && userCases.length === 0) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4, mb: 8 }}>
        <LoadingSpinner message="Loading your dashboard..." />
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 8 }}>
      {/* Welcome Header */}
      <Paper 
        sx={{ 
          p: 3, 
          mb: 4, 
          background: 'linear-gradient(135deg, #1a237e 0%, #283593 100%)',
          color: 'white',
          borderRadius: 2,
        }}
      >
        <Grid container spacing={3} alignItems="center">
          <Grid item xs={12} md={8}>
            <Typography variant="h4" gutterBottom fontWeight={700} sx={{ opacity: 0.9, color: 'orange' }}>
              Welcome back, {userData?.name || currentUser?.email?.split('@')[0] || 'User'}!
            </Typography>
            <Typography variant="body1" sx={{ opacity: 0.9 }}>
              Manage your lost and found cases, track items, and help others in the COMSATS community.
            </Typography>
          </Grid>
          <Grid item xs={12} md={4} sx={{ textAlign: { xs: 'left', md: 'right' } }}>
            <Button
              variant="contained"
              color="secondary"
              startIcon={<AddCircle />}
              onClick={() => navigate('/report')}
              size="large"
            >
              Report New Case
            </Button>
          </Grid>
        </Grid>
      </Paper>

      {/* Quick Stats */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {stats.map((stat) => (
          <Grid item xs={6} sm={3} key={stat.label}>
            <Paper
              sx={{
                p: 3,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                borderLeft: '4px solid',
                borderLeftColor: stat.color,
                borderRadius: 2,
              }}
            >
              <Box sx={{ mb: 2, color: stat.color }}>
                {stat.icon}
              </Box>
              <Typography component="p" variant="h4" fontWeight={700}>
                {stat.value}
              </Typography>
              <Typography color="text.secondary" sx={{ mt: 1 }}>
                {stat.label}
              </Typography>
            </Paper>
          </Grid>
        ))}
      </Grid>

      <Grid container spacing={3}>
        {/* User Profile Card */}
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 3, borderRadius: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
              <Avatar
                sx={{ 
                  width: 64, 
                  height: 64, 
                  mr: 2, 
                  bgcolor: 'secondary.main',
                  fontSize: '1.5rem',
                }}
              >
                {(userData?.name?.[0] || currentUser?.email?.[0] || 'U').toUpperCase()}
              </Avatar>
              <Box>
                <Typography variant="h6" fontWeight={600}>
                  {userData?.name || currentUser?.email?.split('@')[0] || 'User'}
                </Typography>
                <Chip
                  label={(userData?.role || 'student').toUpperCase()}
                  size="small"
                  color="primary"
                  variant="outlined"
                  sx={{ mt: 0.5 }}
                />
              </Box>
            </Box>
            
            <Divider sx={{ my: 2 }} />
            
            <List dense>
              <ListItem>
                <ListItemIcon sx={{ minWidth: 40 }}>
                  <Email fontSize="small" color="action" />
                </ListItemIcon>
                <ListItemText 
                  primary="Email" 
                  secondary={currentUser?.email || 'N/A'}
                />
              </ListItem>
              {(userData?.phone) && (
                <ListItem>
                  <ListItemIcon sx={{ minWidth: 40 }}>
                    <Phone fontSize="small" color="action" />
                  </ListItemIcon>
                  <ListItemText 
                    primary="Phone" 
                    secondary={userData.phone}
                  />
                </ListItem>
              )}
              {userData?.student_id && ( // Updated field name
                <ListItem>
                  <ListItemIcon sx={{ minWidth: 40 }}>
                    <School fontSize="small" color="action" />
                  </ListItemIcon>
                  <ListItemText 
                    primary="Student ID" 
                    secondary={userData.student_id}
                  />
                </ListItem>
              )}
              <ListItem>
                <ListItemIcon sx={{ minWidth: 40 }}>
                  <LocationOn fontSize="small" color="action" />
                </ListItemIcon>
                <ListItemText 
                  primary="Campus" 
                  secondary="COMSATS University Islamabad"
                />
              </ListItem>
            </List>
            
            <Button
              fullWidth
              variant="outlined"
              component={RouterLink}
              to="/profile"
              startIcon={<Person />}
              sx={{ mt: 2 }}
            >
              Edit Profile
            </Button>
          </Paper>
        </Grid>

        {/* Recent Cases */}
        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 3, borderRadius: 2 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
              <Typography variant="h6" fontWeight={600}>
                Your Recent Cases
              </Typography>
              <Button component={RouterLink} to="/my-cases" size="small">
                View All
              </Button>
            </Box>
            
            {userCases.length > 0 ? (
              <Grid container spacing={2}>
                {userCases.slice(0, 3).map((caseItem) => ( // Show only 3 most recent
                  <Grid item xs={12} sm={6} md={4} key={caseItem.id}>
                    <CaseCard 
                      caseItem={caseItem} 
                      compact={true}
                      showActions={false}
                      userName={caseItem.user_name} // Pass userName prop
                    />
                  </Grid>
                ))}
              </Grid>
            ) : (
              <Box sx={{ textAlign: 'center', py: 4 }}>
                <FindInPage sx={{ fontSize: 48, color: 'text.disabled', mb: 2 }} />
                <Typography variant="body1" color="text.secondary">
                  No cases yet
                </Typography>
                <Button
                  variant="text"
                  onClick={() => navigate('/report')}
                  sx={{ mt: 1 }}
                >
                  Report your first case
                </Button>
              </Box>
            )}
          </Paper>
        </Grid>
      </Grid>

      {/* Quick Actions */}
      <Paper sx={{ p: 3, mt: 4, borderRadius: 2 }}>
        <Typography variant="h6" gutterBottom fontWeight={600}>
          Quick Actions
        </Typography>
        <Grid container spacing={2}>
          <Grid item xs={6} sm={3}>
            <Button
              fullWidth
              variant="contained"
              startIcon={<AddCircle />}
              component={RouterLink}
              to="/report?type=lost"
              sx={{ py: 1.5 }}
            >
              Report Lost
            </Button>
          </Grid>
          <Grid item xs={6} sm={3}>
            <Button
              fullWidth
              variant="contained"
              color="secondary"
              startIcon={<AddCircle />}
              component={RouterLink}
              to="/report?type=found"
              sx={{ py: 1.5 }}
            >
              Report Found
            </Button>
          </Grid>
          <Grid item xs={6} sm={3}>
            <Button
              fullWidth
              variant="outlined"
              startIcon={<Search />}
              component={RouterLink}
              to="/lost"
              sx={{ py: 1.5 }}
            >
              Browse Lost
            </Button>
          </Grid>
          <Grid item xs={6} sm={3}>
            <Button
              fullWidth
              variant="outlined"
              color="secondary"
              startIcon={<Search />}
              component={RouterLink}
              to="/found"
              sx={{ py: 1.5 }}
            >
              Browse Found
            </Button>
          </Grid>
        </Grid>
      </Paper>
    </Container>
  );
};

export default Dashboard;
