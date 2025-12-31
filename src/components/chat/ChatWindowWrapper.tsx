import React, { useState } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import ChatWindow from './ChatWindow';
import {
  Container,
  Box,
  Typography,
  Button,
  CircularProgress,
  Alert,
} from '@mui/material';
import { ArrowBack } from '@mui/icons-material';

const ChatWindowWrapper: React.FC = () => {
  const { caseId } = useParams<{ caseId: string }>();
  const location = useLocation();
  const navigate = useNavigate();
  const { currentUser, userData, loading: authLoading } = useAuth();
  
  // Get receiverId from query params
  const queryParams = new URLSearchParams(location.search);
  const receiverId = queryParams.get('userId') || '';
  const receiverName = decodeURIComponent(queryParams.get('userName') || 'Unknown User');
  const caseTitle = queryParams.get('caseTitle') || '';

  const [isChatOpen, setIsChatOpen] = useState(true);

  const handleClose = () => {
    setIsChatOpen(false);
    navigate(-1); // Go back to previous page
  };

  if (authLoading) {
    return (
      <Container sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
        <CircularProgress />
      </Container>
    );
  }

  if (!caseId || !currentUser) {
    return (
      <Container sx={{ py: 4 }}>
        <Alert severity="error" sx={{ mb: 3 }}>
          <Typography variant="h6" gutterBottom>
            Authentication Required
          </Typography>
          <Typography variant="body2">
            Please log in to access the chat feature.
          </Typography>
        </Alert>
        <Button
          variant="contained"
          startIcon={<ArrowBack />}
          onClick={() => navigate('/login')}
        >
          Go to Login
        </Button>
      </Container>
    );
  }

  if (!receiverId) {
    return (
      <Container sx={{ py: 4 }}>
        <Alert severity="warning" sx={{ mb: 3 }}>
          <Typography variant="h6" gutterBottom>
            Invalid Chat Parameters
          </Typography>
          <Typography variant="body2">
            Receiver information is missing. Please go back and try again.
          </Typography>
        </Alert>
        <Button
          variant="outlined"
          startIcon={<ArrowBack />}
          onClick={() => navigate(-1)}
        >
          Go Back
        </Button>
      </Container>
    );
  }

  // Don't allow chatting with yourself
  if (currentUser.id === receiverId) {
    return (
      <Container sx={{ py: 4 }}>
        <Alert severity="info" sx={{ mb: 3 }}>
          <Typography variant="h6" gutterBottom>
            Cannot Chat With Yourself
          </Typography>
          <Typography variant="body2">
            You cannot send messages to yourself. Please contact the other party through their contact information.
          </Typography>
        </Alert>
        <Button
          variant="outlined"
          startIcon={<ArrowBack />}
          onClick={() => navigate(-1)}
        >
          Go Back
        </Button>
      </Container>
    );
  }

  return (
    <Box sx={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Optional: Add a header with case info */}
      <Box sx={{ 
        p: 2, 
        bgcolor: 'background.paper', 
        borderBottom: 1, 
        borderColor: 'divider',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <Box>
          <Typography variant="h6">
            Chat about {caseTitle || 'Case'}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Chatting with: {receiverName}
          </Typography>
        </Box>
        <Button
          variant="outlined"
          size="small"
          startIcon={<ArrowBack />}
          onClick={handleClose}
        >
          Close Chat
        </Button>
      </Box>
  
      {/* Main chat window */}
      <Box sx={{ flex: 1, position: 'relative' }}>
        <ChatWindow
          caseId={caseId}
          caseTitle={caseTitle} // ADD THIS LINE
          receiverId={receiverId}
          receiverName={receiverName}
          open={isChatOpen}
          onClose={handleClose}
        />
      </Box>
    </Box>
  );
};

export default ChatWindowWrapper;
