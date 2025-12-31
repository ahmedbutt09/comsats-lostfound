import React from 'react';
import { Box, Container, Typography, Divider, Grid, Link, Button } from '@mui/material';
import { School, LocationOn, Phone, Email, Security } from '@mui/icons-material';
import { Link as RouterLink } from 'react-router-dom';

const COMSATSFooter: React.FC = () => {
  const quickLinks = [
    { name: 'Student Portal', url: 'https://sis.cuiatd.edu.pk' },
    { name: 'University Website', url: 'https://www.comsats.edu.pk' },
    { name: 'CUI Library', url: 'https://library.comsats.edu.pk' },
    { name: 'Academic Calendar', url: 'https://www.comsats.edu.pk/AcademicCalendar.aspx' },
    { name: 'Campus Map', url: 'https://www.comsats.edu.pk/CampusMap.aspx' },
    { name: 'Contact Directory', url: 'https://www.comsats.edu.pk/ContactDirectory.aspx' },
  ];

  const campuses = [
    'Islamabad Campus',
    'Lahore Campus', 
    'Abbottabad Campus',
    'Wah Campus',
    'Attock Campus',
    'Sahiwal Campus',
    'Virtual Campus',
  ];

  return (
    <Box
      component="footer"
      sx={{
        backgroundColor: 'grey.900',
        color: 'white',
        py: 6,
        mt: 'auto',
      }}
    >
      <Container maxWidth="lg">
        <Grid container spacing={4}>
          {/* About Section */}
          <Grid item xs={12} md={4}>
            <Typography variant="h6" gutterBottom fontWeight={600}>
              COMSATS University Islamabad - Abbottabad Campus
            </Typography>
            <Typography variant="body2" sx={{ mb: 2, opacity: 0.8 }}>
              The official Lost & Found platform for COMSATS University community.
              Helping students, faculty, and staff reunite with lost belongings since 2025.
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
              <LocationOn fontSize="small" sx={{ opacity: 0.8 }} />
              <Typography variant="body2" sx={{ opacity: 0.8 }}>
                Mandiyan, Abbottabad 22100, Pakistan
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
              <Phone fontSize="small" sx={{ opacity: 0.8 }} />
              <Typography variant="body2" sx={{ opacity: 0.8 }}>
                UAN: 111-001-007
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Email fontSize="small" sx={{ opacity: 0.8 }} />
              <Typography variant="body2" sx={{ opacity: 0.8 }}>
                info@cuiatd.edu.pk
              </Typography>
            </Box>
          </Grid>

          {/* Quick Links */}
          <Grid item xs={12} md={4}>
            <Typography variant="h6" gutterBottom fontWeight={600}>
              Quick Links
            </Typography>
            <Grid container spacing={1}>
              {quickLinks.map((link) => (
                <Grid item xs={6} key={link.name}>
                  <Button
                    component="a"
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    size="small"
                    sx={{
                      color: 'white',
                      opacity: 0.8,
                      justifyContent: 'flex-start',
                      '&:hover': { opacity: 1 },
                    }}
                  >
                    {link.name}
                  </Button>
                </Grid>
              ))}
              {/* Admin Access Link */}
              <Grid item xs={6}>
                <Button
                  component={RouterLink}
                  to="/admin-login"
                  size="small"
                  sx={{
                    color: 'white',
                    opacity: 0.8,
                    justifyContent: 'flex-start',
                    '&:hover': { opacity: 1 },
                  }}
                  startIcon={<Security fontSize="small" />}
                >
                  Admin Access
                </Button>
              </Grid>
            </Grid>
          </Grid>

          {/* Campuses */}
          <Grid item xs={12} md={4}>
            <Typography variant="h6" gutterBottom fontWeight={600}>
              Campuses
            </Typography>
            <Grid container spacing={1}>
              {campuses.map((campus) => (
                <Grid item xs={6} key={campus}>
                  <Typography variant="body2" sx={{ opacity: 0.8 }}>
                    {campus}
                  </Typography>
                </Grid>
              ))}
            </Grid>
          </Grid>
        </Grid>

        <Divider sx={{ my: 4, opacity: 0.2 }} />

        <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="body2" sx={{ opacity: 0.6, mb: { xs: 2, md: 0 } }}>
            © {new Date().getFullYear()} COMSATS University Islamabad. All rights reserved.
          </Typography>
          <Box sx={{ display: 'flex', gap: 2 }}>
            <Typography variant="body2" sx={{ opacity: 0.6 }}>
              <Link href="#" color="inherit" sx={{ textDecoration: 'none', opacity: 0.8 }}>
                Privacy Policy
              </Link>
            </Typography>
            <Typography variant="body2" sx={{ opacity: 0.6 }}>
              <Link href="#" color="inherit" sx={{ textDecoration: 'none', opacity: 0.8 }}>
                Terms of Service
              </Link>
            </Typography>
            <Typography variant="body2" sx={{ opacity: 0.6 }}>
              <Link href="#" color="inherit" sx={{ textDecoration: 'none', opacity: 0.8 }}>
                Campus Security
              </Link>
            </Typography>
            {/* Admin Setup Link (small) */}
            <Typography variant="body2" sx={{ opacity: 0.6 }}>
              <Link 
                component={RouterLink} 
                to="/setup-admin" 
                color="inherit" 
                sx={{ textDecoration: 'none', opacity: 0.8 }}
              >
                Admin Setup
              </Link>
            </Typography>
          </Box>
        </Box>
      </Container>
    </Box>
  );
};

export default COMSATSFooter;
