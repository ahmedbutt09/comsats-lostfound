import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { CircularProgress, Box, Alert, Button } from '@mui/material';
import { Security, Lock } from '@mui/icons-material';

interface AdminRouteProps {
  children: React.ReactNode;
}

const AdminRoute: React.FC<AdminRouteProps> = ({ children }) => {
  const { currentUser, userData, loading, isAdmin } = useAuth();
  
  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <CircularProgress />
      </Box>
    );
  }
  
  if (!currentUser) {
    // Not logged in, redirect to admin login
    return <Navigate to="/admin-login" />;
  }
  
  if (!isAdmin) {
    // Logged in but not admin, show access denied
    return (
      <Box sx={{ 
        display: 'flex', 
        flexDirection: 'column', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '80vh',
        p: 3 
      }}>
        <Lock sx={{ fontSize: 80, color: 'error.main', mb: 3 }} />
        <Alert 
          severity="error" 
          sx={{ maxWidth: 500, mb: 3 }}
          action={
            <Button color="inherit" size="small" href="/dashboard">
              Go to Dashboard
            </Button>
          }
        >
          <strong>Access Denied</strong>
          <br />
          You do not have administrator privileges to access this page.
          <br />
          <small>Current role: {userData?.role || 'student'}</small>
        </Alert>
        <Button 
          variant="outlined" 
          startIcon={<Security />}
          onClick={() => window.history.back()}
        >
          Go Back
        </Button>
      </Box>
    );
  }
  
  // User is admin, render children
  return <>{children}</>;
};

export default AdminRoute;
