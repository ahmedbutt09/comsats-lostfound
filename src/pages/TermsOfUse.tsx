import React from 'react';
import { Container, Typography, Paper, Box, Divider, Breadcrumbs, Link, List, ListItem, ListItemText } from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';

const TermsOfUse: React.FC = () => {
  return (
    <Container maxWidth="md" sx={{ mt: 4, mb: 8 }}>
      <Breadcrumbs sx={{ mb: 2 }}>
        <Link component={RouterLink} to="/" color="inherit">Home</Link>
        <Typography color="text.primary">Terms of Use</Typography>
      </Breadcrumbs>
      
      <Paper sx={{ p: { xs: 3, md: 6 }, borderRadius: 2 }}>
        <Typography variant="h3" gutterBottom fontWeight={700}>Terms of Use</Typography>
        <Typography variant="body2" color="text.secondary" gutterBottom>Effective Date: January 2026</Typography>
        
        <Box sx={{ mt: 4 }}>
          <Typography variant="h6" gutterBottom>1. Acceptance of Terms</Typography>
          <Typography variant="body1" paragraph>
            By accessing the COMSATS Lost & Found portal, you agree to comply with the University's code of conduct and these platform-specific rules.
          </Typography>

          <Typography variant="h6" gutterBottom>2. User Responsibilities</Typography>
          <List>
            <ListItem>
              <ListItemText primary="Accurate Reporting" secondary="Users must provide truthful descriptions of lost or found items. Providing false information is a violation of university policy." />
            </ListItem>
            <ListItem>
              <ListItemText primary="Proof of Ownership" secondary="Claiming an item requires valid proof or a detailed description verified by a system administrator." />
            </ListItem>
          </List>

          <Typography variant="h6" gutterBottom>3. Prohibited Activities</Typography>
          <Typography variant="body1" paragraph>
            Users are prohibited from uploading offensive imagery, spamming the report system, or attempting to gain unauthorized access to other users' profiles.
          </Typography>

          <Divider sx={{ my: 4 }} />

          <Typography variant="h6" gutterBottom>4. Limitation of Liability</Typography>
          <Typography variant="body1">
            While we strive to facilitate successful returns, the University is not responsible for any damage to items or failure to recover lost property through this digital portal.
          </Typography>
        </Box>
      </Paper>
    </Container>
  );
};

export default TermsOfUse;
