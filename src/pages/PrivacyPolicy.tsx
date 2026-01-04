import React from 'react';
import { Container, Typography, Paper, Box, Divider, Breadcrumbs, Link } from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';

const PrivacyPolicy: React.FC = () => {
  return (
    <Container maxWidth="md" sx={{ mt: 4, mb: 8 }}>
      <Breadcrumbs sx={{ mb: 2 }}>
        <Link component={RouterLink} to="/" color="inherit">Home</Link>
        <Typography color="text.primary">Privacy Policy</Typography>
      </Breadcrumbs>
      
      <Paper sx={{ p: { xs: 3, md: 6 }, borderRadius: 2 }}>
        <Typography variant="h3" gutterBottom fontWeight={700}>Privacy Policy</Typography>
        <Typography variant="body2" color="text.secondary" gutterBottom>Last Updated: January 2026</Typography>
        
        <Box sx={{ mt: 4 }}>
          <Typography variant="h6" gutterBottom>1. Information We Collect</Typography>
          <Typography variant="body1" paragraph>
            To facilitate the return of lost items, we collect your name, COMSATS email address, student/staff ID, and any images of items you upload to the system.
          </Typography>

          <Typography variant="h6" gutterBottom>2. How We Use Your Data</Typography>
          <Typography variant="body1" paragraph>
            Your data is used solely for identifying owners of lost property. Admin users can access your contact details only when a potential match is found for a reported item.
          </Typography>

          <Typography variant="h6" gutterBottom>3. Data Retention</Typography>
          <Typography variant="body1" paragraph>
            Images and case details are archived after a case is marked as "Resolved" or "Closed." Personal data is stored securely via Supabase and is never shared with third-party advertisers.
          </Typography>

          <Divider sx={{ my: 4 }} />

          <Typography variant="h6" gutterBottom>4. Contact for Privacy Concerns</Typography>
          <Typography variant="body1">
            If you have questions regarding your data, please contact the IT Administration at COMSATS University.
          </Typography>
        </Box>
      </Paper>
    </Container>
  );
};

export default PrivacyPolicy;