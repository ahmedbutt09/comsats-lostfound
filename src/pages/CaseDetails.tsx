import React, { useEffect, useState } from 'react';
import {
  Container,
  Grid,
  Paper,
  Typography,
  Box,
  Button,
  Chip,
  Avatar,
  Divider,
  IconButton,
  Alert,
  CircularProgress,
  Card,
  CardContent,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
} from '@mui/material';
import {
  ArrowBack,
  LocationOn,
  Schedule,
  Person,
  Category as CategoryIcon,
  Email,
  Phone,
  Chat as ChatIcon,
  Edit,
  Delete,
  CheckCircle,
  Warning,
  Pending,
  Close,
  Image as ImageIcon,
  AttachMoney,
} from '@mui/icons-material';
import { useParams, useNavigate, Link as RouterLink } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { formatDate, formatRelativeTime, getCategoryColor, getStatusColor } from '../utils/helpers';
import LoadingSpinner from '../components/common/LoadingSpinner';
import ChatWindow from '../components/chat/ChatWindow';
import { supabase } from '../lib/supabaseClient';
import { Case, User } from '../types'

interface CaseWithUser extends Case {
  user_name?: string;
  user_email?: string;
  reporter_phone?: string;
}

const CaseDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { currentUser, userData } = useAuth();
  
  const [selectedCase, setSelectedCase] = useState<CaseWithUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [editForm, setEditForm] = useState<Partial<Case>>({});
  const [error, setError] = useState<string>('');

  // Fetch case with user data
  const getCaseById = async (caseId: string) => {
    try {
      setIsLoading(true);
      
      // Fetch case
      const { data: caseData, error: caseError } = await supabase
        .from('cases')
        .select('*')
        .eq('id', caseId)
        .single();

      if (caseError) throw caseError;
      
      // Fetch user data
      let userName = 'Anonymous';
      let userEmail = '';
      let reporterPhone = '';
      
      if (caseData.user_id) {
        const { data: userData } = await supabase
          .from('users')
          .select('name, email, phone')
          .eq('id', caseData.user_id)
          .single();
        
        if (userData) {
          userName = userData.name;
          userEmail = userData.email;
          reporterPhone = userData.phone || '';
        }
      }
      
      const caseWithUser: CaseWithUser = {
        ...caseData,
        user_name: userName,
        user_email: userEmail,
        reporter_phone: reporterPhone
      };
      
      setSelectedCase(caseWithUser);
      setEditForm({
        title: caseData.title,
        description: caseData.description,
        category: caseData.category,
        location: caseData.location,
      });
      
    } catch (error) {
      console.error('Error fetching case:', error);
      setError('Case not found');
    } finally {
      setIsLoading(false);
    }
  };

  // Delete case
  const deleteCase = async (caseId: string) => {
    try {
      setIsSubmitting(true);
      const { error } = await supabase
        .from('cases')
        .delete()
        .eq('id', caseId);
      
      if (error) throw error;
    } finally {
      setIsSubmitting(false);
    }
  };

  // Toggle case status
  const toggleCaseStatus = async (caseId: string, currentStatus: string) => {
    try {
      setIsSubmitting(true);
      const newStatus = currentStatus === 'active' ? 'resolved' : 'active';
      
      const { error } = await supabase
        .from('cases')
        .update({ status: newStatus })
        .eq('id', caseId);
      
      if (error) throw error;
      
      // Update local state
      if (selectedCase) {
        setSelectedCase({
          ...selectedCase,
          status: newStatus
        });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // Update case
  const updateCase = async (caseId: string, updates: Partial<Case>) => {
    try {
      setIsSubmitting(true);
      
      const { error } = await supabase
        .from('cases')
        .update(updates)
        .eq('id', caseId);
      
      if (error) throw error;
      
      // Update local state
      if (selectedCase) {
        setSelectedCase({
          ...selectedCase,
          ...updates // TypeScript is now happy because 'updates' is Partial<Case>
        });
      }
    } catch (error) {
      console.error('Error updating case:', error);
      // Add your toast or error handling here
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle starting chat (simplified - will redirect to chat page)
  const handleStartChat = () => {
    if (!currentUser || !selectedCase) {
      navigate('/login');
      return;
    }
    
    // Redirect to chat page with parameters
    navigate(`/chat/${selectedCase.id}?userId=${selectedCase.user_id}&userName=${encodeURIComponent(selectedCase.user_name || 'Anonymous')}`);
  };

  useEffect(() => {
    if (id) {
      getCaseById(id);
    }
  }, [id]);

  if (isLoading && !selectedCase) {
    return <LoadingSpinner message="Loading case details..." />;
  }

  if (!selectedCase) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4, mb: 8 }}>
        <Alert severity="error" sx={{ mb: 3 }}>
          Case not found or you don't have permission to view it.
        </Alert>
        <Button
          variant="contained"
          startIcon={<ArrowBack />}
          onClick={() => navigate(-1)}
        >
          Go Back
        </Button>
      </Container>
    );
  }

  const isOwner = currentUser?.id === selectedCase.user_id;
  const canContact = !isOwner && currentUser;
  const isLost = selectedCase.type === 'lost';
  const isFound = selectedCase.type === 'found';

  // Updated status config for Supabase
  const statusConfig = {
    active: { icon: <Pending color="warning" />, label: 'Active', color: 'warning' },
    claimed: { icon: <Warning color="info" />, label: 'Claimed', color: 'info' },
    resolved: { icon: <CheckCircle color="success" />, label: 'Resolved', color: 'success' },
    closed: { icon: <Close color="inherit" />, label: 'Closed', color: 'default' },
  };

  const status = statusConfig[selectedCase.status as keyof typeof statusConfig] || statusConfig.active;

  const handleDelete = async () => {
    try {
      await deleteCase(selectedCase.id);
      setShowDeleteDialog(false);
      navigate('/my-cases');
    } catch (error) {
      setError('Failed to delete case');
    }
  };

  const handleStatusToggle = async () => {
    try {
      await toggleCaseStatus(selectedCase.id, selectedCase.status);
    } catch (error) {
      setError('Failed to update status');
    }
  };

  const handleEditSubmit = async () => {
    try {
      await updateCase(selectedCase.id, editForm);
      setShowEditDialog(false);
    } catch (error) {
      setError('Failed to update case');
    }
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 8 }}>
      {/* Header with Back Button */}
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
        <IconButton onClick={() => navigate(-1)} sx={{ mr: 2 }}>
          <ArrowBack />
        </IconButton>
        <Typography variant="h4" component="h1" fontWeight={700}>
          Case Details
        </Typography>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      <Grid container spacing={3}>
        {/* Main Content */}
        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 3, borderRadius: 2 }}>
            {/* Case Header */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 3 }}>
              <Box>
                <Typography variant="h5" component="h2" gutterBottom fontWeight={600}>
                  {selectedCase.title}
                </Typography>
                <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 2 }}>
                  <Chip
                    icon={status.icon}
                    label={status.label}
                    color={status.color as any}
                    size="small"
                  />
                  <Chip
                    label={isLost ? 'LOST ITEM' : 'FOUND ITEM'}
                    color={isLost ? 'error' : 'success'}
                    variant="outlined"
                    size="small"
                  />
                  <Chip
                    label={selectedCase.category || 'Uncategorized'}
                    size="small"
                    sx={{ 
                      backgroundColor: getCategoryColor(selectedCase.category || '') + '20',
                      color: getCategoryColor(selectedCase.category || ''),
                    }}
                  />
                </Box>
              </Box>
              
              {isOwner && (
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <IconButton
                    onClick={() => setShowEditDialog(true)}
                    color="primary"
                    disabled={isSubmitting}
                  >
                    <Edit />
                  </IconButton>
                  <IconButton
                    onClick={handleStatusToggle}
                    color={selectedCase.status === 'active' ? 'success' : 'warning'}
                    disabled={isSubmitting}
                  >
                    {selectedCase.status === 'active' ? <CheckCircle /> : <Pending />}
                  </IconButton>
                  <IconButton
                    onClick={() => setShowDeleteDialog(true)}
                    color="error"
                    disabled={isSubmitting}
                  >
                    <Delete />
                  </IconButton>
                </Box>
              )}
            </Box>

            {/* Image Display */}
            {selectedCase.image_url ? (
              <Box sx={{ mb: 3 }}>
                <img
                  src={selectedCase.image_url}
                  alt={selectedCase.title}
                  style={{
                    width: '100%',
                    maxHeight: '400px',
                    objectFit: 'contain',
                    borderRadius: '8px',
                    backgroundColor: '#f5f5f5',
                  }}
                />
              </Box>
            ) : (
              <Paper
                variant="outlined"
                sx={{
                  p: 4,
                  mb: 3,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: '#fafafa',
                  borderRadius: 2,
                }}
              >
                <ImageIcon sx={{ fontSize: 48, color: 'text.disabled', mb: 2 }} />
                <Typography color="text.secondary">
                  No image available for this item
                </Typography>
              </Paper>
            )}

            {/* Description */}
            <Box sx={{ mb: 4 }}>
              <Typography variant="h6" gutterBottom fontWeight={600}>
                Description
              </Typography>
              <Typography variant="body1" paragraph>
                {selectedCase.description}
              </Typography>
            </Box>

            {/* Details Grid */}
            <Grid container spacing={2} sx={{ mb: 4 }}>
              <Grid item xs={12} sm={6}>
                <Paper variant="outlined" sx={{ p: 2 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                    <LocationOn color="action" sx={{ mr: 1 }} />
                    <Typography variant="subtitle2" color="text.secondary">
                      Location
                    </Typography>
                  </Box>
                  <Typography variant="body1" fontWeight={500}>
                    {selectedCase.location}
                  </Typography>
                </Paper>
              </Grid>

              <Grid item xs={12} sm={6}>
                <Paper variant="outlined" sx={{ p: 2 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                    <Schedule color="action" sx={{ mr: 1 }} />
                    <Typography variant="subtitle2" color="text.secondary">
                      Date
                    </Typography>
                  </Box>
                  <Typography variant="body1" fontWeight={500}>
                    {formatDate(selectedCase.created_at)}
                  </Typography>
                </Paper>
              </Grid>

              <Grid item xs={12} sm={6}>
                <Paper variant="outlined" sx={{ p: 2 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                    <Person color="action" sx={{ mr: 1 }} />
                    <Typography variant="subtitle2" color="text.secondary">
                      Contact Preference
                    </Typography>
                  </Box>
                  <Typography variant="body1" fontWeight={500}>
                    {selectedCase.contact_info === 'chat' && 'In-app Chat'}
                    {selectedCase.contact_info === 'email' && 'Email'}
                    {selectedCase.contact_info === 'phone' && 'Phone Call'}
                  </Typography>
                </Paper>
              </Grid>
            </Grid>

            {/* Timestamps */}
            <Typography variant="caption" color="text.secondary">
              Reported {formatRelativeTime(selectedCase.created_at)} • 
              Last updated {formatRelativeTime(selectedCase.updated_at)}
            </Typography>
          </Paper>
        </Grid>

        {/* Sidebar */}
        <Grid item xs={12} md={4}>
          {/* Reporter Info */}
          <Paper sx={{ p: 3, mb: 3, borderRadius: 2 }}>
            <Typography variant="h6" gutterBottom fontWeight={600}>
              Reporter Information
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <Avatar
                sx={{
                  width: 56,
                  height: 56,
                  mr: 2,
                  bgcolor: 'primary.main',
                  fontSize: '1.25rem',
                }}
              >
                {selectedCase.user_name?.[0] || 'U'}
              </Avatar>
              <Box>
                <Typography variant="subtitle1" fontWeight={600}>
                  {selectedCase.user_name}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {selectedCase.user_email || 'Email not provided'}
                </Typography>
              </Box>
            </Box>

            <Divider sx={{ my: 2 }} />

            {canContact && (
              <>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Contact the reporter about this item:
                </Typography>
                <Button
                  fullWidth
                  variant="contained"
                  startIcon={<ChatIcon />}
                  onClick={handleStartChat}
                  sx={{ mt: 1 }}
                >
                  Start Chat
                </Button>
                {selectedCase.contact_info === 'email' && selectedCase.user_email && (
                  <Button
                    fullWidth
                    variant="outlined"
                    startIcon={<Email />}
                    href={`mailto:${selectedCase.user_email}`}
                    sx={{ mt: 1 }}
                  >
                    Send Email
                  </Button>
                )}
                {selectedCase.contact_info === 'phone' && selectedCase.reporter_phone && (
                  <Button
                    fullWidth
                    variant="outlined"
                    startIcon={<Phone />}
                    href={`tel:${selectedCase.reporter_phone}`}
                    sx={{ mt: 1 }}
                  >
                    Call Reporter
                  </Button>
                )}
              </>
            )}

            {isOwner && (
              <Alert severity="info" sx={{ mt: 2 }}>
                This is your case. You can edit or delete it using the buttons above.
              </Alert>
            )}
          </Paper>

          {/* Safety Tips */}
          <Paper sx={{ p: 3, borderRadius: 2 }}>
            <Typography variant="h6" gutterBottom fontWeight={600}>
              Safety Tips
            </Typography>
            <List dense>
              <ListItem>
                <ListItemIcon sx={{ minWidth: 36 }}>
                  <Warning fontSize="small" color="warning" />
                </ListItemIcon>
                <ListItemText 
                  primary="Verify Ownership" 
                  secondary="Always ask for specific details to verify ownership"
                />
              </ListItem>
              <ListItem>
                <ListItemIcon sx={{ minWidth: 36 }}>
                  <Warning fontSize="small" color="warning" />
                </ListItemIcon>
                <ListItemText 
                  primary="Meet in Public" 
                  secondary="Arrange meetings in public areas on campus"
                />
              </ListItem>
              <ListItem>
                <ListItemIcon sx={{ minWidth: 36 }}>
                  <Warning fontSize="small" color="warning" />
                </ListItemIcon>
                <ListItemText 
                  primary="Campus Security" 
                  secondary="Report suspicious activity to campus security"
                />
              </ListItem>
            </List>
          </Paper>
        </Grid>
      </Grid>

      {/* Chat Window - REMOVED since we're redirecting */}
      {/* {showChat && canContact && selectedCase.user_id && (
        <ChatWindow
          caseId={selectedCase.id}
          receiverId={selectedCase.user_id}
          receiverName={selectedCase.user_name || 'Anonymous'}
          open={showChat}
          onClose={() => setShowChat(false)}
        />
      )} */}

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteDialog} onClose={() => setShowDeleteDialog(false)}>
        <DialogTitle>Delete Case</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete this case? This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowDeleteDialog(false)}>Cancel</Button>
          <Button onClick={handleDelete} color="error" disabled={isSubmitting}>
            {isSubmitting ? <CircularProgress size={20} /> : 'Delete'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Edit Dialog - REMOVED reward field */}
      <Dialog open={showEditDialog} onClose={() => setShowEditDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Edit Case</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            label="Title"
            value={editForm.title || ''}
            onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
            margin="normal"
          />
          <TextField
            fullWidth
            label="Description"
            multiline
            rows={4}
            value={editForm.description || ''}
            onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
            margin="normal"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowEditDialog(false)}>Cancel</Button>
          <Button onClick={handleEditSubmit} color="primary" disabled={isSubmitting}>
            {isSubmitting ? <CircularProgress size={20} /> : 'Save Changes'}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default CaseDetails;
