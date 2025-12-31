import React, { useState, useEffect } from 'react';
import {
  Container,
  Paper,
  Typography,
  Box,
  Grid,
  Card,
  CardContent,
  CardActions,
  Button,
  Chip,
  Tabs,
  Tab,
  TextField,
  InputAdornment,
  Menu,
  MenuItem,
  IconButton,
  CircularProgress,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  DialogContentText,
} from '@mui/material';
import {
  Search,
  FilterList,
  MoreVert,
  Edit,
  Delete,
  Visibility,
  CheckCircle,
  Pending,
  Close,
  Warning,
} from '@mui/icons-material';
import { Link as RouterLink } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';
import { supabase } from '../lib/supabaseClient';
import { Case, User } from '../types';

interface CaseWithUser extends Case {
  user_name?: string;
}

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
      id={`cases-tabpanel-${index}`}
      aria-labelledby={`cases-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ py: 3 }}>{children}</Box>}
    </div>
  );
}

// Updated status colors and icons for Supabase compatibility
const statusColors: Record<string, 'default' | 'primary' | 'secondary' | 'error' | 'info' | 'success' | 'warning'> = {
  active: 'warning',
  claimed: 'info',
  resolved: 'success',
  closed: 'default',
};

const statusIcons: Record<string, React.ReactElement> = {
  active: <Pending fontSize="small" />,
  claimed: <Warning fontSize="small" />,
  resolved: <CheckCircle fontSize="small" />,
  closed: <Close fontSize="small" />,
};

const MyCases: React.FC = () => {
  const [tabValue, setTabValue] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedCaseId, setSelectedCaseId] = useState<string | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [caseToDelete, setCaseToDelete] = useState<string | null>(null);
  const [cases, setCases] = useState<CaseWithUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  const { currentUser } = useAuth();

  // Fetch user's cases
  const fetchUserCases = async () => {
    if (!currentUser?.id) return;
    
    try {
      setLoading(true);
      setError(null);
      
      const { data: casesData, error: casesError } = await supabase
        .from('cases')
        .select('*')
        .eq('user_id', currentUser.id)
        .order('created_at', { ascending: false });
      
      if (casesError) throw casesError;
      
      // Fetch user names for each case
      const casesWithUsers: CaseWithUser[] = (casesData || []).map(caseItem => {
        return {
          ...caseItem,
          user_name: currentUser.user_metadata?.name || currentUser.email?.split('@')[0] || 'User'
        };
      });
      
      setCases(casesWithUsers);
    } catch (err: any) {
      console.error('Error fetching user cases:', err);
      setError('Failed to load your cases');
    } finally {
      setLoading(false);
    }
  };

  // Delete case
  const deleteCase = async (caseId: string) => {
    try {
      setDeleting(true);
      
      const { error } = await supabase
        .from('cases')
        .delete()
        .eq('id', caseId)
        .eq('user_id', currentUser?.id); // Ensure user can only delete their own cases
      
      if (error) throw error;
      
      toast.success('Case deleted successfully');
      // Refresh the cases list
      fetchUserCases();
    } catch (err: any) {
      console.error('Error deleting case:', err);
      toast.error('Failed to delete case');
    } finally {
      setDeleting(false);
    }
  };

  useEffect(() => {
    fetchUserCases();
  }, [currentUser]);

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>, caseId: string) => {
    setAnchorEl(event.currentTarget);
    setSelectedCaseId(caseId);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedCaseId(null);
  };

  const handleDeleteClick = (caseId: string) => {
    setCaseToDelete(caseId);
    setDeleteDialogOpen(true);
    handleMenuClose();
  };

  const handleDeleteConfirm = async () => {
    if (caseToDelete && currentUser) {
      await deleteCase(caseToDelete);
      setDeleteDialogOpen(false);
      setCaseToDelete(null);
    }
  };

  const handleDeleteCancel = () => {
    setDeleteDialogOpen(false);
    setCaseToDelete(null);
  };

  const filteredCases = React.useMemo(() => {
    if (!cases) return [];
    
    let filtered = cases;
    
    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(caseItem =>
        caseItem.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        caseItem.description.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    // Filter by tab status
    const statusMap = ['active', 'claimed', 'resolved', 'closed'];
    if (tabValue < statusMap.length) {
      filtered = filtered.filter(caseItem => caseItem.status === statusMap[tabValue]);
    }
    
    return filtered;
  }, [cases, searchTerm, tabValue]);

  const stats = React.useMemo(() => {
    if (!cases) return { total: 0, active: 0, claimed: 0, resolved: 0, closed: 0 };
    
    return {
      total: cases.length,
      active: cases.filter(c => c.status === 'active').length,
      claimed: cases.filter(c => c.status === 'claimed').length,
      resolved: cases.filter(c => c.status === 'resolved').length,
      closed: cases.filter(c => c.status === 'closed').length,
    };
  }, [cases]);

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4, mb: 8, textAlign: 'center' }}>
        <CircularProgress />
        <Typography variant="body1" sx={{ mt: 2 }}>
          Loading your cases...
        </Typography>
      </Container>
    );
  }

  if (error) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4, mb: 8 }}>
        <Alert severity="error">
          Error loading your cases. Please try again later.
        </Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 8 }}>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" gutterBottom fontWeight="bold">
          My Cases
        </Typography>
        <Typography variant="body1" color="text.secondary" paragraph>
          Manage all your lost and found item reports in one place.
        </Typography>
      </Box>

      {/* Stats Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={6} sm={4} md={2.4}>
          <Paper sx={{ p: 2, textAlign: 'center' }}>
            <Typography variant="h4" color="primary">{stats.total}</Typography>
            <Typography variant="body2">Total Cases</Typography>
          </Paper>
        </Grid>
        <Grid item xs={6} sm={4} md={2.4}>
          <Paper sx={{ p: 2, textAlign: 'center', borderLeft: '4px solid #ed6c02' }}>
            <Typography variant="h4" color="warning.main">{stats.active}</Typography>
            <Typography variant="body2">Active</Typography>
          </Paper>
        </Grid>
        <Grid item xs={6} sm={4} md={2.4}>
          <Paper sx={{ p: 2, textAlign: 'center', borderLeft: '4px solid #0288d1' }}>
            <Typography variant="h4" color="info.main">{stats.claimed}</Typography>
            <Typography variant="body2">Claimed</Typography>
          </Paper>
        </Grid>
        <Grid item xs={6} sm={4} md={2.4}>
          <Paper sx={{ p: 2, textAlign: 'center', borderLeft: '4px solid #2e7d32' }}>
            <Typography variant="h4" color="success.main">{stats.resolved}</Typography>
            <Typography variant="body2">Resolved</Typography>
          </Paper>
        </Grid>
        <Grid item xs={6} sm={4} md={2.4}>
          <Paper sx={{ p: 2, textAlign: 'center', borderLeft: '4px solid #757575' }}>
            <Typography variant="h4" color="text.secondary">{stats.closed}</Typography>
            <Typography variant="body2">Closed</Typography>
          </Paper>
        </Grid>
      </Grid>

      {/* Search and Actions */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={8}>
            <TextField
              fullWidth
              placeholder="Search your cases..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Search />
                  </InputAdornment>
                ),
                endAdornment: searchTerm && (
                  <InputAdornment position="end">
                    <IconButton size="small" onClick={() => setSearchTerm('')}>
                      <Close />
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />
          </Grid>
          <Grid item xs={6} md={2}>
            <Button
              fullWidth
              variant="outlined"
              startIcon={<FilterList />}
              onClick={fetchUserCases}
            >
              Refresh
            </Button>
          </Grid>
          <Grid item xs={6} md={2}>
            <Button
              fullWidth
              variant="contained"
              component={RouterLink}
              to="/report"
            >
              New Case
            </Button>
          </Grid>
        </Grid>
      </Paper>

      {/* Tabs */}
      <Paper sx={{ width: '100%' }}>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs value={tabValue} onChange={handleTabChange} aria-label="case status tabs">
            <Tab label={`All Cases (${stats.total})`} />
            <Tab label={`Active (${stats.active})`} />
            <Tab label={`Claimed (${stats.claimed})`} />
            <Tab label={`Resolved (${stats.resolved})`} />
            <Tab label={`Closed (${stats.closed})`} />
          </Tabs>
        </Box>

        <TabPanel value={tabValue} index={0}>
          {filteredCases.length === 0 ? (
            <Box sx={{ textAlign: 'center', py: 6 }}>
              <Search sx={{ fontSize: 60, color: 'text.disabled', mb: 2 }} />
              <Typography variant="h6" gutterBottom>
                No cases found
              </Typography>
              <Typography variant="body1" color="text.secondary" paragraph>
                {searchTerm 
                  ? 'No cases match your search criteria' 
                  : 'You haven\'t reported any cases yet'}
              </Typography>
              <Button
                variant="contained"
                component={RouterLink}
                to="/report"
              >
                Report Your First Case
              </Button>
            </Box>
          ) : (
            <Grid container spacing={3}>
              {filteredCases.map((caseItem) => (
                <Grid item xs={12} key={caseItem.id}>
                  <Card>
                    <CardContent>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <Box sx={{ flex: 1 }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
                            <Typography variant="h6" component="h3">
                              {caseItem.title}
                            </Typography>
                            <Chip
                              label={caseItem.type.toUpperCase()}
                              color={caseItem.type === 'lost' ? 'error' : 'success'}
                              size="small"
                              variant="outlined"
                            />
                          </Box>
                          
                          <Typography variant="body2" color="text.secondary" paragraph sx={{ mb: 2 }}>
                            {caseItem.description.length > 150 
                              ? `${caseItem.description.substring(0, 150)}...` 
                              : caseItem.description}
                          </Typography>
                          
                          <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                            <Chip
                              icon={statusIcons[caseItem.status || 'active'] || undefined}
                              label={(caseItem.status || 'active').toUpperCase()}
                              color={statusColors[caseItem.status || 'active'] || 'default'}
                              size="small"
                            />
                            <Chip
                              label={caseItem.category || 'Uncategorized'}
                              size="small"
                              variant="outlined"
                            />
                            <Typography variant="caption" color="text.secondary">
                              {new Date(caseItem.created_at || new Date()).toLocaleDateString()}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {caseItem.location}
                            </Typography>
                          </Box>
                        </Box>
                        
                        <IconButton onClick={(e) => handleMenuOpen(e, caseItem.id)}>
                          <MoreVert />
                        </IconButton>
                      </Box>
                    </CardContent>
                    <CardActions sx={{ justifyContent: 'flex-end', p: 2, pt: 0 }}>
                      <Button
                        size="small"
                        startIcon={<Visibility />}
                        component={RouterLink}
                        to={`/case/${caseItem.id}`}
                      >
                        View Details
                      </Button>
                      <Button
                        size="small"
                        startIcon={<Edit />}
                        component={RouterLink}
                        to={`/edit-case/${caseItem.id}`}
                      >
                        Edit
                      </Button>
                    </CardActions>
                  </Card>
                </Grid>
              ))}
            </Grid>
          )}
        </TabPanel>

        {[1, 2, 3, 4].map((index) => (
          <TabPanel key={index} value={tabValue} index={index}>
            {filteredCases.length === 0 ? (
              <Box sx={{ textAlign: 'center', py: 6 }}>
                <CheckCircle sx={{ fontSize: 60, color: 'text.disabled', mb: 2 }} />
                <Typography variant="h6" gutterBottom>
                  No cases in this status
                </Typography>
                <Typography variant="body1" color="text.secondary">
                  You don't have any cases with this status
                </Typography>
              </Box>
            ) : (
              <Grid container spacing={3}>
                {filteredCases.map((caseItem) => (
                  <Grid item xs={12} key={caseItem.id}>
                    <Card>
                      <CardContent>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                          <Box sx={{ flex: 1 }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
                              <Typography variant="h6" component="h3">
                                {caseItem.title}
                              </Typography>
                              <Chip
                                label={caseItem.type.toUpperCase()}
                                color={caseItem.type === 'lost' ? 'error' : 'success'}
                                size="small"
                                variant="outlined"
                              />
                            </Box>
                            
                            <Typography variant="body2" color="text.secondary" paragraph sx={{ mb: 2 }}>
                              {caseItem.description.length > 150 
                                ? `${caseItem.description.substring(0, 150)}...` 
                                : caseItem.description}
                            </Typography>
                            
                            <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                              <Chip
                                icon={statusIcons[caseItem.status || 'active'] || undefined}
                                label={(caseItem.status || 'active').toUpperCase()}
                                color={statusColors[caseItem.status || 'active'] || 'default'}
                                size="small"
                              />
                              <Chip
                                label={caseItem.category || 'Uncategorized'}
                                size="small"
                                variant="outlined"
                              />
                              <Typography variant="caption" color="text.secondary">
                                {new Date(caseItem.created_at || new Date()).toLocaleDateString()}
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                                {caseItem.location}
                              </Typography>
                            </Box>
                          </Box>
                          
                          <IconButton onClick={(e) => handleMenuOpen(e, caseItem.id)}>
                            <MoreVert />
                          </IconButton>
                        </Box>
                      </CardContent>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            )}
          </TabPanel>
        ))}
      </Paper>

      {/* Context Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
      >
        <MenuItem component={RouterLink} to={`/case/${selectedCaseId}`} onClick={handleMenuClose}>
          <Visibility fontSize="small" sx={{ mr: 1 }} />
          View Details
        </MenuItem>
        <MenuItem component={RouterLink} to={`/edit-case/${selectedCaseId}`} onClick={handleMenuClose}>
          <Edit fontSize="small" sx={{ mr: 1 }} />
          Edit Case
        </MenuItem>
        <MenuItem onClick={() => selectedCaseId && handleDeleteClick(selectedCaseId)}>
          <Delete fontSize="small" sx={{ mr: 1 }} />
          Delete Case
        </MenuItem>
      </Menu>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteDialogOpen}
        onClose={handleDeleteCancel}
        aria-labelledby="alert-dialog-title"
        aria-describedby="alert-dialog-description"
      >
        <DialogTitle id="alert-dialog-title">
          Delete Case?
        </DialogTitle>
        <DialogContent>
          <DialogContentText id="alert-dialog-description">
            Are you sure you want to delete this case? This action cannot be undone.
            All associated data including images and chat messages will be permanently removed.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleDeleteCancel} disabled={deleting}>
            Cancel
          </Button>
          <Button 
            onClick={handleDeleteConfirm} 
            color="error" 
            autoFocus
            disabled={deleting}
            startIcon={deleting && <CircularProgress size={20} />}
          >
            {deleting ? 'Deleting...' : 'Delete'}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default MyCases;
