import React, { useState, useEffect } from 'react';
import {
  Container,
  Grid,
  Paper,
  Typography,
  Box,
  Tabs,
  Tab,
  Button,
  Chip,
  Alert,
  CircularProgress,
  Table,
  TableBody,
  TableCell,
  Tooltip,
  IconButton,
  TableContainer,
  TableHead,
  TableRow,
  Switch,
  FormControlLabel,
  Divider,
} from '@mui/material';
import {
  Dashboard as DashboardIcon,
  People,
  ListAlt,
  Settings,
  Notifications,
  Security,
  Analytics,
  Refresh,
  Delete,
  Email,
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import StatsCard from '../components/dashboard/StatsCard';
import AdminCaseList from '../components/dashboard/AdminCaseList';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import { Case } from '../types';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`admin-tabpanel-${index}`}
      aria-labelledby={`admin-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ py: 3 }}>{children}</Box>}
    </div>
  );
}

interface CaseWithUser extends Case {
  user_name?: string;
  user_email?: string;
}

interface UserBasicInfo {
  id: string;
  name: string;
  email: string;
  created_at?: string;
  is_banned?: boolean;
}

const AdminDashboard: React.FC = () => {
  const { currentUser, userData, isAdmin } = useAuth();
  const navigate = useNavigate();
  const [tabValue, setTabValue] = useState(0);
  const [cases, setCases] = useState<CaseWithUser[]>([]);
  const [usersList, setUsersList] = useState<UserBasicInfo[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUsersLoading, setIsUsersLoading] = useState(false);

  const [stats, setStats] = useState({
    totalUsers: 0,
    totalCases: 0,
    activeCases: 0,
    resolvedCases: 0,
    newCasesToday: 0,
    matchesThisWeek: 0,
    avgResolutionTime: '3.2 days',
    userSatisfaction: 92,
  });

  // Fetch users for the User Management tab
  const loadUsers = async () => {
    try {
      setIsUsersLoading(true);
      const { data, error } = await supabase
        .from('users')
        .select('id, name, email, created_at')
        .order('name', { ascending: true });

      if (error) throw error;
      setUsersList(data || []);
      setStats(prev => ({ ...prev, totalUsers: data?.length || 0 }));
    } catch (error) {
      console.error('Error loading users:', error);
    } finally {
      setIsUsersLoading(false);
    }
  };

  const loadCases = async () => {
    try {
      setIsLoading(true);
      const { data: casesData, error: casesError } = await supabase
        .from('cases')
        .select('*')
        .order('created_at', { ascending: false });

      if (casesError) throw casesError;

      const userIds: string[] = [];
      casesData?.forEach(caseItem => {
        if (caseItem.user_id && !userIds.includes(caseItem.user_id)) {
          userIds.push(caseItem.user_id);
        }
      });

      let users: UserBasicInfo[] = [];
      if (userIds.length > 0) {
        const { data: usersData, error: usersError } = await supabase
          .from('users')
          .select('id, name, email')
          .in('id', userIds);
        if (usersError) throw usersError;
        users = usersData || [];
      }

      const casesWithUsers: CaseWithUser[] = (casesData || []).map(caseItem => {
        const user = users.find(u => u.id === caseItem.user_id);
        return {
          ...caseItem,
          user_name: user?.name,
          user_email: user?.email
        };
      });

      setCases(casesWithUsers);

      const active = casesWithUsers.filter(c => c.status === 'active').length;
      const resolved = casesWithUsers.filter(c => c.status === 'resolved' || c.status === 'closed').length;

      setStats(prev => ({
        ...prev,
        totalCases: casesWithUsers.length,
        activeCases: active,
        resolvedCases: resolved,
      }));
    } catch (error) {
      console.error('Error loading cases:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (!isAdmin) {
      navigate('/dashboard');
      return;
    }
    loadCases();
    loadUsers();
  }, [isAdmin, navigate]);

  const handleTabChange = (_: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const handleRefresh = () => {
    loadCases();
    loadUsers();
  };

  const handleDeleteUser = async (userId: string) => {
    if (window.confirm('Are you sure? This will permanently delete this user profile from the database.')) {
      try {
        const { error } = await supabase
          .from('users')
          .delete()
          .eq('id', userId);
  
        if (error) throw error;
  
        // Update UI immediately after successful DB deletion
        setUsersList(prev => prev.filter(u => u.id !== userId));
        setStats(prev => ({ ...prev, totalUsers: prev.totalUsers - 1 }));
        
        alert('User deleted successfully from database.');
      } catch (error: any) {
        console.error('Error deleting user:', error.message);
        alert('Failed to delete user: ' + error.message);
      }
    }
  };
  const handleToggleBan = async (userId: string, currentStatus: boolean) => {
    const action = currentStatus ? 'unban' : 'ban';
    
    if (window.confirm(`Are you sure you want to ${action} this user?`)) {
      try {
        const { error } = await supabase
          .from('users')
          .update({ is_banned: !currentStatus } as any)
          .eq('id', userId);
  
        if (error) throw error;
  
        // Refresh the list from the database to ensure UI matches DB state
        await loadUsers();
        
        alert(`User has been ${currentStatus ? 'unbanned' : 'banned'} in the database.`);
      } catch (error: any) {
        console.error('Error toggling ban:', error.message);
        alert('Failed to update ban status. Did you add the is_banned column in Supabase?');
      }
    }
  };
  // Logic for Cases
  const handleViewCase = (id: string) => navigate(`/case/${id}`);
  const handleEditCase = (id: string) => navigate(`/edit-case/${id}`);
  const handleDeleteCase = async (id: string) => {
    if (window.confirm('Delete this case permanently?')) {
      const { error } = await supabase.from('cases').delete().eq('id', id);
      if (!error) loadCases();
    }
  };

  const handleStatusChange = async (id: string, newStatus: string) => {
    const { error } = await supabase.from('cases').update({ status: newStatus }).eq('id', id);
    if (!error) loadCases();
  };

  if (!isAdmin) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4 }}><Alert severity="error">Access denied.</Alert></Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 8 }}>
      {/* Header */}
      <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <Box>
          <Typography variant="h4" fontWeight={700}>Admin Dashboard</Typography>
          <Typography variant="body1" color="text.secondary">COMSATS Lost & Found Management</Typography>
        </Box>
        <Button variant="outlined" startIcon={<Refresh />} onClick={handleRefresh} disabled={isLoading}>
          Refresh
        </Button>
      </Box>

      {/* Stats */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <StatsCard title="Total Users" value={stats.totalUsers} icon={<People />} color="primary" description="Registered members" />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatsCard title="Total Cases" value={stats.totalCases} icon={<ListAlt />} color="secondary" description={`${stats.activeCases} currently active`} />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatsCard title="New Today" value={stats.newCasesToday} icon={<Notifications />} color="warning" description="Reported last 24h" />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatsCard title="Satisfaction" value={`${stats.userSatisfaction}%`} icon={<Analytics />} color="success" progress={stats.userSatisfaction} />
        </Grid>
      </Grid>

      <Paper sx={{ width: '100%', borderRadius: 2 }}>
        <Tabs value={tabValue} onChange={handleTabChange} sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tab icon={<DashboardIcon />} label="Overview" />
          <Tab icon={<ListAlt />} label="Cases" />
          <Tab icon={<People />} label="Users" />
          <Tab icon={<Settings />} label="Settings" />
        </Tabs>

        {/* Tab 0: Overview */}
        <TabPanel value={tabValue} index={0}>
          <Grid container spacing={3}>
            <Grid item xs={12} md={7}>
              <Paper variant="outlined" sx={{ p: 3 }}>
                <Typography variant="h6" gutterBottom>System Status</Typography>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography>Database Connection</Typography>
                    <Chip label="Healthy" color="success" size="small" />
                  </Box>
                  <Divider />
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography>Storage Bucket</Typography>
                    <Chip label="Online" color="success" size="small" />
                  </Box>
                </Box>
              </Paper>
            </Grid>
            <Grid item xs={12} md={5}>
              <Paper variant="outlined" sx={{ p: 3 }}>
                <Typography variant="h6" gutterBottom>Quick Navigation</Typography>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                  <Button variant="contained" onClick={() => setTabValue(1)}>Manage All Cases</Button>
                  <Button variant="outlined" onClick={() => setTabValue(2)}>Manage User Directory</Button>
                </Box>
              </Paper>
            </Grid>
          </Grid>
        </TabPanel>

        {/* Tab 1: Cases */}
        <TabPanel value={tabValue} index={1}>
          {isLoading ? (
            <Box sx={{ textAlign: 'center', py: 5 }}><CircularProgress /></Box>
          ) : (
            <AdminCaseList 
              cases={cases} 
              onView={handleViewCase} 
              onEdit={handleEditCase} 
              onDelete={handleDeleteCase} 
              onStatusChange={handleStatusChange} 
            />
          )}
        </TabPanel>

        {/* Tab 2: Users (RECTIFIED) */}
<TabPanel value={tabValue} index={2}>
  {isUsersLoading ? (
    <Box sx={{ textAlign: 'center', py: 5 }}><CircularProgress /></Box>
  ) : (
    <TableContainer component={Paper} variant="outlined">
      <Table>
        <TableHead sx={{ bgcolor: 'action.hover' }}>
          <TableRow>
            <TableCell><strong>User</strong></TableCell>
            <TableCell><strong>Status</strong></TableCell>
            <TableCell><strong>User ID</strong></TableCell>
            <TableCell align="right"><strong>Actions</strong></TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {/* We are mapping through usersList here */}
          {usersList.map((user: any) => (
            <TableRow key={user.id}>
              <TableCell>
                <Typography variant="body2" fontWeight={600}>{user.name}</Typography>
                <Typography variant="caption" color="text.secondary">{user.email}</Typography>
              </TableCell>
              <TableCell>
                <Chip 
                  label={user.is_banned ? "Banned" : "Active"} 
                  size="small" 
                  color={user.is_banned ? "error" : "success"} 
                />
              </TableCell>
              <TableCell sx={{ fontFamily: 'monospace', fontSize: '0.65rem' }}>
                {user.id.substring(0, 8)}...
              </TableCell>
              <TableCell align="right">
                {/* BAN BUTTON */}
                <Tooltip title={user.is_banned ? "Unban User" : "Ban User"}>
                  <IconButton 
                    size="small" 
                    color={user.is_banned ? "success" : "warning"}
                    onClick={() => handleToggleBan(user.id, user.is_banned)}
                  >
                    <Security fontSize="small" />
                  </IconButton>
                </Tooltip>
                
                {/* DELETE BUTTON */}
                <Tooltip title="Delete User Profile">
                  <IconButton 
                    size="small" 
                    color="error" 
                    onClick={() => handleDeleteUser(user.id)}
                  >
                    <Delete fontSize="small" />
                  </IconButton>
                </Tooltip>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  )}
</TabPanel>

        {/* Tab 3: Settings (RECTIFIED) */}
        <TabPanel value={tabValue} index={3}>
          <Box sx={{ p: 1 }}>
            <Typography variant="h6" gutterBottom>System Configuration</Typography>
            <Paper variant="outlined" sx={{ p: 3, mb: 3 }}>
              <Typography variant="subtitle1" fontWeight={600}>General Settings</Typography>
              <Box sx={{ mt: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
                <FormControlLabel control={<Switch defaultChecked />} label="Enable Public Case Reporting" />
                <FormControlLabel control={<Switch defaultChecked />} label="Email Notifications for Admins" />
                <FormControlLabel control={<Switch />} label="Maintenance Mode" />
              </Box>
            </Paper>
            <Paper variant="outlined" sx={{ p: 3, borderColor: 'error.light' }}>
              <Typography variant="subtitle1" color="error" fontWeight={600}>Danger Zone</Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                These actions are irreversible. Please proceed with caution.
              </Typography>
              <Button variant="outlined" color="error">Clear Resolved Cases Logs</Button>
            </Paper>
          </Box>
        </TabPanel>
      </Paper>
    </Container>
  );
};

export default AdminDashboard;
