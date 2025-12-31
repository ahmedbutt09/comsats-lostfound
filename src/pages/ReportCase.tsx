import React, { useState } from 'react';
import {
  Container,
  Paper,
  Typography,
  Box,
  Button,
  Alert,
} from '@mui/material';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { caseService } from '../services/caseService';
import { storageService } from '../services/supabaseStorageService';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';
import CaseForm from '../components/cases/CaseForm';

const ReportCase: React.FC = () => {
  const [searchParams] = useSearchParams();
  const initialType = searchParams.get('type') as 'lost' | 'found' || 'lost';
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const { currentUser, userData } = useAuth();
  const navigate = useNavigate();

  if (!currentUser) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4, mb: 8 }}>
        <Alert severity="warning" sx={{ mb: 3 }}>
          Please login to report a lost or found item.
        </Alert>
        <Button variant="contained" onClick={() => navigate('/login')}>
          Go to Login
        </Button>
      </Container>
    );
  }

  const handleSubmit = async (data: any, imageFile?: File) => {
    // 1. Better Auth Check
    if (!currentUser) {
      toast.error('Your session has expired. Please login again.');
      navigate('/login');
      return;
    }
  
    setIsSubmitting(true);
    try {
      // 2. Upload image first
      let image_url = '';
      if (imageFile) {
        console.log("Attempting image upload for:", imageFile.name);
        try {
          const uploadResult = await storageService.uploadFile(
            'CASE_IMAGES', // Ensure this matches your Supabase Bucket Name exactly
            imageFile,
            currentUser.id
          );
          image_url = uploadResult.url;
          console.log("Upload successful, URL:", image_url);
        } catch (uploadError) {
          console.error("Storage Error:", uploadError);
          // Don't stop the whole process, just warn that image failed
          toast.error("Image upload failed, but we'll try to save the text.");
        }
      }
  
      // 3. Prepare data - mapping carefully to database columns
      const caseData = {
        type: data.type,
        title: data.title,
        description: data.description,
        category: data.category,
        location: data.location,
        reward: data.reward ? Number(data.reward) : null,
        status: 'active',
        user_id: currentUser.id,
        user_name: userData?.name || currentUser.email?.split('@')[0] || 'User',
        user_email: currentUser.email || '',
        contact_info: data.contact_info,
        image_url: image_url || null,
        created_at: new Date().toISOString(),
      };
  
      // 4. Save to Database
      // Using the 4 arguments as your service expects
      await caseService.createCase(
        caseData, 
        currentUser.id, 
        caseData.user_name,
        caseData.user_email
      );
      
      toast.success('Report submitted successfully!');
      // Navigate based on type
      navigate(data.type === 'lost' ? '/lost' : '/found');

    } catch (error: any) {
      console.error('Final Submission Error:', error);
      toast.error(error.message || 'Failed to save report.');
    } finally {
      setIsSubmitting(false);
    }
  };
  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 8 }}>
      <Paper 
        sx={{ 
          p: 3, 
          mb: 4, 
          background: 'linear-gradient(135deg, #1a237e 0%, #283593 100%)',
          color: 'white',
          borderRadius: 2,
        }}
      >
        <Typography variant="h4" component="h1" gutterBottom fontWeight={700}>
          Report {initialType === 'lost' ? 'Lost' : 'Found'} Item
        </Typography>
        <Typography variant="body1" sx={{ opacity: 0.9 }}>
          Provide detailed information about the {initialType === 'lost' ? 'item you lost' : 'item you found'}.
          Accurate information increases the chances of successful recovery.
        </Typography>
      </Paper>

      <Paper sx={{ p: { xs: 3, md: 4 }, borderRadius: 2 }}>
        <CaseForm
          onSubmit={handleSubmit}
          isLoading={isSubmitting}
          submitText="Submit Report"
          initialData={{
            type: initialType,
          }}
        />
      </Paper>
    </Container>
  );
};

export default ReportCase;