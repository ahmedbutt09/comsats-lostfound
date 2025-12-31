import React, { useEffect, useState } from 'react';
import {
  AppBar,
  Toolbar,
  Container,
  Typography,
  Box,
  Button,
  IconButton,
  Avatar,
  Menu,
  MenuItem,
  Divider,
  useMediaQuery,
  Badge,
  Collapse, // Added for smoother mobile menu
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import {
  Menu as MenuIcon,
  Close as CloseIcon, // Added for mobile toggle
  Notifications,
  Person,
  ExitToApp,
  Dashboard,
  FindInPage,
  Home,
  Chat as ChatIcon
} from '@mui/icons-material';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabaseClient';

// Helper function
const getUnreadCount = async (userId: string): Promise<number> => {
  try {
    const { error, count } = await supabase
      .from('messages')
      .select('id', { count: 'exact', head: true })
      .eq('receiver_id', userId)
      .eq('is_read', false);

    if (error) throw error;
    return count || 0;
  } catch (error) {
    console.error('Error getting unread count:', error);
    return 0;
  }
};

const COMSATSHeader: React.FC = () => {
  // Separate state for User Menu vs Mobile Navigation
  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);
  
  const { currentUser, userData, logout, isAdmin } = useAuth();
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [unreadCount, setUnreadCount] = useState(0);

  // Handlers for User Profile Menu
  const handleProfileMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleProfileMenuClose = () => {
    setAnchorEl(null);
  };

  // Handlers for Mobile Nav Toggle
  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };

  const loadUnreadCount = async () => {
    if (!currentUser?.id) return;
    const count = await getUnreadCount(currentUser.id);
    setUnreadCount(count);
  };

  useEffect(() => {
    if (!currentUser?.id) {
      setUnreadCount(0);
      return;
    }
    loadUnreadCount();
    
    const channel = supabase
      .channel('header_messages')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
        filter: `receiver_id=eq.${currentUser.id}`,
      }, () => loadUnreadCount())
      .subscribe();

    const interval = setInterval(loadUnreadCount, 30000);
    return () => {
      supabase.removeChannel(channel);
      clearInterval(interval);
    };
  }, [currentUser?.id]);

  const handleLogout = async () => {
    handleProfileMenuClose();
    try {
      await logout();
      navigate('/');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  return (
    <AppBar position="sticky" sx={{ backgroundColor: '#1a237e', backgroundImage: 'linear-gradient(135deg, #1a237e 0%, #283593 100%)' }}>
      <Container maxWidth="xl">
        <Toolbar disableGutters sx={{ py: 1 }}>
          
          {/* Logo Section */}
          <Box sx={{ display: 'flex', alignItems: 'center', mr: 4 }}>
            <FindInPage sx={{ mr: 1, fontSize: 32, color: '#ff6f00' }} />
            <Typography variant="h6" noWrap component={RouterLink} to="/" sx={{ fontWeight: 700, color: 'white', textDecoration: 'none', lineHeight: 1.2 }}>
              CUI ABBOTTABAD
              <Typography component="span" sx={{ display: 'block', fontSize: '0.875rem', fontWeight: 400, color: 'rgba(255,255,255,0.9)' }}>
                Lost & Found App
              </Typography>
            </Typography>
          </Box>

          {/* Desktop Nav */}
          {!isMobile && (
            <Box sx={{ display: 'flex', gap: 1, flexGrow: 1 }}>
              <Button component={RouterLink} to="/" startIcon={<Home />} sx={{ color: 'white' }}>Home</Button>
              <Button component={RouterLink} to="/lost" startIcon={<FindInPage />} sx={{ color: 'white' }}>Lost Items</Button>
              <Button component={RouterLink} to="/found" startIcon={<FindInPage />} sx={{ color: 'white' }}>Found Items</Button>
              <Button component={RouterLink} to="/report" startIcon={<FindInPage />} sx={{ color: 'white' }}>Report Case</Button>
              {currentUser && isAdmin && (
                <Button color="inherit" component={RouterLink} to="/admin" startIcon={<Dashboard />} sx={{ color: 'white', ml: 1 }}>Admin</Button>
              )}
            </Box>
          )}

          {/* Right Side Tools */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: { xs: 1, md: 2 } }}>
            {currentUser && (
              <IconButton color="inherit" component={RouterLink} to="/chat">
                <Badge badgeContent={unreadCount} color="error"><ChatIcon /></Badge>
              </IconButton>
            )}

            {currentUser ? (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Avatar
                  sx={{ width: 36, height: 36, bgcolor: '#ff6f00', cursor: 'pointer' }}
                  onClick={handleProfileMenuOpen}
                >
                  {userData?.name?.[0] || currentUser?.email?.[0]?.toUpperCase()}
                </Avatar>
                {!isMobile && (
                  <Typography variant="body2" sx={{ color: 'white' }}>
                    {userData?.name || currentUser?.email?.split('@')[0]}
                  </Typography>
                )}
              </Box>
            ) : (
              <Box sx={{ display: 'flex', gap: 1 }}>
                <Button component={RouterLink} to="/login" variant="outlined" sx={{ color: 'white', borderColor: 'rgba(255,255,255,0.3)' }}>Login</Button>
                {!isMobile && <Button component={RouterLink} to="/register" variant="contained" sx={{ bgcolor: '#ff6f00' }}>Register</Button>}
              </Box>
            )}

            {isMobile && (
              <IconButton color="inherit" onClick={toggleMobileMenu}>
                {mobileMenuOpen ? <CloseIcon /> : <MenuIcon />}
              </IconButton>
            )}
          </Box>

          {/* User Profile Dropdown Menu */}
          <Menu
            id="user-menu"
            anchorEl={anchorEl}
            open={Boolean(anchorEl)}
            onClose={handleProfileMenuClose}
            disableScrollLock // Prevents layout shift on open
            PaperProps={{ sx: { mt: 1.5, minWidth: 200, boxShadow: theme.shadows[3] } }}
            anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
            transformOrigin={{ vertical: 'top', horizontal: 'right' }}
          >
            <MenuItem disabled sx={{ opacity: "1 !important" }}>
              <Box>
                <Typography variant="subtitle2" noWrap>{userData?.name || 'User'}</Typography>
                <Typography variant="caption" color="text.secondary" noWrap>{currentUser?.email}</Typography>
              </Box>
            </MenuItem>
            <Divider />
            <MenuItem component={RouterLink} to="/dashboard" onClick={handleProfileMenuClose}><Dashboard sx={{ mr: 1.5 }} fontSize="small" /> Dashboard</MenuItem>
            <MenuItem component={RouterLink} to="/profile" onClick={handleProfileMenuClose}><Person sx={{ mr: 1.5 }} fontSize="small" /> My Profile</MenuItem>
            <MenuItem component={RouterLink} to="/my-cases" onClick={handleProfileMenuClose}><FindInPage sx={{ mr: 1.5 }} fontSize="small" /> My Cases</MenuItem>
            <Divider />
            <MenuItem onClick={handleLogout} sx={{ color: 'error.main' }}><ExitToApp sx={{ mr: 1.5 }} fontSize="small" /> Logout</MenuItem>
          </Menu>
        </Toolbar>
      </Container>

      {/* Mobile Navigation Panel */}
      <Collapse in={mobileMenuOpen}>
        <Box sx={{ bgcolor: 'background.paper', borderTop: '1px solid rgba(0,0,0,0.1)', py: 1 }}>
          <Container>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
              <Button component={RouterLink} to="/" startIcon={<Home />} onClick={() => setMobileMenuOpen(false)} sx={{ justifyContent: 'flex-start' }}>Home</Button>
              <Button component={RouterLink} to="/lost" startIcon={<FindInPage />} onClick={() => setMobileMenuOpen(false)} sx={{ justifyContent: 'flex-start' }}>Lost Items</Button>
              <Button component={RouterLink} to="/found" startIcon={<FindInPage />} onClick={() => setMobileMenuOpen(false)} sx={{ justifyContent: 'flex-start' }}>Found Items</Button>
              <Button component={RouterLink} to="/report" startIcon={<FindInPage />} onClick={() => setMobileMenuOpen(false)} sx={{ justifyContent: 'flex-start' }}>Report Case</Button>
              {isAdmin && <Button component={RouterLink} to="/admin" startIcon={<Dashboard />} onClick={() => setMobileMenuOpen(false)} sx={{ justifyContent: 'flex-start' }}>Admin Dashboard</Button>}
              {!currentUser && <Button component={RouterLink} to="/register" variant="contained" sx={{ mt: 1, bgcolor: '#ff6f00' }} onClick={() => setMobileMenuOpen(false)}>Register Now</Button>}
            </Box>
          </Container>
        </Box>
      </Collapse>

      {/* Footer Strip */}
      <Box sx={{ bgcolor: 'rgba(255,255,255,0.05)', py: 0.5 }}>
        <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.6)', display: 'block', textAlign: 'center' }}>
          Official Lost & Found Platform for CUI Abbottabad
        </Typography>
      </Box>
    </AppBar>
  );
};

export default COMSATSHeader;