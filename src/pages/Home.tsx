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
  Chip,
  Divider,
  useTheme,
  useMediaQuery,
  Alert,
} from '@mui/material';
import {
  AddCircle,
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
  Search,
  Handshake,
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
      description: 'Your data is protected with Supabase security and privacy controls.',
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
      {/* Hero Section */}
      <Box
        sx={{
          background: 'linear-gradient(135deg, #1a237e 0%, #283593 100%)',
          color: 'white',
          py: { xs: 6, md: 12 },
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        <Container maxWidth="lg">
          <Grid container spacing={6} alignItems="center">
            <Grid item xs={12} md={7}>
              {/* Enlarged University Logo */}
              <Box sx={{ mb: 4, display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, alignItems: 'center' }}>
                <Box
                  component="img"
                  src="/comsats-logo.png"
                  alt="COMSATS University Islamabad"
                  sx={{
                    height: { xs: 100, md: 140 }, // Enlarged
                    width: 'auto',
                    mr: { sm: 4 },
                    mb: { xs: 2, sm: 0 },
                    filter: 'drop-shadow(0px 4px 20px rgba(0,0,0,0.3))', // Enhanced presence
                  }}
                />
                <Box sx={{ textAlign: { xs: 'center', sm: 'left' } }}>
                  <Typography
                    variant="h3"
                    sx={{
                      fontWeight: 800,
                      color: 'white',
                      lineHeight: 1.1,
                      letterSpacing: -0.5,
                    }}
                  >
                    COMSATS Lost & Found Portal
                  </Typography>
                  <Typography variant="h5" sx={{ opacity: 0.9, color: 'white', fontWeight: 300 }}>
                    Abbottabad Campus
                  </Typography>
                </Box>
              </Box>
              
              <Chip
                label="OFFICIAL UNIVERSITY PLATFORM"
                sx={{
                  backgroundColor: '#ff6f00',
                  color: 'white',
                  fontWeight: 800,
                  mb: 3,
                  px: 1
                }}
              />
              
              <Typography
                variant="h1"
                component="h1"
                gutterBottom
                sx={{
                  fontWeight: 800,
                  fontSize: { xs: '2.8rem', md: '4rem' },
                  color: 'white',
                  textShadow: '0px 2px 4px rgba(0,0,0,0.2)'
                }}
              >
                Lost Something?
              </Typography>
              
              <Typography variant="h5" paragraph sx={{ opacity: 0.9, color: 'white', mb: 5, fontWeight: 400, maxWidth: '600px' }}>
                Reuniting the COMSATS community through a secure, verified, and centralized lost and found portal.
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
                      sx={{ px: 4, py: 1.5, borderRadius: 2, fontWeight: 'bold' }}
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
                      sx={{ px: 4, py: 1.5, borderRadius: 2, borderWidth: 2, '&:hover': { borderWidth: 2 } }}
                    >
                      My Dashboard
                    </Button>
                  </>
                ) : (
                  <>
                    <Button
                      variant="contained"
                      color="secondary"
                      size="large"
                      component={RouterLink}
                      to="/register"
                      startIcon={<PersonAdd />}
                      sx={{ px: 4, py: 1.5, borderRadius: 2, fontWeight: 'bold' }}
                    >
                      Join Portal
                    </Button>
                    <Button
                      variant="outlined"
                      color="inherit"
                      size="large"
                      component={RouterLink}
                      to="/login"
                      sx={{ px: 4, py: 1.5, borderRadius: 2, borderWidth: 2, '&:hover': { borderWidth: 2 } }}
                    >
                      Member Login
                    </Button>
                  </>
                )}
              </Box>
            </Grid>
            
            <Grid item xs={12} md={5}>
              <Paper
                elevation={0}
                sx={{
                  p: 4,
                  backgroundColor: 'rgba(255,255,255,0.08)',
                  backdropFilter: 'blur(12px)',
                  border: '1px solid rgba(255,255,255,0.2)',
                  borderRadius: 4,
                }}
              >
                <Box sx={{ textAlign: 'center', mb: 4 }}>
                  <Typography variant="h4" sx={{ color: 'white', fontWeight: 700 }}>
                    How It Works
                  </Typography>
                  <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.7)', mt: 1 }}>
                    Follow these simple steps to recover your items
                  </Typography>
                </Box>
                
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                  {[
                    { 
                      icon: <AddCircle />, 
                      title: 'Report & Categorize', 
                      desc: 'Post details of a lost or found item with photos and location.' 
                    },
                    { 
                      icon: <Search />, 
                      title: 'Browse & Search', 
                      desc: 'Use smart filters to search through recent campus findings.' 
                    },
                    { 
                      icon: <VerifiedUser />, 
                      title: 'Verify Ownership', 
                      desc: 'The finder asks specific questions to ensure the item reaches its true owner.' 
                    },
                    { 
                      icon: <Handshake />, 
                      title: 'Safe Handover', 
                      desc: 'Chat securely and arrange a meeting at a designated campus spot.' 
                    },
                  ].map((item, idx) => (
                    <Box key={idx} sx={{ display: 'flex', alignItems: 'flex-start', gap: 2.5 }}>
                      <Box
                        sx={{
                          width: 44,
                          height: 44,
                          borderRadius: 2,
                          backgroundColor: '#ff6f00',
                          color: 'white',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          flexShrink: 0,
                          boxShadow: '0 4px 10px rgba(0,0,0,0.2)'
                        }}
                      >
                        {item.icon}
                      </Box>
                      <Box>
                        <Typography variant="subtitle1" sx={{ color: 'white', fontWeight: 700, lineHeight: 1.2 }}>
                          {item.title}
                        </Typography>
                        <Typography variant="body2" sx={{ opacity: 0.8, color: 'white', mt: 0.5 }}>
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

      {/* Admin and other sections remain unchanged as requested... */}
      {/* (Rest of your original code follows here: !isAdmin section, stats section, features, etc.) */}
      
      {!isAdmin && (
        <Container maxWidth="lg" sx={{ py: 6 }}>
          <Paper sx={{ p: 4, border: '2px solid #1a237e', backgroundColor: '#f8f9ff' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
              <Security sx={{ fontSize: 40, color: 'primary.main', mr: 2 }} />
              <Box>
                <Typography variant="h4" gutterBottom>Administrator Access</Typography>
                <Typography variant="body1" color="text.secondary">System administration portal for authorized personnel</Typography>
              </Box>
            </Box>
            <Alert severity="warning" sx={{ mb: 3 }}>
              <Typography variant="body2">
                <strong>Restricted Access:</strong> Admin access is determined by user role in the Supabase database.
              </Typography>
            </Alert>
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <Card variant="outlined" sx={{ height: '100%', textAlign: 'center' }}>
                  <CardContent sx={{ p: 3 }}>
                    <Lock sx={{ fontSize: 48, color: 'primary.main', mb: 2 }} />
                    <Typography variant="h6">Admin Login</Typography>
                    <Button variant="contained" fullWidth sx={{ mt: 2 }} component={RouterLink} to="/admin-login">Login as Administrator</Button>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} md={6}>
                <Card variant="outlined" sx={{ height: '100%', textAlign: 'center' }}>
                  <CardContent sx={{ p: 3 }}>
                    <Security sx={{ fontSize: 48, color: 'warning.main', mb: 2 }} />
                    <Typography variant="h6">Initial Setup</Typography>
                    <Button variant="outlined" color="warning" fullWidth sx={{ mt: 2 }} component={RouterLink} to="/setup-admin">Setup Admin Account</Button>
                  </CardContent>
                </Card>
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
              <Paper sx={{ p: 3, textAlign: 'center', borderLeft: '4px solid #ff6f00' }}>
                <Typography variant="h3" color="primary" gutterBottom fontWeight={700}>{stat.value}</Typography>
                <Typography variant="body2" color="text.secondary">{stat.label}</Typography>
              </Paper>
            </Grid>
          ))}
        </Grid>
      </Container>

      {/* Features Section */}
      <Container maxWidth="lg" sx={{ py: 8 }}>
        <Box sx={{ textAlign: 'center', mb: 6 }}>
          <Typography variant="h2" gutterBottom>Why Use Our Platform?</Typography>
          <Typography variant="h6" color="text.secondary" sx={{ maxWidth: 800, mx: 'auto' }}>
            Designed specifically for the COMSATS community with security and efficiency in mind.
          </Typography>
        </Box>
        <Grid container spacing={4}>
          {features.map((feature, index) => (
            <Grid item xs={12} sm={6} md={3} key={index}>
              <Card sx={{ height: '100%', transition: 'transform 0.2s', '&:hover': { transform: 'translateY(-4px)' } }}>
                <CardContent sx={{ p: 3, textAlign: 'center' }}>
                  <Box sx={{ color: 'primary.main', mb: 3 }}>{feature.icon}</Box>
                  <Typography variant="h6" gutterBottom fontWeight={600}>{feature.title}</Typography>
                  <Typography variant="body2" color="text.secondary">{feature.description}</Typography>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Container>

      {/* Quick Links Footer */}
      <Box sx={{ py: 4, backgroundColor: 'grey.900', color: 'white' }}>
        <Container maxWidth="lg">
          <Typography variant="h6" gutterBottom align="center">COMSATS University Links</Typography>
          <Grid container spacing={2} justifyContent="center">
            {quickLinks.map((link) => (
              <Grid item key={link.label}>
                <Button component="a" href={link.url} target="_blank" size="small" sx={{ color: 'white' }}>{link.label}</Button>
              </Grid>
            ))}
          </Grid>
          <Divider sx={{ my: 3, opacity: 0.2, bgcolor: 'rgba(255,255,255,0.1)' }} />
          <Typography variant="body2" align="center" sx={{ opacity: 0.6 }}>
            © 2025 COMSATS University Islamabad - Abbottabad Campus - Lost & Found App.
          </Typography>
        </Container>
      </Box>
    </Box>
  );
};

export default Home;
