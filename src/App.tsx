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
    primary: {
      main: '#1a237e', // COMSATS Dark Blue
      light: '#534bae',
      dark: '#000051',
    },
    secondary: {
      main: '#ff6f00', // COMSATS Orange
      light: '#ffa040',
      dark: '#c43e00',
    },
    background: {
      default: '#f8f9fa',
      paper: '#ffffff',
    },
    text: {
      primary: '#2c3e50',
      secondary: '#7f8c8d',
    },
  },
  typography: {
    fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
    h1: {
      fontSize: '2.5rem',
      fontWeight: 700,
      color: '#1a237e',
    },
    h2: {
      fontSize: '2rem',
      fontWeight: 700,
      color: '#1a237e',
    },
    h3: {
      fontSize: '1.75rem',
      fontWeight: 600,
      color: '#1a237e',
    },
    h4: {
      fontSize: '1.5rem',
      fontWeight: 600,
      color: '#1a237e',
    },
    h5: {
      fontSize: '1.25rem',
      fontWeight: 600,
      color: '#1a237e',
    },
    h6: {
      fontSize: '1rem',
      fontWeight: 600,
      color: '#1a237e',
    },
  },
  shape: {
    borderRadius: 8,
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          fontWeight: 600,
          borderRadius: 8,
        },
        contained: {
          boxShadow: 'none',
          '&:hover': {
            boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
          },
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          boxShadow: '0 2px 10px rgba(0,0,0,0.08)',
          borderRadius: 8,
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 8,
        },
      },
    },
  },
});

// Private Route Wrapper
const PrivateRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { currentUser, loading } = useAuth();
  
  if (loading) return <LoadingSpinner message="Checking authentication..." />;
  
  if (!currentUser) return <Navigate to="/login" />;

  const isGoogleUser = currentUser.app_metadata?.provider === 'google';
  const isConfirmed = currentUser.email_confirmed_at || isGoogleUser;

  if (!isConfirmed) {
    return <Navigate to="/verify-email" />;
  }
  
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

// Query Client Configuration
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,
      retry: 1,
      refetchOnWindowFocus: false,
      refetchOnMount: true,
      refetchOnReconnect: true,
    },
    mutations: {
      retry: 1,
    },
  },
});

function App() {
  // Fix for APK: Capture Google Auth session changes immediately
  React.useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' && session) {
        console.log("Auth state changed: Signed In");
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <Toaster 
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: {
              background: '#363636',
              color: '#fff',
              borderRadius: '8px',
              fontSize: '14px',
            },
            success: {
              duration: 3000,
              iconTheme: {
                primary: '#4caf50',
                secondary: '#fff',
              },
            },
            error: {
              duration: 4000,
              iconTheme: {
                primary: '#f44336',
                secondary: '#fff',
              },
            },
            loading: {
              duration: Infinity,
            },
          }}
        />
        <AuthProvider>
          <Router>
            <ScrollToTop /> 
            <div className="App" style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
              <COMSATSHeader />
              <main style={{ flex: 1, padding: '0' }}>
                <Routes>
                  <Route path="/" element={<Home />} />
                  <Route 
                    path="/login" 
                    element={
                      <PublicRoute>
                        <Login />
                      </PublicRoute>
                    } 
                  />
                  <Route 
                    path="/register" 
                    element={
                      <PublicRoute>
                        <Register />
                      </PublicRoute>
                    } 
                  />
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
                  
                  <Route 
                    path="/dashboard" 
                    element={
                      <PrivateRoute>
                        <Dashboard />
                      </PrivateRoute>
                    } 
                  />
                  <Route 
                    path="/report" 
                    element={
                      <PrivateRoute>
                        <ReportCase />
                      </PrivateRoute>
                    } 
                  />
                  <Route 
                    path="/profile" 
                    element={
                      <PrivateRoute>
                        <Profile />
                      </PrivateRoute>
                    } 
                  />
                  <Route 
                    path="/my-cases" 
                    element={
                      <PrivateRoute>
                        <MyCases />
                      </PrivateRoute>
                    } 
                  />
                  <Route 
                    path="/edit-case/:id" 
                    element={
                      <PrivateRoute>
                        <EditCase />
                      </PrivateRoute>
                    } 
                  />
                  <Route 
                    path="/chat" 
                    element={
                      <PrivateRoute>
                        <Chat />
                      </PrivateRoute>
                    } 
                  />
                  <Route 
                    path="/messages" 
                    element={
                      <PrivateRoute>
                        <Messages />
                      </PrivateRoute>
                    } 
                  />
                  <Route 
                    path="/chat/:caseId" 
                    element={
                      <PrivateRoute>
                        <ChatWindowWrapper />
                      </PrivateRoute>
                    } 
                  />
                  <Route 
                    path="/admin" 
                    element={
                      <AdminRoute>
                        <AdminDashboard />
                      </AdminRoute>
                    } 
                  />
                  <Route 
                    path="/admin/cases" 
                    element={
                      <AdminRoute>
                        <AdminDashboard />
                      </AdminRoute>
                    } 
                  />
                  <Route 
                    path="/admin/users" 
                    element={
                      <AdminRoute>
                        <AdminDashboard />
                      </AdminRoute>
                    } 
                  />
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </main>
              <COMSATSFooter />
            </div>
          </Router>
          {process.env.NODE_ENV === 'development' && (
            <ReactQueryDevtools initialIsOpen={false} />
          )}
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
