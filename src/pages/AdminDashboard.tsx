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
                    <TableCell><strong>User Name</strong></TableCell>
                    <TableCell><strong>Email Address</strong></TableCell>
                    <TableCell><strong>User ID</strong></TableCell>
                    <TableCell align="right"><strong>Actions</strong></TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {usersList.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell>{user.name}</TableCell>
                      <TableCell>{user.email}</TableCell>
                      <TableCell sx={{ fontFamily: 'monospace', fontSize: '0.75rem' }}>{user.id}</TableCell>
                      <TableCell align="right">
                        <Button size="small" startIcon={<Email />}>Notify</Button>
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
