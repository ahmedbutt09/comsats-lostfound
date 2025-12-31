import React from 'react';
import { Container, Typography, Box, Alert, Button } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { Chat as ChatIcon } from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';

const Messages: React.FC = () => {
  const navigate = useNavigate();
  const { currentUser } = useAuth();

  return (
    <Container maxWidth="md" sx={{ mt: 4, mb: 8 }}>
      <Typography variant="h4" gutterBottom>
        Messages
      </Typography>
      
      {!currentUser ? (
        <Alert severity="warning" sx={{ mb: 3 }}>
          Please log in to access your messages.
        </Alert>
      ) : (
        <Alert severity="info" sx={{ mb: 3 }}>
          This page is under development. Please use the chat feature from individual cases.
        </Alert>
      )}
      
      <Box sx={{ textAlign: 'center', py: 4 }}>
        <Typography variant="body1" paragraph>
          To start a conversation:
        </Typography>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, maxWidth: 300, mx: 'auto' }}>
          <Typography variant="body2">
            1. Browse Lost or Found items
          </Typography>
          <Typography variant="body2">
            2. Click on any item to view details
          </Typography>
          <Typography variant="body2">
            3. Click "Message Owner" button
          </Typography>
        </Box>
        
        <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2, mt: 4 }}>
          <Button
            variant="contained"
            startIcon={<ChatIcon />}
            onClick={() => navigate('/lost')}
          >
            Browse Lost Items
          </Button>
          <Button
            variant="outlined"
            startIcon={<ChatIcon />}
            onClick={() => navigate('/found')}
          >
            Browse Found Items
          </Button>
        </Box>
        
        {!currentUser && (
          <Button
            variant="contained"
            color="primary"
            sx={{ mt: 3 }}
            onClick={() => navigate('/login')}
          >
            Login to Access Messages
          </Button>
        )}
      </Box>
    </Container>
  );
};

export default Messages;
