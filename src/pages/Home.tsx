import React from 'react';
import {
  Container,
  Grid,
  Paper,
  Typography,
  Box,
  Button,
  Card,
  CardContent,
  CardActions,
  Chip,
  Divider,
  useTheme,
  useMediaQuery,
  Alert,
} from '@mui/material';
import {
  AddCircle,
  Search,
  CheckCircle,
  Security,
  Speed,
  Group,
  ArrowForward,
  FindInPage,
  School,
  VerifiedUser,
  AdminPanelSettings,
  Lock,
  PersonAdd,
} from '@mui/icons-material';
import { Link as RouterLink } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const Home: React.FC = () => {
  const { currentUser, isAdmin } = useAuth();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const features = [
    {
      icon: <VerifiedUser sx={{ fontSize: 40 }} />,
      title: 'University Verified',
      description: 'Exclusive platform for COMSATS students, faculty, and staff with email verification.',
    },
    {
      icon: <Security sx={{ fontSize: 40 }} />,
      title: 'Secure & Private',
      description: 'Your data is protected with Supabase security and privacy controls.', // Updated: Firebase -> Supabase
    },
    {
      icon: <Speed sx={{ fontSize: 40 }} />,
      title: 'Quick Recovery',
      description: 'AI-powered matching helps reunite items with owners quickly.',
    },
    {
      icon: <Group sx={{ fontSize: 40 }} />,
      title: 'Community Trust',
      description: 'Join thousands of COMSATS members helping each other.',
    },
  ];

  const stats = [
    { value: '1,200+', label: 'Items Reunited' },
    { value: '5,000+', label: 'Community Members' },
    { value: '94%', label: 'Success Rate' },
    { value: '<24h', label: 'Avg. Recovery Time' },
  ];

  const quickLinks = [
    { label: 'Student Portal', url: 'https://sis.cuiatd.edu.pk' },
    { label: 'University Website', url: 'https://www.comsats.edu.pk' },
    { label: 'CUI Library', url: 'https://library.comsats.edu.pk' },
  ];

  return (
    <Box>
      {/* Hero Section with COMSATS Blue Gradient */}
      <Box
        sx={{
          background: 'linear-gradient(135deg, #1a237e 0%, #283593 100%)',
          color: 'white',
          py: { xs: 6, md: 10 },
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        <Container maxWidth="lg">
          <Grid container spacing={4} alignItems="center">
            <Grid item xs={12} md={7}>
              {/* University Logo */}
              <Box sx={{ mb: 3, display: 'flex', alignItems: 'center' }}>
                <Box
                  component="img"
                  src="/comsats-logo.png" // CORRECT PATH - from public folder
                  alt="COMSATS University Islamabad"
                  sx={{
                    height: 80,
                    width: 'auto',
                    mr: 3,
                  }}
                />
                <Box>
                  <Typography
                    variant="h4"
                    sx={{
                      fontWeight: 700,
                      color: 'white',
                      lineHeight: 1.2,
                    }}
                  >
                    COMSATS University Islamabad
                  </Typography>
                  <Typography variant="body1" sx={{ opacity: 0.9, color: 'white' }}>
                    Abbottabad Campus • Lost & Found Portal
                  </Typography>
                </Box>
              </Box>
              
              <Chip
                label="OFFICIAL UNIVERSITY PLATFORM"
                sx={{
                  backgroundColor: '#ff6f00',
                  color: 'white',
                  fontWeight: 600,
                  mb: 3,
                }}
              />
              
              <Typography
                variant="h1"
                component="h1"
                gutterBottom
                sx={{
                  fontWeight: 700,
                  fontSize: { xs: '2.5rem', md: '3.5rem' },
                  color: 'white',
                }}
              >
                Lost Something at COMSATS?
              </Typography>
              
              <Typography variant="h5" paragraph sx={{ opacity: 0.9, color: 'white', mb: 4 }}>
                The official platform where the COMSATS community helps reunite lost items with their owners.
                Secure, verified, and exclusively for university members.
              </Typography>
              
              <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                {currentUser ? (
                  <>
                    <Button
                      variant="contained"
                      color="secondary"
                      size="large"
                      component={RouterLink}
                      to="/report"
                      startIcon={<AddCircle />}
                      sx={{ px: 4 }}
                    >
                      Report Item
                    </Button>
                    <Button
                      variant="outlined"
                      color="inherit"
                      size="large"
                      component={RouterLink}
                      to="/dashboard"
                      endIcon={<ArrowForward />}
                    >
                      Go to Dashboard
                    </Button>
                    {/* Admin Access Button for Admin Users */}
                    {isAdmin && (
                      <Button
                        variant="contained"
                        color="success"
                        size="large"
                        component={RouterLink}
                        to="/admin"
                        startIcon={<AdminPanelSettings />}
                        sx={{ px: 4 }}
                      >
                        Admin Dashboard
                      </Button>
                    )}
                  </>
                ) : (
                  <>
                    <Button
                      variant="contained"
                      color="secondary"
                      size="large"
                      component={RouterLink}
                      to="/register"
                      startIcon={<AddCircle />}
                      sx={{ px: 4 }}
                    >
                      Register Now
                    </Button>
                    <Button
                      variant="outlined"
                      color="inherit"
                      size="large"
                      component={RouterLink}
                      to="/login"
                    >
                      Student/Faculty Login
                    </Button>
                    {/* Admin Login Button */}
                    <Button
                      variant="outlined"
                      color="inherit"
                      size="large"
                      component={RouterLink}
                      to="/admin-login"
                      startIcon={<Security />}
                      sx={{ borderStyle: 'dashed' }}
                    >
                      Admin Access
                    </Button>
                  </>
                )}
              </Box>
            </Grid>
            
            <Grid item xs={12} md={5}>
              <Paper
                sx={{
                  p: 4,
                  backgroundColor: 'rgba(255,255,255,0.1)',
                  backdropFilter: 'blur(10px)',
                  border: '1px solid rgba(255,255,255,0.2)',
                  borderRadius: 2,
                }}
              >
                <Box sx={{ textAlign: 'center', mb: 3 }}>
                  <FindInPage sx={{ fontSize: 80, color: '#ff6f00', mb: 2 }} />
                  <Typography sx={{ color: 'white', fontSize: 40}}>
                    How It Works
                  </Typography>
                </Box>
                
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  {[
                    { step: '1', title: 'Report', desc: 'Submit lost or found item details' },
                    { step: '2', title: 'Verify', desc: 'University email verification' },
                    { step: '3', title: 'Match', desc: 'Our system finds potential matches' },
                    { step: '4', title: 'Recover', desc: 'Connect securely to retrieve item' },
                  ].map((item) => (
                    <Box key={item.step} sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                      <Box
                        sx={{
                          width: 40,
                          height: 40,
                          borderRadius: '50%',
                          backgroundColor: '#ff6f00',
                          color: 'white',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontWeight: 'bold',
                          flexShrink: 0,
                        }}
                      >
                        {item.step}
                      </Box>
                      <Box>
                        <Typography variant="subtitle1" sx={{ opacity: 0.9, color: 'white', fontWeight: 600}}>
                          {item.title}
                        </Typography>
                        <Typography variant="body2" sx={{ opacity: 0.9, color: 'white' }}>
                          {item.desc}
                        </Typography>
                      </Box>
                    </Box>
                  ))}
                </Box>
              </Paper>
            </Grid>
          </Grid>
        </Container>
      </Box>

      {/* Admin Access Section - Only show if not admin */}
      {!isAdmin && (
        <Container maxWidth="lg" sx={{ py: 6 }}>
          <Paper
            sx={{
              p: 4,
              border: '2px solid #1a237e',
              backgroundColor: '#f8f9ff',
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
              <Security sx={{ fontSize: 40, color: 'primary.main', mr: 2 }} />
              <Box>
                <Typography variant="h4" gutterBottom>
                  Administrator Access
                </Typography>
                <Typography variant="body1" color="text.secondary">
                  System administration portal for authorized personnel
                </Typography>
              </Box>
            </Box>

            <Alert severity="warning" sx={{ mb: 3 }}>
              <Typography variant="body2">
                <strong>Restricted Access:</strong> This section is for authorized administrators only.
                Admin access is determined by user role in the Supabase database.
              </Typography>
            </Alert>

            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <Card variant="outlined" sx={{ height: '100%' }}>
                  <CardContent sx={{ p: 3, textAlign: 'center' }}>
                    <Lock sx={{ fontSize: 48, color: 'primary.main', mb: 2 }} />
                    <Typography variant="h6" gutterBottom>
                      Admin Login
                    </Typography>
                    <Typography variant="body2" color="text.secondary" paragraph>
                      Access the administrative dashboard with authorized credentials
                    </Typography>
                    <Button
                      variant="contained"
                      fullWidth
                      startIcon={<AdminPanelSettings />}
                      component={RouterLink}
                      to="/admin-login"
                    >
                      Login as Administrator
                    </Button>
                  </CardContent>
                </Card>
              </Grid>

              <Grid item xs={12} md={6}>
                <Card variant="outlined" sx={{ height: '100%' }}>
                  <CardContent sx={{ p: 3, textAlign: 'center' }}>
                    <Security sx={{ fontSize: 48, color: 'warning.main', mb: 2 }} />
                    <Typography variant="h6" gutterBottom>
                      Initial Setup
                    </Typography>
                    <Typography variant="body2" color="text.secondary" paragraph>
                      First-time system setup for the initial administrator account
                    </Typography>
                    <Button
                      variant="outlined"
                      color="warning"
                      fullWidth
                      startIcon={<PersonAdd />}
                      component={RouterLink}
                      to="/setup-admin"
                    >
                      Setup Admin Account
                    </Button>
                    <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                      Only for initial system deployment
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>

            <Divider sx={{ my: 3 }} />
            
            <Typography variant="body2" color="text.secondary" align="center">
              For administrator access inquiries, contact the IT Department or System Administrator
            </Typography>
          </Paper>
        </Container>
      )}

      {/* If user is already logged in as admin */}
      {currentUser && isAdmin && (
        <Container maxWidth="lg" sx={{ py: 6 }}>
          <Paper
            sx={{
              p: 4,
              backgroundColor: 'success.light',
              border: '2px solid success.main',
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
              <AdminPanelSettings sx={{ fontSize: 40, color: 'success.main', mr: 2 }} />
              <Box>
                <Typography variant="h4" gutterBottom color="success.dark">
                  Welcome, Administrator!
                </Typography>
                <Typography variant="body1" color="success.dark">
                  You are logged in with full system administrator privileges
                </Typography>
              </Box>
            </Box>
            
            <Grid container spacing={2}>
              <Grid item xs={12} md={4}>
                <Button
                  variant="contained"
                  fullWidth
                  startIcon={<AdminPanelSettings />}
                  component={RouterLink}
                  to="/admin"
                  sx={{ bgcolor: 'success.main' }}
                >
                  Go to Admin Dashboard
                </Button>
              </Grid>
              <Grid item xs={12} md={4}>
                <Button
                  variant="outlined"
                  fullWidth
                  startIcon={<Security />}
                  component={RouterLink}
                  to="/admin"
                  sx={{ borderColor: 'success.main', color: 'success.dark' }}
                >
                  System Management
                </Button>
              </Grid>
              <Grid item xs={12} md={4}>
                <Button
                  variant="text"
                  fullWidth
                  component={RouterLink}
                  to="/dashboard"
                >
                  Go to User Dashboard
                </Button>
              </Grid>
            </Grid>
          </Paper>
        </Container>
      )}

      {/* Stats Section */}
      <Container maxWidth="lg" sx={{ py: 8 }}>
        <Grid container spacing={4}>
          {stats.map((stat) => (
            <Grid item xs={6} md={3} key={stat.label}>
              <Paper
                sx={{
                  p: 3,
                  textAlign: 'center',
                  borderLeft: '4px solid #ff6f00',
                }}
              >
                <Typography variant="h3" color="primary" gutterBottom fontWeight={700}>
                  {stat.value}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {stat.label}
                </Typography>
              </Paper>
            </Grid>
          ))}
        </Grid>
      </Container>

      {/* Features Section */}
      <Container maxWidth="lg" sx={{ py: 8 }}>
        <Box sx={{ textAlign: 'center', mb: 6 }}>
          <Typography variant="h2" gutterBottom>
            Why Use Our Platform?
          </Typography>
          <Typography variant="h6" color="text.secondary" sx={{ maxWidth: 800, mx: 'auto' }}>
            Designed specifically for the COMSATS University community with security and efficiency in mind.
          </Typography>
        </Box>
        
        <Grid container spacing={4}>
          {features.map((feature, index) => (
            <Grid item xs={12} sm={6} md={3} key={index}>
              <Card sx={{ height: '100%', transition: 'transform 0.2s', '&:hover': { transform: 'translateY(-4px)' } }}>
                <CardContent sx={{ p: 3, textAlign: 'center' }}>
                  <Box sx={{ color: 'primary.main', mb: 3 }}>
                    {feature.icon}
                  </Box>
                  <Typography variant="h6" gutterBottom fontWeight={600}>
                    {feature.title}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {feature.description}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Container>

      {/* CTA Section */}
      <Box sx={{ py: 8, backgroundColor: 'grey.50' }}>
        <Container maxWidth="lg">
          <Paper
            sx={{
              p: { xs: 4, md: 6 },
              textAlign: 'center',
              background: 'linear-gradient(135deg, #1a237e 0%, #283593 100%)',
              color: 'white',
              borderRadius: 2,
            }}
          >
            <School sx={{ fontSize: 60, mb: 3, opacity: 0.9 }} />
            <Typography variant="h3" gutterBottom sx={{color:'white'}}>
              Join the COMSATS Community
            </Typography>
            <Typography variant="h6" paragraph sx={{ color: 'white', opacity: 0.9, mb: 4, maxWidth: 800, mx: 'auto' }}>
              Help make our campus a better place by reuniting lost items with their owners.
              Together, we build a more caring and responsible community.
            </Typography>
            <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', flexWrap: 'wrap' }}>
              <Button
                variant="contained"
                color="secondary"
                size="large"
                component={RouterLink}
                to={currentUser ? '/report' : '/register'}
                startIcon={<AddCircle />}
              >
                {currentUser ? 'Report an Item' : 'Get Started'}
              </Button>
              <Button
                variant="outlined"
                color="inherit"
                size="large"
                component={RouterLink}
                to="/lost"
              >
                Browse Lost Items
              </Button>
              {/* Admin Quick Access */}
              {!currentUser && (
                <Button
                  variant="outlined"
                  color="inherit"
                  size="large"
                  component={RouterLink}
                  to="/admin-login"
                  startIcon={<Security />}
                >
                  Admin Portal
                </Button>
              )}
            </Box>
          </Paper>
        </Container>
      </Box>

      {/* Quick Links Footer */}
      <Box sx={{ py: 4, backgroundColor: 'grey.900', color: 'white' }}>
        <Container maxWidth="lg">
          <Typography variant="h6" gutterBottom align="center">
            COMSATS University Links
          </Typography>
          <Grid container spacing={2} justifyContent="center">
            {quickLinks.map((link) => (
              <Grid item key={link.label}>
                <Button
                  component="a"
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  size="small"
                  sx={{ color: 'white' }}
                >
                  {link.label}
                </Button>
              </Grid>
            ))}
            {/* Admin Link in Footer */}
            <Grid item>
              <Button
                component={RouterLink}
                to="/admin-login"
                size="small"
                sx={{ color: 'white' }}
                startIcon={<Security />}
              >
                Admin Access
              </Button>
            </Grid>
          </Grid>
          <Divider sx={{ my: 3, opacity: 0.2 }} />
          <Typography variant="body2" align="center" sx={{ opacity: 0.6 }}>
            © 2025 COMSATS University Islamabad - Abbottabad Campus - Lost & Found App. 
            This service is exclusively for COMSATS University members.
          </Typography>
        </Container>
      </Box>
    </Box>
  );
};

export default Home;
