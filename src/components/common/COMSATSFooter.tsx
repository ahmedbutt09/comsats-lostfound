import React from 'react';
import { Box, Container, Typography, Divider, Grid, Link, Button, IconButton, Stack } from '@mui/material';
import { 
  LocationOn, 
  Phone, 
  Email, 
  Security, 
  Language, 

} from '@mui/icons-material';
import { Link as RouterLink } from 'react-router-dom';

const COMSATSFooter: React.FC = () => {
  // Verified Official Links for CUI
  const quickLinks = [
    { name: 'CUI Official Site', url: 'https://www.comsats.edu.pk' },
    { name: 'Abbottabad Campus', url: 'https://www.cuiatd.edu.pk' },
    { name: 'Student Portal (CU Online)', url: 'https://cuonline.cuiatd.edu.pk/' },
  ];

  return (
    <Box
      component="footer"
      sx={{
        backgroundColor: '#111', // Deep black-grey
        color: 'white',
        pt: 8,
        pb: 4,
        mt: 'auto',
        borderTop: '4px solid #1a237e', // Matching Header Blue
      }}
    >
      <Container maxWidth="lg">
        <Grid container spacing={5}>
          {/* Official Branding Section */}
          <Grid item xs={12} md={5}>
            <Stack spacing={2}>
              <Typography variant="h6" fontWeight={700} sx={{ color: '#ffb74d' }}>
                CUI ABBOTTABAD
              </Typography>
              <Typography variant="body2" sx={{ opacity: 0.7, lineHeight: 1.8, maxWidth: 350 }}>
                The dedicated Lost & Found portal for COMSATS University Islamabad, Abbottabad Campus. 
                Facilitating the community to recover lost items through a secure digital platform.
              </Typography>
              
              <Stack spacing={1.5} sx={{ pt: 1 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <LocationOn sx={{ color: '#ff6f00', fontSize: 20 }} />
                  <Typography variant="body2" sx={{ opacity: 0.8 }}>
                    University Road, Tobe Camp, Abbottabad, KP
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Phone sx={{ color: '#ff6f00', fontSize: 20 }} />
                  <Typography variant="body2" sx={{ opacity: 0.8 }}>
                    +92 (992) 383591-6 (Ext. 320)
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Email sx={{ color: '#ff6f00', fontSize: 20 }} />
                  <Typography variant="body2" sx={{ opacity: 0.8 }}>
                    info@cuiatd.edu.pk
                  </Typography>
                </Box>
              </Stack>
            </Stack>
          </Grid>

          {/* Quick Links Section */}
          <Grid item xs={12} sm={6} md={3}>
            <Typography variant="subtitle1" fontWeight={700} gutterBottom>
              Resources
            </Typography>
            <Stack spacing={1}>
              {quickLinks.map((link) => (
                <Link
                  key={link.name}
                  href={link.url}
                  target="_blank"
                  rel="noopener"
                  sx={{ 
                    color: 'rgba(255,255,255,0.6)', 
                    textDecoration: 'none',
                    fontSize: '0.875rem',
                    '&:hover': { color: '#ffb74d', pl: 0.5 },
                    transition: 'all 0.2s'
                  }}
                >
                  {link.name}
                </Link>
              ))}
            </Stack>
          </Grid>

          {/* Platform Access */}
          <Grid item xs={12} sm={6} md={4}>
            <Typography variant="subtitle1" fontWeight={700} gutterBottom>
              Platform
            </Typography>
            <Typography variant="body2" sx={{ opacity: 0.6, mb: 2 }}>
              Are you part of the campus security or administration?
            </Typography>
            <Button
              component={RouterLink}
              to="/admin-login"
              variant="outlined"
              startIcon={<Security />}
              sx={{
                color: 'white',
                borderColor: 'rgba(255,255,255,0.3)',
                textTransform: 'none',
                '&:hover': { borderColor: '#ff6f00', bgcolor: 'rgba(255,111,0,0.1)' }
              }}
            >
              Staff Dashboard
            </Button>
            
          </Grid>
        </Grid>

        <Divider sx={{ my: 6, borderColor: 'rgba(255,255,255,0.1)' }} />

        <Box sx={{ 
          display: 'flex', 
          flexDirection: { xs: 'column', md: 'row' }, 
          justifyContent: 'space-between', 
          alignItems: 'center',
          gap: 2 
        }}>
          <Typography variant="caption" sx={{ opacity: 0.5 }}>
            © {new Date().getFullYear()} CUI Abbottabad - Lost & Found Management System
          </Typography>
          
          <Stack direction="row" spacing={3}>
            <Link component={RouterLink} to="/terms-of-use" sx={{ color: 'rgba(255,255,255,0.4)', textDecoration: 'none', fontSize: '0.75rem' }}>
              Terms of Use
            </Link>
            <Link 
  component={RouterLink} 
  to="/privacy-policy" 
  sx={{ 
    color: 'rgba(255,255,255,0.4)', 
    textDecoration: 'none', 
    fontSize: '0.75rem',
    '&:hover': { color: '#ffb74d' } 
  }}
>
  Privacy Policy
</Link>
          </Stack>
        </Box>
      </Container>
    </Box>
  );
};

export default COMSATSFooter;
