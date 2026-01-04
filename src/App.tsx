import * as React from 'react';
import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';

// Import supabase client
import { supabase } from './lib/supabaseClient';
import { App as CapApp } from '@capacitor/app';

// Auth Components
import AdminLogin from './components/auth/AdminLogin';
import SetupAdmin from './pages/SetupAdmin';
import AdminRoute from './components/auth/AdminRoute';
import Login from './components/auth/Login';
import Register from './components/auth/Register';
import VerifyEmail from './pages/VerifyEmail';

// Common Components
import COMSATSHeader from './components/common/COMSATSHeader';
import COMSATSFooter from './components/common/COMSATSFooter';
import LoadingSpinner from './components/common/LoadingSpinner';
import ScrollToTop from './components/common/ScrollToTop';

// Pages
import Home from './pages/Home';
import Dashboard from './pages/Dashboard';
import LostItems from './pages/LostItems';
import FoundItems from './pages/FoundItems';
import ReportCase from './pages/ReportCase';
import Profile from './pages/Profile';
import MyCases from './pages/MyCases';
import CaseDetails from './pages/CaseDetails';
import AdminDashboard from './pages/AdminDashboard';
import TermsOfUse from './pages/TermsOfUse';
import PrivacyPolicy from './pages/PrivacyPolicy';

// Chat Pages
import Chat from './pages/Chat';
import Messages from './pages/Messages';
import ChatWindowWrapper from './components/chat/ChatWindowWrapper';

// Additional Pages
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import EditCase from './pages/EditCase';
import NotFound from './pages/NotFound';

const theme = createTheme({
  palette: {
    primary: { main: '#1a237e' },
    secondary: { main: '#ff6f00' },
    background: { default: '#f8f9fa', paper: '#ffffff' },
    text: { primary: '#2c3e50', secondary: '#7f8c8d' },
  },
  typography: {
    fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
  },
  shape: { borderRadius: 8 },
});

// Private Route Wrapper
const PrivateRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { currentUser, loading } = useAuth();
  if (loading) return <LoadingSpinner message="Checking authentication..." />;
  if (!currentUser) return <Navigate to="/login" />;
  
  const isGoogleUser = currentUser.app_metadata?.provider === 'google';
  const isConfirmed = currentUser.email_confirmed_at || isGoogleUser;
  if (!isConfirmed) return <Navigate to="/verify-email" />;
  
  return <>{children}</>;
};

// Public Route Wrapper
const PublicRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { currentUser, loading } = useAuth();
  if (loading) return <LoadingSpinner />;
  
  const isGoogleUser = currentUser?.app_metadata?.provider === 'google';
  if (currentUser && (currentUser.email_confirmed_at || isGoogleUser)) {
    return <Navigate to="/dashboard" />;
  }
  return <>{children}</>;
};

const queryClient = new QueryClient();

function AppContent() {
  const { refreshSession } = useAuth();

  React.useEffect(() => {
    const setupDeepLinks = async () => {
      CapApp.addListener('appUrlOpen', async (data: any) => {
        console.log('App opened with URL:', data.url);
        
        if (data.url.includes('comsatsapp://')) {
          // Parse tokens from URL hash
          const url = new URL(data.url.replace('comsatsapp://', 'https://placeholder.com/'));
          const hash = url.hash.substring(1);

          if (hash) {
            const params = new URLSearchParams(hash);
            const access_token = params.get('access_token');
            const refresh_token = params.get('refresh_token');

            if (access_token && refresh_token) {
              // 1. Manually set Supabase session
              await supabase.auth.setSession({ access_token, refresh_token });
              
              // 2. Wake up AuthContext to fetch profile/remove spinner
              await refreshSession();
              
              // 3. Force navigation to dashboard
              window.location.hash = '/dashboard';
            }
          }
        }
      });
    };

    setupDeepLinks();
    return () => { CapApp.removeAllListeners(); };
  }, [refreshSession]);

  return (
    <div className="App" style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <COMSATSHeader />
      <main style={{ flex: 1, padding: '0' }}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
          <Route path="/register" element={<PublicRoute><Register /></PublicRoute>} />
          <Route path="/privacy-policy" element={<PrivacyPolicy />} />
          <Route path="/terms-of-use" element={<TermsOfUse />} />
          <Route path="/admin-login" element={<AdminLogin />} />
          <Route path="/setup-admin" element={<SetupAdmin />} />
          <Route path="/lost" element={<LostItems />} />
          <Route path="/found" element={<FoundItems />} />
          <Route path="/case/:id" element={<CaseDetails />} />
          <Route path="/verify-email" element={<VerifyEmail />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          
          {/* Protected Routes */}
          <Route path="/dashboard" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
          <Route path="/report" element={<PrivateRoute><ReportCase /></PrivateRoute>} />
          <Route path="/profile" element={<PrivateRoute><Profile /></PrivateRoute>} />
          <Route path="/my-cases" element={<PrivateRoute><MyCases /></PrivateRoute>} />
          <Route path="/edit-case/:id" element={<PrivateRoute><EditCase /></PrivateRoute>} />
          <Route path="/chat" element={<PrivateRoute><Chat /></PrivateRoute>} />
          <Route path="/messages" element={<PrivateRoute><Messages /></PrivateRoute>} />
          <Route path="/chat/:caseId" element={<PrivateRoute><ChatWindowWrapper /></PrivateRoute>} />
          
          {/* Admin Routes */}
          <Route path="/admin" element={<AdminRoute><AdminDashboard /></AdminRoute>} />
          <Route path="/admin/cases" element={<AdminRoute><AdminDashboard /></AdminRoute>} />
          <Route path="/admin/users" element={<AdminRoute><AdminDashboard /></AdminRoute>} />
          
          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>
      <COMSATSFooter />
    </div>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <Toaster position="top-right" />
        <AuthProvider>
          <Router>
            <ScrollToTop /> 
            <AppContent />
          </Router>
          {process.env.NODE_ENV === 'development' && <ReactQueryDevtools initialIsOpen={false} />}
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
