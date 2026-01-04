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
  Collapse,
  Tooltip,
  Fade,
  Chip
} from '@mui/material';
import { useTheme, alpha } from '@mui/material/styles';
import {
  Menu as MenuIcon,
  Close as CloseIcon,
  Person,
  ExitToApp,
  Dashboard,
  FindInPage,
  Home,
  Chat as ChatIcon,
  AddCircle,
  Search,
  AdminPanelSettings,
  History
} from '@mui/icons-material';
import { Link as RouterLink, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabaseClient';

const COMSATSHeader: React.FC = () => {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  
  const { currentUser, userData, logout, isAdmin } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  const isActive = (path: string) => location.pathname === path;

  // Real-time unread messages logic (kept from your original)
  useEffect(() => {
    if (!currentUser?.id) return;
    const loadUnreadCount = async () => {
      const { count } = await supabase
        .from('messages')
        .select('id', { count: 'exact', head: true })
        .eq('receiver_id', currentUser.id)
        .eq('is_read', false);
      setUnreadCount(count || 0);
    };
    loadUnreadCount();
    const channel = supabase.channel('header_msgs').on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages', filter: `receiver_id=eq.${currentUser.id}` }, loadUnreadCount).subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [currentUser?.id]);

  const navLinks = [
    { label: 'Browse Lost', path: '/lost', icon: <Search fontSize="small" /> },
    { label: 'Browse Found', path: '/found', icon: <FindInPage fontSize="small" /> },
  ];

  return (
    <AppBar 
      position="sticky" 
      elevation={0}
      sx={{ 
        background: '#1a237e',
        borderBottom: '2px solid #ff6f00', // Subtle COMSATS Orange accent
      }}
    >
      <Container maxWidth="xl">
        <Toolbar disableGutters sx={{ minHeight: { xs: 70, md: 80 } }}>
          
          {/* LOGO AREA */}
          <Box sx={{ display: 'flex', alignItems: 'center', flexGrow: { xs: 1, md: 0 }, mr: 4 }}>
             <RouterLink to="/" style={{ display: 'flex', alignItems: 'center', textDecoration: 'none' }}>
                <Avatar 
                    src="/comsats-logo.png" // Assumes you have your logo in public folder
                    sx={{ width: 45, height: 45, mr: 1.5, border: '1px solid white' }}
                >
                    CUI
                </Avatar>
                <Box>
                    <Typography variant="h6" sx={{ fontWeight: 800, color: 'white', lineHeight: 1 }}>
                        CUI ABBOTTABAD
                    </Typography>
                    <Typography sx={{ fontSize: '0.75rem', color: '#ffb74d', fontWeight: 600 }}>
                        Lost & Found Portal
                    </Typography>
                </Box>
             </RouterLink>
          </Box>

          {/* DESKTOP NAV - Enhanced with Active Indicators */}
          {!isMobile && (
            <Box sx={{ display: 'flex', gap: 1, flexGrow: 1, alignItems: 'center' }}>
              <Button 
                component={RouterLink} to="/" 
                sx={{ color: isActive('/') ? '#ffb74d' : 'white', fontWeight: isActive('/') ? 700 : 400 }}
              >
                Home
              </Button>
              
              {navLinks.map((link) => (
                <Button
                  key={link.path}
                  component={RouterLink}
                  to={link.path}
                  sx={{
                    color: isActive(link.path) ? '#ffb74d' : 'white',
                    fontWeight: isActive(link.path) ? 700 : 400,
                    '&:after': isActive(link.path) ? {
                        content: '""',
                        position: 'absolute',
                        bottom: 5,
                        left: '20%',
                        width: '60%',
                        height: '2px',
                        backgroundColor: '#ffb74d'
                    } : {}
                  }}
                >
                  {link.label}
                </Button>
              ))}

              {/* ACTION BUTTON - Highlighted for visibility */}
              <Button 
                variant="contained" 
                component={RouterLink} 
                to="/report"
                startIcon={<AddCircle />}
                sx={{ 
                    ml: 2, 
                    bgcolor: '#ff6f00', 
                    borderRadius: '20px',
                    '&:hover': { bgcolor: '#e65100' } 
                }}
              >
                Report Case
              </Button>
            </Box>
          )}

          {/* RIGHT SIDE - User/Auth */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            {currentUser && (
              <IconButton color="inherit" component={RouterLink} to="/chat">
                <Badge badgeContent={unreadCount} color="error">
                  <ChatIcon />
                </Badge>
              </IconButton>
            )}

            {currentUser ? (
              <>
                <Chip
                    avatar={<Avatar src={userData?.avatar_url}>{userData?.name?.[0]}</Avatar>}
                    label={isMobile ? "" : (userData?.name || "User")}
                    onClick={(e) => setAnchorEl(e.currentTarget)}
                    sx={{ 
                        bgcolor: 'rgba(255,255,255,0.1)', 
                        color: 'white', 
                        cursor: 'pointer',
                        '& .MuiChip-label': { display: isMobile ? 'none' : 'block' }
                    }}
                />
                <Menu
                    anchorEl={anchorEl}
                    open={Boolean(anchorEl)}
                    onClose={() => setAnchorEl(null)}
                    PaperProps={{ sx: { mt: 1, width: 200 } }}
                >
                    <MenuItem component={RouterLink} to="/dashboard" onClick={() => setAnchorEl(null)}>
                        <Dashboard sx={{ mr: 1 }} fontSize="small" /> Dashboard
                    </MenuItem>
                    <MenuItem component={RouterLink} to="/my-cases" onClick={() => setAnchorEl(null)}>
                        <History sx={{ mr: 1 }} fontSize="small" /> My Cases
                    </MenuItem>
                    {isAdmin && (
                        <MenuItem component={RouterLink} to="/admin" onClick={() => setAnchorEl(null)}>
                            <AdminPanelSettings sx={{ mr: 1, color: 'orange' }} fontSize="small" /> Admin Console
                        </MenuItem>
                    )}
                    <Divider />
                    <MenuItem onClick={async () => { await logout(); navigate('/'); }}>
                        <ExitToApp sx={{ mr: 1 }} fontSize="small" /> Logout
                    </MenuItem>
                </Menu>
              </>
            ) : (
              <Box sx={{ display: 'flex', gap: 1 }}>
                <Button component={RouterLink} to="/login" sx={{ color: 'white' }}>Login</Button>
                {!isMobile && (
                    <Button component={RouterLink} to="/register" variant="outlined" sx={{ color: '#ffb74d', borderColor: '#ffb74d' }}>
                        Join Now
                    </Button>
                )}
              </Box>
            )}

            {isMobile && (
              <IconButton color="inherit" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
                {mobileMenuOpen ? <CloseIcon /> : <MenuIcon />}
              </IconButton>
            )}
          </Box>
        </Toolbar>
      </Container>

      {/* MOBILE DRAWER ENHANCEMENT */}
      <Collapse in={mobileMenuOpen}>
        <Box sx={{ bgcolor: 'white', p: 2, borderTop: '2px solid #ff6f00' }}>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                <Button component={RouterLink} to="/" onClick={() => setMobileMenuOpen(false)} sx={{ justifyContent: 'flex-start' }}>Home</Button>
                <Button component={RouterLink} to="/lost" onClick={() => setMobileMenuOpen(false)} sx={{ justifyContent: 'flex-start' }}>Browse Lost</Button>
                <Button component={RouterLink} to="/found" onClick={() => setMobileMenuOpen(false)} sx={{ justifyContent: 'flex-start' }}>Browse Found</Button>
                <Button component={RouterLink} to="/report" variant="contained" sx={{ bgcolor: '#ff6f00' }} onClick={() => setMobileMenuOpen(false)}>Report Case</Button>
                {isAdmin && <Button component={RouterLink} to="/admin" sx={{ color: 'red' }} onClick={() => setMobileMenuOpen(false)}>Admin Console</Button>}
            </Box>
        </Box>
      </Collapse>
    </AppBar>
  );
};

export default COMSATSHeader;
