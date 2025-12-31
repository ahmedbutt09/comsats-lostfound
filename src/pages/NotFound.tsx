// src/pages/NotFound.tsx
import React from 'react';
import {
  Container,
  Paper,
  Typography,
  Box,
  Button,
  Grid,
} from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';
import {
  Home,
  Search,
  Report,
  ArrowBack,
  ErrorOutline,
} from '@mui/icons-material';

const NotFound: React.FC = () => {
  return (
    <Container maxWidth="md" sx={{ py: 8 }}>
      <Paper
        elevation={0}
        sx={{
          p: { xs: 3, md: 6 },
          textAlign: 'center',
          borderRadius: 2,
          backgroundColor: 'background.paper',
        }}
      >
        <Box sx={{ mb: 4 }}>
          <ErrorOutline
            sx={{
              fontSize: 80,
              color: 'error.main',
              mb: 2,
            }}
          />
          <Typography variant="h1" sx={{ fontSize: { xs: '3rem', md: '4rem' }, fontWeight: 700, mb: 2 }}>
            404
          </Typography>
          <Typography variant="h4" gutterBottom>
            Page Not Found
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ mb: 4, maxWidth: 600, mx: 'auto' }}>
            The page you're looking for doesn't exist or has been moved. 
            It might be a lost item that hasn't been found yet!
          </Typography>
        </Box>

        <Grid container spacing={2} justifyContent="center" sx={{ mb: 6 }}>
          <Grid item xs={12} sm={4}>
            <Button
              fullWidth
              variant="contained"
              size="large"
              component={RouterLink}
              to="/"
              startIcon={<Home />}
              sx={{ py: 1.5 }}
            >
              Go Home
            </Button>
          </Grid>
          <Grid item xs={12} sm={4}>
            <Button
              fullWidth
              variant="outlined"
              size="large"
              onClick={() => window.history.back()}
              startIcon={<ArrowBack />}
              sx={{ py: 1.5 }}
            >
              Go Back
            </Button>
          </Grid>
          <Grid item xs={12} sm={4}>
            <Button
              fullWidth
              variant="outlined"
              size="large"
              component={RouterLink}
              to="/lost"
              startIcon={<Search />}
              sx={{ py: 1.5 }}
            >
              Browse Lost Items
            </Button>
          </Grid>
        </Grid>

        <Box sx={{ backgroundColor: 'grey.50', p: 4, borderRadius: 2 }}>
          <Typography variant="h6" gutterBottom>
            Looking for something specific?
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Try these popular pages instead:
          </Typography>
          
          <Grid container spacing={2} justifyContent="center">
            <Grid item xs={6} sm={3}>
              <Button
                fullWidth
                component={RouterLink}
                to="/lost"
                variant="text"
                size="small"
              >
                Lost Items
              </Button>
            </Grid>
            <Grid item xs={6} sm={3}>
              <Button
                fullWidth
                component={RouterLink}
                to="/found"
                variant="text"
                size="small"
              >
                Found Items
              </Button>
            </Grid>
            <Grid item xs={6} sm={3}>
              <Button
                fullWidth
                component={RouterLink}
                to="/dashboard"
                variant="text"
                size="small"
              >
                Dashboard
              </Button>
            </Grid>
            <Grid item xs={6} sm={3}>
              <Button
                fullWidth
                component={RouterLink}
                to="/report"
                variant="text"
                size="small"
                startIcon={<Report />}
              >
                Report Case
              </Button>
            </Grid>
          </Grid>
        </Box>

        <Box sx={{ mt: 6, pt: 4, borderTop: 1, borderColor: 'divider' }}>
          <Typography variant="body2" color="text.secondary">
            Found a broken link or need help?{' '}
            <Button
              component="a"
              href="mailto:support@comsats.edu.pk"
              variant="text"
              size="small"
              sx={{ textDecoration: 'none' }}
            >
              Contact Support
            </Button>
          </Typography>
          <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
            COMSATS University Islamabad - Abbottabad Campus Lost & Found System
          </Typography>
        </Box>
      </Paper>
    </Container>
  );
};

export default NotFound;
