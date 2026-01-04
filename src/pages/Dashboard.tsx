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
import { Case } from '../types';

interface CaseWithUser extends Case {
  user_name?: string;
}

const Dashboard: React.FC = () => {
  // Destructure 'loading' from AuthContext
  const { userData, currentUser, loading } = useAuth();
  const navigate = useNavigate();
  
  const [userCases, setUserCases] = useState<CaseWithUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  /**
   * Fetches cases created by the logged-in user.
   * Includes logic to use Google metadata names if DB profile is missing.
   */
  const loadUserCases = async (userId: string) => {
    try {
      setIsLoading(true);
      
      const { data: casesData, error } = await supabase
        .from('cases')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      
      const casesWithUsers: CaseWithUser[] = (casesData || []).map(caseItem => ({
        ...caseItem,
        user_name: userData?.name || currentUser?.user_metadata?.full_name || currentUser?.email?.split('@')[0]
      }));
      
      setUserCases(casesWithUsers);
    } catch (error) {
      console.error('Error loading user cases:', error);
      setUserCases([]);
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Core initialization logic.
   * Ensures the loading spinner stops even if Google users don't have a DB profile yet.
   */
  useEffect(() => {
    const init = async () => {
      // Use 'loading' (the name from your AuthContext)
      if (!loading) {
        if (currentUser?.id) {
          await loadUserCases(currentUser.id);
        } else {
          setIsLoading(false);
        }
      }
    };
    init();
  }, [currentUser?.id, loading, userData]);

  // UI Stats Calculation
  const stats = [
    { 
      label: 'Active Cases', 
      value: userCases.filter(c => c.status === 'active').length, 
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

  // BLOCKING LOADING STATE
  if (loading || (isLoading && userCases.length === 0)) {
    return (
      <Container maxWidth="lg" sx={{ mt: 10, textAlign: 'center' }}>
        <LoadingSpinner message={loading ? "Verifying authentication..." : "Loading your dashboard..."} />
      </Container>
    );
  }

  if (!currentUser) return null;

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 8 }}>
      
      {/* 1. WELCOME HEADER SECTION */}
      <Paper 
        sx={{ 
          p: 3, mb: 4, 
          background: 'linear-gradient(135deg, #1a237e 0%, #283593 100%)',
          color: 'white', borderRadius: 2, boxShadow: 3
        }}
      >
        <Grid container spacing={3} alignItems="center">
          <Grid item xs={12} md={8}>
            <Typography variant="h4" gutterBottom fontWeight={700} sx={{ color: 'orange' }}>
              Welcome back, {userData?.name || currentUser?.user_metadata?.full_name || 'User'}!
            </Typography>
            <Typography variant="body1" sx={{ opacity: 0.9 }}>
              Manage your lost and found cases, track items, and help others in the COMSATS community.
            </Typography>
          </Grid>
          <Grid item xs={12} md={4} sx={{ textAlign: { xs: 'left', md: 'right' } }}>
            <Button
              variant="contained" color="secondary" size="large"
              startIcon={<AddCircle />} onClick={() => navigate('/report')}
              sx={{ fontWeight: 'bold' }}
            >
              Report New Case
            </Button>
          </Grid>
        </Grid>
      </Paper>

      {/* 2. STATS GRID SECTION */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {stats.map((stat) => (
          <Grid item xs={6} sm={3} key={stat.label}>
            <Paper 
              sx={{ 
                p: 3, display: 'flex', flexDirection: 'column', alignItems: 'center', 
                borderLeft: '4px solid', borderLeftColor: stat.color, borderRadius: 2,
                transition: '0.3s', '&:hover': { transform: 'translateY(-5px)', boxShadow: 4 }
              }}
            >
              <Box sx={{ mb: 2, color: stat.color }}>{stat.icon}</Box>
              <Typography variant="h4" fontWeight={700}>{stat.value}</Typography>
              <Typography color="text.secondary" variant="body2">{stat.label}</Typography>
            </Paper>
          </Grid>
        ))}
      </Grid>

      <Grid container spacing={3}>
        {/* 3. USER PROFILE SIDEBAR */}
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 3, borderRadius: 2, height: '100%' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
              <Avatar 
                src={userData?.avatar_url || currentUser?.user_metadata?.avatar_url}
                sx={{ width: 80, height: 80, mr: 2, bgcolor: 'secondary.main', border: '2px solid white', boxShadow: 2 }}
              >
                {(userData?.name?.[0] || currentUser?.email?.[0] || 'U').toUpperCase()}
              </Avatar>
              <Box>
                <Typography variant="h6" fontWeight={700}>
                  {userData?.name || currentUser?.user_metadata?.full_name || 'User'}
                </Typography>
                <Chip 
                  label={(userData?.role || 'student').toUpperCase()} 
                  size="small" color="primary" variant="outlined" 
                  sx={{ mt: 0.5, fontWeight: 'bold' }} 
                />
              </Box>
            </Box>

            <Divider sx={{ my: 2 }} />
            
            <List dense>
              <ListItem sx={{ px: 0 }}>
                <ListItemIcon sx={{ minWidth: 40 }}><Email color="action" fontSize="small" /></ListItemIcon>
                <ListItemText primary="Email" secondary={currentUser?.email} />
              </ListItem>
              {userData?.phone && (
                <ListItem sx={{ px: 0 }}>
                  <ListItemIcon sx={{ minWidth: 40 }}><Phone color="action" fontSize="small" /></ListItemIcon>
                  <ListItemText primary="Phone" secondary={userData.phone} />
                </ListItem>
              )}
              {userData?.student_id && (
                <ListItem sx={{ px: 0 }}>
                  <ListItemIcon sx={{ minWidth: 40 }}><School color="action" fontSize="small" /></ListItemIcon>
                  <ListItemText primary="Student ID" secondary={userData.student_id} />
                </ListItem>
              )}
              <ListItem sx={{ px: 0 }}>
                <ListItemIcon sx={{ minWidth: 40 }}><LocationOn color="action" fontSize="small" /></ListItemIcon>
                <ListItemText primary="Campus" secondary="CUI Abbottabad" />
              </ListItem>
            </List>

            <Button 
              fullWidth variant="outlined" component={RouterLink} to="/profile" 
              startIcon={<Person />} sx={{ mt: 2, borderRadius: 2 }}
            >
              Edit Profile
            </Button>
          </Paper>
        </Grid>

        {/* 4. RECENT CASES SECTION */}
        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 3, borderRadius: 2, height: '100%' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
              <Typography variant="h6" fontWeight={700}>Your Recent Cases</Typography>
              <Button component={RouterLink} to="/my-cases" size="small" variant="text">View All</Button>
            </Box>
            
            {userCases.length > 0 ? (
              <Grid container spacing={2}>
                {userCases.slice(0, 3).map((caseItem) => (
                  <Grid item xs={12} sm={6} md={4} key={caseItem.id}>
                    <CaseCard 
                      caseItem={caseItem} 
                      compact={true} 
                      showActions={false} 
                      userName={caseItem.user_name} 
                    />
                  </Grid>
                ))}
              </Grid>
            ) : (
              <Box sx={{ textAlign: 'center', py: 8 }}>
                <FindInPage sx={{ fontSize: 60, color: 'text.disabled', mb: 2 }} />
                <Typography variant="h6" color="text.secondary" gutterBottom>No cases reported yet.</Typography>
                <Button variant="text" onClick={() => navigate('/report')}>Report your first case</Button>
              </Box>
            )}
          </Paper>
        </Grid>
      </Grid>

      {/* 5. QUICK ACTIONS SECTION (Restored) */}
      <Paper sx={{ p: 3, mt: 4, borderRadius: 2 }}>
        <Typography variant="h6" gutterBottom fontWeight={700}>Quick Actions</Typography>
        <Grid container spacing={2}>
          <Grid item xs={6} sm={3}>
            <Button 
              fullWidth variant="contained" startIcon={<AddCircle />} 
              component={RouterLink} to="/report?type=lost" sx={{ py: 1.5, borderRadius: 2 }}
            >
              Report Lost
            </Button>
          </Grid>
          <Grid item xs={6} sm={3}>
            <Button 
              fullWidth variant="contained" color="secondary" startIcon={<AddCircle />} 
              component={RouterLink} to="/report?type=found" sx={{ py: 1.5, borderRadius: 2 }}
            >
              Report Found
            </Button>
          </Grid>
          <Grid item xs={6} sm={3}>
            <Button 
              fullWidth variant="outlined" startIcon={<Search />} 
              component={RouterLink} to="/lost" sx={{ py: 1.5, borderRadius: 2 }}
            >
              Browse Lost
            </Button>
          </Grid>
          <Grid item xs={6} sm={3}>
            <Button 
              fullWidth variant="outlined" color="secondary" startIcon={<Search />} 
              component={RouterLink} to="/found" sx={{ py: 1.5, borderRadius: 2 }}
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
