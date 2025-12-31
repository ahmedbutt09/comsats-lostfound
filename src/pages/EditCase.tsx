import React, { useState, useEffect } from 'react';
import {
  Container,
  Paper,
  Typography,
  Box,
  Button,
  Alert,
  CircularProgress,
  Breadcrumbs,
  Link as MuiLink,
} from '@mui/material';
import { Link as RouterLink, useParams, useNavigate } from 'react-router-dom';
import { ArrowBack, Home, Edit as EditIcon } from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import caseService from '../services/caseService';
import CaseForm from '../components/cases/CaseForm';
import { Case, User } from '../types';;
import toast from 'react-hot-toast';

// Define the form data type that matches CaseForm's output
interface CaseFormSubmitData {
  type: 'lost' | 'found';
  title: string;
  category: string;
  description: string;
  location: string;
  date: string;
  contact_info: 'chat' | 'email' | 'phone';
}

const EditCase: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { currentUser, userData, isAdmin } = useAuth();
  
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [caseData, setCaseData] = useState<Case | null>(null);

  useEffect(() => {
    if (id && currentUser) {
      loadCase();
    }
  }, [id, currentUser]);

  const loadCase = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const fetchedCase = await caseService.getCaseById(id!);
      
      // Check if user has permission to edit
      const canEdit = fetchedCase.user_id === currentUser?.id || isAdmin;
      if (!canEdit) {
        setError('You do not have permission to edit this case');
        return;
      }
      
      setCaseData(fetchedCase);
    } catch (err: any) {
      console.error('Error loading case:', err);
      setError(err.message || 'Failed to load case');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (data: CaseFormSubmitData, imageFile?: File) => {
    if (!id || !currentUser || !caseData) return;
    
    try {
      setSubmitting(true);
      setError(null);
      
      // Prepare update data - remove reward field
      const updateData = {
        type: data.type,
        title: data.title,
        description: data.description,
        category: data.category,
        location: data.location,
        contact_info: data.contact_info,
        updated_at: new Date().toISOString(),
      };
      
      await caseService.updateCase(
        id,
        updateData,
        currentUser.id,
        imageFile
      );
      
      toast.success('Case updated successfully!');
      navigate(`/case/${id}`);
    } catch (err: any) {
      console.error('Error updating case:', err);
      setError(err.message || 'Failed to update case');
      toast.error('Failed to update case');
    } finally {
      setSubmitting(false);
    }
  };

  if (!currentUser) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Alert severity="warning" sx={{ mb: 3 }}>
          Please login to edit cases.
        </Alert>
        <Button
          variant="contained"
          component={RouterLink}
          to="/login"
          startIcon={<ArrowBack />}
        >
          Go to Login
        </Button>
      </Container>
    );
  }

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ py: 8 }}>
        <Box sx={{ display: 'flex', justifyContent: 'center' }}>
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  if (error) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Alert 
          severity="error" 
          action={
            <Button color="inherit" size="small" onClick={() => navigate(-1)}>
              Go Back
            </Button>
          }
          sx={{ mb: 3 }}
        >
          {error}
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

  if (!caseData) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Alert severity="info" sx={{ mb: 3 }}>
          Case not found.
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
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {/* Breadcrumbs */}
      <Breadcrumbs sx={{ mb: 3 }}>
        <MuiLink
          component={RouterLink}
          to="/"
          color="inherit"
          sx={{ display: 'flex', alignItems: 'center' }}
        >
          <Home sx={{ mr: 0.5 }} fontSize="small" />
          Home
        </MuiLink>
        <MuiLink
          component={RouterLink}
          to="/my-cases"
          color="inherit"
        >
          My Cases
        </MuiLink>
        <MuiLink
          component={RouterLink}
          to={`/case/${id}`}
          color="inherit"
        >
          {caseData.title.substring(0, 20)}...
        </MuiLink>
        <Typography color="text.primary">Edit</Typography>
      </Breadcrumbs>

      <Paper elevation={0} sx={{ p: 3, mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
          <EditIcon sx={{ fontSize: 32, color: 'primary.main' }} />
          <Box>
            <Typography variant="h4" gutterBottom>
              Edit Case
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Update your {caseData.type} item details
            </Typography>
          </Box>
        </Box>

        <Alert severity="info" sx={{ mb: 3 }}>
          <Typography variant="body2">
            • Update only the fields that need changes<br />
            • Provide clear photos for better identification<br />
            • Include specific location details for better matches
          </Typography>
        </Alert>

        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        <CaseForm
          initialData={caseData}
          onSubmit={handleSubmit}
          isLoading={submitting}
          submitText="Update Case"
        />
      </Paper>

      <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
        <Button
          variant="outlined"
          startIcon={<ArrowBack />}
          onClick={() => navigate(`/case/${id}`)}
          disabled={submitting}
        >
          Cancel
        </Button>
      </Box>
    </Container>
  );
};

export default EditCase;