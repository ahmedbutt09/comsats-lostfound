import React, { useState } from 'react';
import { Link as RouterLink, useNavigate, useLocation } from 'react-router-dom'; // Added useLocation
import {
  AppBar,
  Box,
  Toolbar,
  IconButton,
  Typography,
  Menu,
  Container,
  Avatar,
  Button,
  Tooltip,
  MenuItem,
  Drawer,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Divider,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import {
  Menu as MenuIcon,
  Home,
  AddCircle,
  Search,
  Dashboard,
  Person,
  Login,
  Logout,
  AppRegistration,
  FindInPage,
  ArrowBack, // Added ArrowBack icon
} from '@mui/icons-material';
import { useAuth } from '../../contexts/AuthContext';

const Navbar: React.FC = () => {
  const [anchorElUser, setAnchorElUser] = useState<null | HTMLElement>(null);
  const [mobileOpen, setMobileOpen] = useState(false);
  const { currentUser, userData, logout } = useAuth();
  
  const navigate = useNavigate();
  const location = useLocation(); // Used to check current path
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  // Logic: Only show back button if NOT on the home/landing page
  const canGoBack = location.pathname !== '/';

  const handleOpenUserMenu = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorElUser(event.currentTarget);
  };

  const handleCloseUserMenu = () => {
    setAnchorElUser(null);
  };

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const handleLogout = async () => {
    try {
      await logout();
      handleCloseUserMenu();
      navigate('/');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const navItems = [
    { label: 'Home', path: '/', icon: <Home /> },
    { label: 'Lost Items', path: '/lost', icon: <FindInPage /> },
    { label: 'Found Items', path: '/found', icon: <Search /> },
    { label: 'Report Case', path: '/report', icon: <AddCircle /> },
  ];

  const userMenuItems = [
    { label: 'Dashboard', path: '/dashboard', icon: <Dashboard /> },
    { label: 'Profile', path: '/profile', icon: <Person /> },
    { label: 'My Cases', path: '/my-cases', icon: <FindInPage /> },
  ];

  const drawer = (
    <Box sx={{ width: 250 }} role="presentation">
      <Box sx={{ p: 2, textAlign: 'center' }}>
        <FindInPage sx={{ fontSize: 40, color: 'primary.main', mb: 1 }} />
        <Typography variant="h6" color="primary">
          COMSATS Lost & Found
        </Typography>
      </Box>
      <Divider />
      {/* ... drawer content remains the same ... */}
      <List>
        {navItems.map((item) => (
          <ListItem
            key={item.label}
            component={RouterLink}
            to={item.path}
            onClick={handleDrawerToggle}
            sx={{ color: 'text.primary' }}
          >
            <ListItemIcon>{item.icon}</ListItemIcon>
            <ListItemText primary={item.label} />
          </ListItem>
        ))}
      </List>
      <Divider />
      {currentUser ? (
        <>
          <List>
            {userMenuItems.map((item) => (
              <ListItem
                key={item.label}
                component={RouterLink}
                to={item.path}
                onClick={handleDrawerToggle}
                sx={{ color: 'text.primary' }}
              >
                <ListItemIcon>{item.icon}</ListItemIcon>
                <ListItemText primary={item.label} />
              </ListItem>
            ))}
            <ListItem button onClick={handleLogout}>
              <ListItemIcon>
                <Logout />
              </ListItemIcon>
              <ListItemText primary="Logout" />
            </ListItem>
          </List>
        </>
      ) : (
        <List>
          <ListItem
            component={RouterLink}
            to="/login"
            onClick={handleDrawerToggle}
            sx={{ color: 'text.primary' }}
          >
            <ListItemIcon>
              <Login />
            </ListItemIcon>
            <ListItemText primary="Login" />
          </ListItem>
          <ListItem
            component={RouterLink}
            to="/register"
            onClick={handleDrawerToggle}
            sx={{ color: 'text.primary' }}
          >
            <ListItemIcon>
              <AppRegistration />
            </ListItemIcon>
            <ListItemText primary="Register" />
          </ListItem>
        </List>
      )}
    </Box>
  );

  return (
    <>
      <AppBar position="static">
        <Container maxWidth="xl">
        <Toolbar disableGutters>
  {/* BACK BUTTON - Placed at the very start */}
  {canGoBack && (
    <IconButton
      color="inherit"
      onClick={() => navigate(-1)}
      sx={{ mr: 1 }}
    >
      <ArrowBack />
    </IconButton>
  )}

  {/* MOBILE MENU BUTTON (Hamburger) */}
  <IconButton
    color="inherit"
    aria-label="open drawer"
    edge="start"
    onClick={handleDrawerToggle}
    sx={{ 
      mr: 2, 
      display: { md: 'none' } 
    }}
  >
    <MenuIcon />
  </IconButton>

  {/* LOGO SECTION */}
  <FindInPage sx={{ display: { xs: 'none', md: 'flex' }, mr: 1 }} />
  <Typography
    variant="h6"
    noWrap
    component={RouterLink}
    to="/"
    sx={{
      flexGrow: { xs: 1, md: 0 }, // This allows it to center/fill space on mobile
      fontFamily: 'monospace',
      fontWeight: 700,
      color: 'inherit',
      textDecoration: 'none',
      display: 'flex'
    }}
  >
    COMSATS L&F
  </Typography>

            {/* Mobile Logo version (visible on small screens) */}
            <Typography
              variant="h6"
              noWrap
              component={RouterLink}
              to="/"
              sx={{
                display: { xs: 'flex', md: 'none' },
                flexGrow: 1,
                fontFamily: 'monospace',
                fontWeight: 700,
                color: 'inherit',
                textDecoration: 'none',
              }}
            >
              COMSATS L&F
            </Typography>

            {/* Desktop Navigation */}
            <Box sx={{ flexGrow: 1, display: { xs: 'none', md: 'flex' } }}>
              {navItems.map((item) => (
                <Button
                  key={item.label}
                  component={RouterLink}
                  to={item.path}
                  sx={{ my: 2, color: 'white', display: 'block' }}
                  startIcon={item.icon}
                >
                  {item.label}
                </Button>
              ))}
            </Box>

            {/* User Menu logic... */}
            <Box sx={{ flexGrow: 0 }}>
              {currentUser ? (
                <>
                  <Tooltip title="Open settings">
                    <IconButton onClick={handleOpenUserMenu} sx={{ p: 0 }}>
                      <Avatar
                        alt={userData?.name || 'User'}
                        src={userData?.avatar_url}
                        sx={{ bgcolor: 'secondary.main' }}
                      >
                        {userData?.name?.charAt(0) || currentUser?.email?.charAt(0).toUpperCase() || 'U'}
                      </Avatar>
                    </IconButton>
                  </Tooltip>
                  <Menu
                    sx={{ mt: '45px' }}
                    id="menu-appbar"
                    anchorEl={anchorElUser}
                    anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
                    keepMounted
                    transformOrigin={{ vertical: 'top', horizontal: 'right' }}
                    open={Boolean(anchorElUser)}
                    onClose={handleCloseUserMenu}
                  >
                    <MenuItem disabled>
                      <Typography textAlign="center">
                        {userData?.name || currentUser?.email?.split('@')[0] || 'User'}
                      </Typography>
                    </MenuItem>
                    <Divider />
                    {userMenuItems.map((item) => (
                      <MenuItem
                        key={item.label}
                        component={RouterLink}
                        to={item.path}
                        onClick={handleCloseUserMenu}
                      >
                        <ListItemIcon>{item.icon}</ListItemIcon>
                        <Typography textAlign="center">{item.label}</Typography>
                      </MenuItem>
                    ))}
                    <Divider />
                    <MenuItem onClick={handleLogout}>
                      <ListItemIcon>
                        <Logout fontSize="small" />
                      </ListItemIcon>
                      <Typography textAlign="center">Logout</Typography>
                    </MenuItem>
                  </Menu>
                </>
              ) : (
                <Box sx={{ display: { xs: 'none', md: 'flex' }, gap: 1 }}>
                  <Button component={RouterLink} to="/login" color="inherit" startIcon={<Login />}>
                    Login
                  </Button>
                  <Button component={RouterLink} to="/register" variant="contained" color="secondary" startIcon={<AppRegistration />}>
                    Register
                  </Button>
                </Box>
              )}
            </Box>
          </Toolbar>
        </Container>
      </AppBar>

      <Drawer
        variant="temporary"
        anchor="left"
        open={mobileOpen}
        onClose={handleDrawerToggle}
        ModalProps={{ keepMounted: true }}
        sx={{
          display: { xs: 'block', md: 'none' },
          '& .MuiDrawer-paper': { boxSizing: 'border-box', width: 250 },
        }}
      >
        {drawer}
      </Drawer>
    </>
  );
};

export default Navbar;
